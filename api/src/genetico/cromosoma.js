function elegirAlAzar(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
 
function periodosValidos(ctx, puede_manana, puede_tarde, docente_id, num_periodos = 1) {
  const docente = ctx.docentes.find(d => d.id === docente_id);
 
  return ctx.periodos.filter(p => {
    if (!puede_manana && p.es_manana) return false;
    if (!puede_tarde  && p.es_tarde)  return false;
 
    if (docente) {
      if (p.hora_inicio < docente.hora_entrada) return false;
      if (p.hora_fin    > docente.hora_salida)  return false;
    }
 
    if (num_periodos > 1) {
      const idx = ctx.periodos.findIndex(x => x.id === p.id);
      for (let i = 1; i < num_periodos; i++) {
        const sig = ctx.periodos[idx + i];
        if (!sig) return false;
        if (p.es_manana !== sig.es_manana) return false;
      }
    }
 
    return true;
  });
}
 
function salonesValidos(ctx, es_laboratorio, periodo_inicio_id) {
  const periodo = ctx.periodos.find(p => p.id === periodo_inicio_id);
 
  return ctx.salones.filter(s => {
    if (es_laboratorio) {
      if (!s.es_laboratorio) return false;
    } else {
      if (s.es_laboratorio && !s.lab_habilitado_teorico) return false;
    }
    if (periodo) {
      if (periodo.es_manana && !s.disponible_manana) return false;
      if (periodo.es_tarde  && !s.disponible_tarde)  return false;
    }
    return true;
  });
}
 
function calcularPeriodoFin(ctx, periodo_inicio_id, num_periodos) {
  if (num_periodos <= 1) return periodo_inicio_id;
  const idx = ctx.periodos.findIndex(p => p.id === periodo_inicio_id);
  const fin = ctx.periodos[idx + (num_periodos - 1)];
  return fin ? fin.id : periodo_inicio_id;
}
 
// ----------------- DISTRIBUCIÓN DE LABORATORIOS ----------------
 
/**
 * Genera o recalcula la distribucion_lab de un gen de laboratorio.
 * Elige aleatoriamente entre las 4 opciones y asigna periodos válidos.
 *
 *   { martes: 3, jueves: 0 }  — 3 periodos seguidos el martes
 *   { martes: 0, jueves: 3 }  — 3 periodos seguidos el jueves
 *   { martes: 2, jueves: 1 }  — 2 martes + 1 jueves
 *   { martes: 1, jueves: 2 }  — 1 martes + 2 jueves
 *
 * @param {Object}  lab        - metadatos del laboratorio
 * @param {Contexto} ctx
 * @param {number}  docente_id
 * @returns {{ martes, jueves }}
 */
function generarDistribucionLab(lab, ctx, docente_id) {
  const opcion = elegirAlAzar([
    { martes: 3, jueves: 0 },
    { martes: 0, jueves: 3 },
    { martes: 2, jueves: 1 },
    { martes: 1, jueves: 2 },
  ]);
 
  const bloque = (numPeriodos) => {
    if (numPeriodos === 0) {
      return { num_periodos: 0, periodo_inicio_id: null, periodo_fin_id: null };
    }
    const validos = periodosValidos(
      ctx, lab.puede_manana, lab.puede_tarde, docente_id, numPeriodos
    );
    const p = elegirAlAzar(validos);
    return {
      num_periodos:      numPeriodos,
      periodo_inicio_id: p?.id ?? null,
      periodo_fin_id:    p ? calcularPeriodoFin(ctx, p.id, numPeriodos) : null,
    };
  };
 
  return {
    martes: bloque(opcion.martes),
    jueves: bloque(opcion.jueves),
  };
}
 
// ------------------ GENERACIÓN DE INDIVIDUOS ----------------
 
function generarGenSeccion(seccion, ctx) {
  const dia_horario_id = seccion.dia_horario_fijo_id ?? 1;
 
  let docente_id = seccion.docente_fijo_id;
  if (!docente_id) {
    const posibles = ctx.docentesCurso[seccion.curso_id] ?? [];

    if (posibles.length > 0) {
      // Hay relación docente-curso definida - respetar estrictamente
      docente_id = elegirAlAzar(posibles);
    } else {
      // No hay relación definida - cualquier docente activo
      docente_id = elegirAlAzar(ctx.docentes.map(d => d.id));
    }
  }
 
  let periodo_inicio_id = seccion.periodo_fijo_inicio_id;
  if (!periodo_inicio_id) {
    const validos = periodosValidos(
      ctx, seccion.puede_manana, seccion.puede_tarde, docente_id, 1
    );
    periodo_inicio_id = elegirAlAzar(validos)?.id ?? ctx.periodos[0].id;
  }
 
  let salon_id = null;
  if (!seccion.sin_salon) {
    salon_id = seccion.salon_fijo_id;
    if (!salon_id) {
      const validos = salonesValidos(ctx, false, periodo_inicio_id);
      salon_id = elegirAlAzar(validos)?.id ?? null;
    }
  }
 
  return {
    seccion_id:             seccion.id,
    seccion_lab_id:         null,
    salon_id,
    docente_id,
    periodo_inicio_id,
    periodo_fin_id:         periodo_inicio_id,
    dia_horario_id,
    distribucion_lab:       null,
    curso_id:               seccion.curso_id,
    es_laboratorio:         false,
    sin_salon:              seccion.sin_salon,
    semestre:               seccion.semestre,
    carrera_id:             seccion.carrera_id,
    tipo:                   seccion.tipo,
    puede_manana:           seccion.puede_manana,
    puede_tarde:            seccion.puede_tarde,
    num_estudiantes:        seccion.num_estudiantes,
    salon_fijo_id:          seccion.salon_fijo_id          ?? null,
    docente_fijo_id:        seccion.docente_fijo_id        ?? null,
    periodo_fijo_inicio_id: seccion.periodo_fijo_inicio_id ?? null,
    dia_horario_fijo_id:    seccion.dia_horario_fijo_id    ?? null,
  };
}
 
function generarGenLab(lab, ctx) {
  const dia_horario_id = lab.dia_horario_fijo_id ?? 2;
 
  let docente_id = lab.docente_fijo_id;
  if (!docente_id) {
    const posiblesLab = ctx.docentesCursoLab[lab.curso_id] ?? [];
    const posibles    = ctx.docentesCurso[lab.curso_id]    ?? [];

    if (posiblesLab.length > 0) {
      docente_id = elegirAlAzar(posiblesLab);
    } else if (posibles.length > 0) {
      docente_id = elegirAlAzar(posibles);
    } else {
      docente_id = elegirAlAzar(ctx.docentes.map(d => d.id));
    }
  }
 
  const distribucion_lab = generarDistribucionLab(lab, ctx, docente_id);
 
  // periodo_inicio_id apunta al primer bloque disponible
  const periodo_inicio_id =
    distribucion_lab.martes.periodo_inicio_id ??
    distribucion_lab.jueves.periodo_inicio_id ??
    ctx.periodos[0].id;
 
  const periodo_fin_id =
    distribucion_lab.jueves.periodo_fin_id ??
    distribucion_lab.martes.periodo_fin_id ??
    periodo_inicio_id;
 
  let salon_id = lab.salon_fijo_id;
  if (!salon_id) {
    const validos = salonesValidos(ctx, true, periodo_inicio_id);
    salon_id = elegirAlAzar(validos)?.id ?? null;
  }
 
  return {
    seccion_id:             null,
    seccion_lab_id:         lab.id,
    salon_id,
    docente_id,
    periodo_inicio_id,
    periodo_fin_id,
    dia_horario_id,
    distribucion_lab,
    curso_id:               lab.curso_id,
    es_laboratorio:         true,
    sin_salon:              false,
    semestre:               lab.semestre,
    carrera_id:             lab.carrera_id,
    tipo:                   'obligatorio',
    puede_manana:           lab.puede_manana,
    puede_tarde:            lab.puede_tarde,
    num_estudiantes:        lab.num_estudiantes,
    salon_fijo_id:          lab.salon_fijo_id          ?? null,
    docente_fijo_id:        lab.docente_fijo_id        ?? null,
    periodo_fijo_inicio_id: lab.periodo_fijo_inicio_id ?? null,
    dia_horario_fijo_id:    lab.dia_horario_fijo_id    ?? null,
  };
}
 
// ------------- INDIVIDUO Y POBLACIÓN INICIAL ----------------
 
function generarIndividuo(ctx) {
  return {
    genes: [
      ...ctx.secciones.map(s => generarGenSeccion(s, ctx)),
      ...ctx.labs.map(l      => generarGenLab(l, ctx)),
    ],
    aptitud: null,
  };
}
 
function generarPoblacion(ctx) {
  const n = ctx.config.tamano_poblacion;
  return Array.from({ length: n }, () => generarIndividuo(ctx));
}
 
// ------------- REPARACIÓN DE INDIVIDUOS ----------------
 
function repararIndividuo(individuo) {
  individuo.genes = individuo.genes.map(gen => {
    if (gen.salon_fijo_id)          gen.salon_id          = gen.salon_fijo_id;
    if (gen.docente_fijo_id)        gen.docente_id        = gen.docente_fijo_id;
    if (gen.periodo_fijo_inicio_id) gen.periodo_inicio_id = gen.periodo_fijo_inicio_id;
    if (gen.dia_horario_fijo_id)    gen.dia_horario_id    = gen.dia_horario_fijo_id;
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