const {
  GEN,
  TIPO_OBLIGATORIO,
  TIPO_OPTATIVO,
  crearGenBase,
  elegirAlAzar,
  setDistribucionLab,
  periodoIndexFromId,
  salonIndexFromId,
  docenteIndexFromId,
} = require('./genoma');

function periodosValidos(ctx, puede_manana, puede_tarde, docente_id, num_periodos = 1) {
  // docente_id may be a DB id; buscar por id
  const docente = ctx.docentesById?.[docente_id] ?? ctx.docentes.find(d => d.id === docente_id);

  return ctx.periodos.filter(periodo => {
    if (!puede_manana && periodo.es_manana) return false;
    if (!puede_tarde && periodo.es_tarde) return false;

    if (docente) {
      if (periodo.hora_inicio < docente.hora_entrada) return false;
      if (periodo.hora_fin > docente.hora_salida) return false;
    }

    if (num_periodos > 1) {
      const idx = ctx.periodos.findIndex(x => x.id === periodo.id);
      for (let i = 1; i < num_periodos; i++) {
        const sig = ctx.periodos[idx + i];
        if (!sig) return false;
        if (periodo.es_manana !== sig.es_manana) return false;
      }
    }

    return true;
  });
}

function salonesValidos(ctx, es_laboratorio, periodo_inicio_id) {
  // periodo_inicio_id here is a DB id
  const periodo = ctx.periodosById?.[periodo_inicio_id] ?? ctx.periodos.find(p => p.id === periodo_inicio_id);

  return ctx.salones.filter(salon => {
    if (es_laboratorio) {
      if (!salon.es_laboratorio) return false;
    } else if (salon.es_laboratorio && !salon.lab_habilitado_teorico) {
      return false;
    }

    if (periodo) {
      if (periodo.es_manana && !salon.disponible_manana) return false;
      if (periodo.es_tarde && !salon.disponible_tarde) return false;
    }

    return true;
  });
}

function calcularPeriodoFin(ctx, periodo_inicio_id, num_periodos) {
  if (num_periodos <= 1) return periodo_inicio_id;
  const idx = ctx.periodos.findIndex(periodo => periodo.id === periodo_inicio_id);
  const fin = ctx.periodos[idx + (num_periodos - 1)];
  return fin ? fin.id : periodo_inicio_id;
}

function generarDistribucionLab(lab, ctx, docente_id) {
  const opcion = elegirAlAzar([
    { martes: 3, jueves: 0 },
    { martes: 0, jueves: 3 },
    { martes: 2, jueves: 1 },
    { martes: 1, jueves: 2 },
  ]);

  const bloque = numPeriodos => {
    if (numPeriodos === 0) {
      return { num_periodos: 0, periodo_inicio_id: null, periodo_fin_id: null };
    }

    const validos = periodosValidos(ctx, lab.puede_manana, lab.puede_tarde, docente_id, numPeriodos);
      const periodo = elegirAlAzar(validos);
      return {
        num_periodos: numPeriodos,
        periodo_inicio_id: periodo?.id ?? null,
        periodo_fin_id: periodo ? calcularPeriodoFin(ctx, periodo.id, numPeriodos) : null,
      };
  };

  return {
    martes: bloque(opcion.martes),
    jueves: bloque(opcion.jueves),
  };
}

function generarGenSeccion(seccion, ctx, genesYaAsignados = []) {
  const dia_horario_id = seccion.dia_horario_fijo_id ?? 1;

  let docente_id = seccion.docente_fijo_id;
  if (!docente_id) {
    const posibles = ctx.docentesCurso[seccion.curso_id] ?? [];
    docente_id = posibles.length > 0
      ? elegirAlAzar(posibles)
      : elegirAlAzar(ctx.docentes.map(docente => docente.id));
  }

  let periodo_inicio_id = seccion.periodo_fijo_inicio_id;
  if (!periodo_inicio_id) {
    const validos = periodosValidos(ctx, seccion.puede_manana, seccion.puede_tarde, docente_id, 1);
    periodo_inicio_id = elegirAlAzar(validos)?.id ?? ctx.periodos[0].id;
  }

  let salon_id = null;
  if (!seccion.sin_salon) {
    salon_id = seccion.salon_fijo_id;
    if (!salon_id) {
      const validos = salonesValidos(ctx, false, periodo_inicio_id);

      const ocupados = new Set(
        genesYaAsignados
          .filter(gen => gen[GEN.DIA_HORARIO_ID] === dia_horario_id &&
            gen[GEN.PERIODO_INICIO_ID] === periodo_inicio_id &&
            gen[GEN.SALON_ID])
          .map(gen => gen[GEN.SALON_ID])
      );

      const libres = validos.filter(salon => !ocupados.has(salon.id));
      salon_id = elegirAlAzar(libres.length > 0 ? libres : validos)?.id ?? null;
    }
  }

  const gen = crearGenBase();
  gen[GEN.SECCION_ID] = seccion.id;
  gen[GEN.SECCION_LAB_ID] = null;
  // Guardar índices compactos (si hay valor, convertir a índice usando el contexto)
  gen[GEN.SALON_ID] = salon_id ? salonIndexFromId(ctx, salon_id) : null;
  gen[GEN.DOCENTE_ID] = docente_id ? docenteIndexFromId(ctx, docente_id) : null;
  gen[GEN.PERIODO_INICIO_ID] = periodo_inicio_id ? periodoIndexFromId(ctx, periodo_inicio_id) : null;
  gen[GEN.PERIODO_FIN_ID] = periodoIndexFromId(ctx, periodo_inicio_id);
  gen[GEN.DIA_HORARIO_ID] = dia_horario_id;
  gen[GEN.ES_LABORATORIO] = 0;
  gen[GEN.SIN_SALON] = seccion.sin_salon ? 1 : 0;
  gen[GEN.CURSO_ID] = seccion.curso_id;
  gen[GEN.SEMESTRE] = seccion.semestre;
  gen[GEN.CARRERA_ID] = seccion.carrera_id;
  gen[GEN.TIPO] = seccion.tipo === 'obligatorio' ? TIPO_OBLIGATORIO : TIPO_OPTATIVO;
  gen[GEN.PUEDE_MANANA] = seccion.puede_manana ? 1 : 0;
  gen[GEN.PUEDE_TARDE] = seccion.puede_tarde ? 1 : 0;
  gen[GEN.NUM_ESTUDIANTES] = seccion.num_estudiantes ?? null;
  gen[GEN.SALON_FIJO_ID] = seccion.salon_fijo_id ?? null;
  gen[GEN.DOCENTE_FIJO_ID] = seccion.docente_fijo_id ?? null;
  gen[GEN.PERIODO_FIJO_INICIO_ID] = seccion.periodo_fijo_inicio_id ?? null;
  gen[GEN.DIA_HORARIO_FIJO_ID] = seccion.dia_horario_fijo_id ?? null;
  return gen;
}

function generarGenLab(lab, ctx) {
  const dia_horario_id = lab.dia_horario_fijo_id ?? 2;

  let docente_id = lab.docente_fijo_id;
  if (!docente_id) {
    const posiblesLab = ctx.docentesCursoLab[lab.curso_id] ?? [];
    const posibles = ctx.docentesCurso[lab.curso_id] ?? [];

    if (posiblesLab.length > 0) {
      docente_id = elegirAlAzar(posiblesLab);
    } else if (posibles.length > 0) {
      docente_id = elegirAlAzar(posibles);
    } else {
      docente_id = elegirAlAzar(ctx.docentes.map(docente => docente.id));
    }
  }

  const distribucionLab = generarDistribucionLab(lab, ctx, docente_id);
  const periodo_inicio_id =
    distribucionLab.martes.periodo_inicio_id ??
    distribucionLab.jueves.periodo_inicio_id ??
    ctx.periodos[0].id;

  const periodo_fin_id =
    distribucionLab.jueves.periodo_fin_id ??
    distribucionLab.martes.periodo_fin_id ??
    periodo_inicio_id;

  let salon_id = lab.salon_fijo_id;
  if (!salon_id) {
    const validos = salonesValidos(ctx, true, periodo_inicio_id);
    salon_id = elegirAlAzar(validos)?.id ?? null;
  }

  const gen = crearGenBase();
  gen[GEN.SECCION_ID] = null;
  gen[GEN.SECCION_LAB_ID] = lab.id;
  gen[GEN.SALON_ID] = salon_id ? salonIndexFromId(ctx, salon_id) : null;
  gen[GEN.DOCENTE_ID] = docente_id ? docenteIndexFromId(ctx, docente_id) : null;
  gen[GEN.PERIODO_INICIO_ID] = periodoIndexFromId(ctx, periodo_inicio_id);
  gen[GEN.PERIODO_FIN_ID] = periodoIndexFromId(ctx, periodo_fin_id);
  gen[GEN.DIA_HORARIO_ID] = dia_horario_id;
  gen[GEN.ES_LABORATORIO] = 1;
  gen[GEN.SIN_SALON] = 0;
  gen[GEN.CURSO_ID] = lab.curso_id;
  gen[GEN.SEMESTRE] = lab.semestre;
  gen[GEN.CARRERA_ID] = lab.carrera_id;
  gen[GEN.TIPO] = TIPO_OBLIGATORIO;
  gen[GEN.PUEDE_MANANA] = lab.puede_manana ? 1 : 0;
  gen[GEN.PUEDE_TARDE] = lab.puede_tarde ? 1 : 0;
  gen[GEN.NUM_ESTUDIANTES] = lab.num_estudiantes ?? null;
  gen[GEN.SALON_FIJO_ID] = lab.salon_fijo_id ? salonIndexFromId(ctx, lab.salon_fijo_id) : null;
  gen[GEN.DOCENTE_FIJO_ID] = lab.docente_fijo_id ? docenteIndexFromId(ctx, lab.docente_fijo_id) : null;
  gen[GEN.PERIODO_FIJO_INICIO_ID] = lab.periodo_fijo_inicio_id ? periodoIndexFromId(ctx, lab.periodo_fijo_inicio_id) : null;
  gen[GEN.DIA_HORARIO_FIJO_ID] = lab.dia_horario_fijo_id ?? null;
  // Convertir distribución a índices antes de guardar
  const distribIdx = {
    martes: {
      num_periodos: distribucionLab.martes.num_periodos,
      periodo_inicio_id: distribucionLab.martes.periodo_inicio_id ? periodoIndexFromId(ctx, distribucionLab.martes.periodo_inicio_id) : null,
      periodo_fin_id: distribucionLab.martes.periodo_fin_id ? periodoIndexFromId(ctx, distribucionLab.martes.periodo_fin_id) : null,
    },
    jueves: {
      num_periodos: distribucionLab.jueves.num_periodos,
      periodo_inicio_id: distribucionLab.jueves.periodo_inicio_id ? periodoIndexFromId(ctx, distribucionLab.jueves.periodo_inicio_id) : null,
      periodo_fin_id: distribucionLab.jueves.periodo_fin_id ? periodoIndexFromId(ctx, distribucionLab.jueves.periodo_fin_id) : null,
    }
  };
  setDistribucionLab(gen, distribIdx);
  return gen;
}

function generarIndividuo(ctx) {
  const genes = [];
  for (const seccion of ctx.secciones) {
    genes.push(generarGenSeccion(seccion, ctx, genes));
  }
  for (const lab of ctx.labs) {
    genes.push(generarGenLab(lab, ctx, genes));
  }
  return { genes, aptitud: null };
}

function generarPoblacion(ctx) {
  const n = ctx.config.tamano_poblacion;
  return Array.from({ length: n }, () => generarIndividuo(ctx));
}

function repararIndividuo(individuo) {
  individuo.genes = individuo.genes.map(gen => {
    if (gen[GEN.SALON_FIJO_ID]) gen[GEN.SALON_ID] = gen[GEN.SALON_FIJO_ID];
    if (gen[GEN.DOCENTE_FIJO_ID]) gen[GEN.DOCENTE_ID] = gen[GEN.DOCENTE_FIJO_ID];
    if (gen[GEN.PERIODO_FIJO_INICIO_ID]) gen[GEN.PERIODO_INICIO_ID] = gen[GEN.PERIODO_FIJO_INICIO_ID];
    if (gen[GEN.DIA_HORARIO_FIJO_ID]) gen[GEN.DIA_HORARIO_ID] = gen[GEN.DIA_HORARIO_FIJO_ID];
    return gen;
  });
  individuo.aptitud = null;
  return individuo;
}

module.exports = {
  generarIndividuo,
  generarPoblacion,
  repararIndividuo,
  generarDistribucionLab,
  elegirAlAzar,
  periodosValidos,
  salonesValidos,
  calcularPeriodoFin,
};