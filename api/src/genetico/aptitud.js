const {
  GEN,
  TIPO_OBLIGATORIO,
  esLaboratorio,
  obtenerBloques,
  nombreGen,
} = require('./genoma');

function resolverDesdeValor(valor, porIndice, porId) {
  if (valor == null) return null;
  if (Number.isInteger(valor) && porIndice?.[valor]) return porIndice[valor];
  return porId?.[valor] ?? null;
}

function construirMapas(genes, ctx) {
  const slotDocente = {};
  const slotSalon = {};
  const slotSemestre = {};

  const docentesByIndex = ctx.docentesByIndex;
  const docentesById = ctx.docentesById;
  const salonesByIndex = ctx.salonesByIndex;
  const salonesById = ctx.salonesById;

  for (const gen of genes) {
    const tieneDocente = gen[GEN.DOCENTE_ID] != null;
    const tieneSalon = gen[GEN.SALON_ID] != null;
    const esObligatorio = gen[GEN.TIPO] === TIPO_OBLIGATORIO && gen[GEN.SEMESTRE] && gen[GEN.CARRERA_ID];
    const docenteObj = tieneDocente ? resolverDesdeValor(gen[GEN.DOCENTE_ID], docentesByIndex, docentesById) : null;
    const docenteId = docenteObj ? docenteObj.id : gen[GEN.DOCENTE_ID];
    const salonObj = tieneSalon ? resolverDesdeValor(gen[GEN.SALON_ID], salonesByIndex, salonesById) : null;
    const salonId = salonObj ? salonObj.id : gen[GEN.SALON_ID];
    const bloques = obtenerBloques(gen);

    for (const { dia, periodoInicio, periodoFin } of bloques) {
      for (let periodo = periodoInicio; periodo <= periodoFin; periodo++) {
        if (tieneDocente) {
          const keyDocente = `${docenteId}-${dia}-${periodo}`;
          if (!slotDocente[keyDocente]) slotDocente[keyDocente] = [];
          slotDocente[keyDocente].push(gen);
        }

        if (tieneSalon) {
          const keySalon = `${salonId}-${dia}-${periodo}`;
          if (!slotSalon[keySalon]) slotSalon[keySalon] = [];
          slotSalon[keySalon].push(gen);
        }

        if (esObligatorio) {
          const keySemestre = `${gen[GEN.SEMESTRE]}-${gen[GEN.CARRERA_ID]}-${dia}-${periodo}`;
          if (!slotSemestre[keySemestre]) slotSemestre[keySemestre] = [];
          slotSemestre[keySemestre].push(gen);
        }
      }
    }
  }

  return { slotDocente, slotSalon, slotSemestre };
}

function penalizarConflictosDocente(slotDocente, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotDocente)) {
    if (genes.length > 1) {
      const conflictos = genes.length - 1;
      puntaje -= conflictos * 100;
      if (detalle) detalle.push({
        tipo: 'conflicto_docente',
        descripcion: `Docente ${genes[0][GEN.DOCENTE_ID]} tiene ${genes.length} asignaciones en slot ${key}`,
        penalizacion: conflictos * -100,
      });
    }
  }
  return puntaje;
}

function penalizarConflictosSalon(slotSalon, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotSalon)) {
    if (genes.length > 1) {
      const exceso = genes.length - 1;
      const penalizacion = exceso * 100 + (exceso - 1) * 50;
      puntaje -= penalizacion;
      if (detalle) detalle.push({
        tipo: 'conflicto_salon',
        descripcion: `Salón ${genes[0][GEN.SALON_ID]} tiene ${genes.length} asignaciones en slot ${key}`,
        penalizacion: -penalizacion,
      });
    }
  }
  return puntaje;
}

function penalizarConflictosSemestre(slotSemestre, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotSemestre)) {
    const cursos = new Set();
    for (const gen of genes) cursos.add(gen[GEN.CURSO_ID]);
    const cursosDistintos = cursos.size;
    if (cursosDistintos > 1) {
      const conflictos = cursosDistintos - 1;
      puntaje -= conflictos * 80;
      if (detalle) detalle.push({
        tipo: 'conflicto_semestre',
        descripcion: `Semestre ${genes[0][GEN.SEMESTRE]} carrera ${genes[0][GEN.CARRERA_ID]} tiene ${cursosDistintos} cursos obligatorios en slot ${key}`,
        penalizacion: conflictos * -80,
      });
    }
  }
  return puntaje;
}

function penalizarHorarioIncorrecto(genes, ctx, detalle) {
  let puntaje = 0;
  const periodosByIndex = ctx.periodosByIndex;
  const periodosById = ctx.periodosById;

  for (const gen of genes) {
    const periodo = resolverDesdeValor(gen[GEN.PERIODO_INICIO_ID], periodosByIndex, periodosById);
    if (!periodo) continue;

    if (periodo.es_manana && !gen[GEN.PUEDE_MANANA]) {
      puntaje -= 70;
      if (detalle) detalle.push({
        tipo: 'horario_incorrecto',
        descripcion: `Gen ${nombreGen(gen)} asignado en mañana pero puede_manana=false`,
        penalizacion: -70,
      });
    }

    if (periodo.es_tarde && !gen[GEN.PUEDE_TARDE]) {
      puntaje -= 70;
      if (detalle) detalle.push({
        tipo: 'horario_incorrecto',
        descripcion: `Gen ${nombreGen(gen)} asignado en tarde pero puede_tarde=false`,
        penalizacion: -70,
      });
    }
  }
  return puntaje;
}

function penalizarSalonInadecuado(genes, ctx, detalle) {
  let puntaje = 0;
  const salonesByIndex = ctx.salonesByIndex;
  const salonesById = ctx.salonesById;

  for (const gen of genes) {
    if (!gen[GEN.SALON_ID]) continue;
    const salon = resolverDesdeValor(gen[GEN.SALON_ID], salonesByIndex, salonesById);
    if (!salon) continue;

    if (!esLaboratorio(gen) && salon.es_laboratorio && !salon.lab_habilitado_teorico) {
      puntaje -= 60;
      if (detalle) detalle.push({
        tipo: 'salon_inadecuado',
        descripcion: `Curso teórico ${gen[GEN.SECCION_ID]} en laboratorio ${salon.nombre} no habilitado para teóricos`,
        penalizacion: -60,
      });
    }

    if (esLaboratorio(gen) && !salon.es_laboratorio) {
      puntaje -= 60;
      if (detalle) detalle.push({
        tipo: 'salon_inadecuado',
        descripcion: `Lab ${gen[GEN.SECCION_LAB_ID]} asignado a salón teórico ${salon.nombre}`,
        penalizacion: -60,
      });
    }
  }
  return puntaje;
}

function penalizarDocenteFueraDeHorario(genes, ctx, detalle) {
  let puntaje = 0;
  const docentesByIndex = ctx.docentesByIndex;
  const docentesById = ctx.docentesById;
  const periodosByIndex = ctx.periodosByIndex;
  const periodosById = ctx.periodosById;

  for (const gen of genes) {
    if (!gen[GEN.DOCENTE_ID]) continue;
    const docente = resolverDesdeValor(gen[GEN.DOCENTE_ID], docentesByIndex, docentesById);
    const periodo = resolverDesdeValor(gen[GEN.PERIODO_INICIO_ID], periodosByIndex, periodosById);
    if (!docente || !periodo) continue;

    if (periodo.hora_inicio < docente.hora_entrada || periodo.hora_fin > docente.hora_salida) {
      puntaje -= 50;
      if (detalle) detalle.push({
        tipo: 'docente_fuera_horario',
        descripcion: `Docente ${docente.nombre} asignado fuera de su horario (${periodo.hora_inicio}-${periodo.hora_fin})`,
        penalizacion: -50,
      });
    }
  }
  return puntaje;
}

function penalizarCapacidadSuperada(genes, ctx, detalle) {
  let puntaje = 0;
  const salonesByIndex = ctx.salonesByIndex;
  const salonesById = ctx.salonesById;

  for (const gen of genes) {
    if (!gen[GEN.SALON_ID] || !gen[GEN.NUM_ESTUDIANTES]) continue;
    const salon = resolverDesdeValor(gen[GEN.SALON_ID], salonesByIndex, salonesById);
    if (!salon || !salon.capacidad) continue;

    if (gen[GEN.NUM_ESTUDIANTES] > salon.capacidad) {
      puntaje -= 20;
      if (detalle) detalle.push({
        tipo: 'capacidad_superada',
        descripcion: `${gen[GEN.NUM_ESTUDIANTES]} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
        penalizacion: -20,
      });
    }
  }
  return puntaje;
}

function penalizarDocenteNoAutorizado(genes, ctx, detalle) {
  let puntaje = 0;
  const docentesByIndex = ctx.docentesByIndex;
  const docentesById = ctx.docentesById;

  for (const gen of genes) {
    if (!gen[GEN.DOCENTE_ID] || !gen[GEN.CURSO_ID]) continue;

    const posibles = esLaboratorio(gen)
      ? (ctx.docentesCursoLab[gen[GEN.CURSO_ID]] ?? ctx.docentesCurso[gen[GEN.CURSO_ID]] ?? [])
      : (ctx.docentesCurso[gen[GEN.CURSO_ID]] ?? []);

    const docenteObj = resolverDesdeValor(gen[GEN.DOCENTE_ID], docentesByIndex, docentesById);
    const docenteId = docenteObj ? docenteObj.id : gen[GEN.DOCENTE_ID];

    if (posibles.length > 0 && !posibles.includes(docenteId)) {
      puntaje -= 90;
      if (detalle) detalle.push({
        tipo: 'docente_no_autorizado',
        descripcion: `Docente ${docenteId} no está autorizado para curso ${gen[GEN.CURSO_ID]}`,
        penalizacion: -90,
      });
    }
  }
  return puntaje;
}

function penalizarSobreusoPeriodo(genes, detalle) {
  let puntaje = 0;
  const conteo = {};

  for (const gen of genes) {
    if (gen[GEN.SIN_SALON] || esLaboratorio(gen)) continue;
    // Usar valores crudos; si están null, usaremos "null" en la key (mejor que "undefined")
    const diaHorario = gen[GEN.DIA_HORARIO_ID] ?? 'null';
    const periodoInicio = gen[GEN.PERIODO_INICIO_ID] ?? 'null';
    const key = `${diaHorario}-${periodoInicio}`;
    conteo[key] = (conteo[key] ?? 0) + 1;
  }

  const maxSalones = 22;
  for (const [key, cantidad] of Object.entries(conteo)) {
    if (cantidad > maxSalones) {
      const exceso = cantidad - maxSalones;
      puntaje -= exceso * 80;
      if (detalle) detalle.push({
        tipo: 'sobreuso_periodo',
        descripcion: `Slot ${key} tiene ${cantidad} cursos para ${maxSalones} salones`,
        penalizacion: exceso * -80,
      });
    }
  }

  return puntaje;
}

function bonoContinuidadSemestre(genes, detalle) {
  let puntaje = 0;
  const grupos = {};

  for (const gen of genes) {
    if (gen[GEN.TIPO] !== TIPO_OBLIGATORIO || !gen[GEN.SEMESTRE] || !gen[GEN.CARRERA_ID]) continue;
    const bloques = obtenerBloques(gen);
    for (const { dia } of bloques) {
      const key = `${gen[GEN.SEMESTRE]}-${gen[GEN.CARRERA_ID]}-${dia}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push({ gen, dia });
    }
  }

  for (const [key, items] of Object.entries(grupos)) {
    if (items.length < 2) continue;
    items.sort((a, b) => a.gen[GEN.PERIODO_INICIO_ID] - b.gen[GEN.PERIODO_INICIO_ID]);
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].gen[GEN.PERIODO_FIN_ID] + 1 === items[i + 1].gen[GEN.PERIODO_INICIO_ID]) {
        puntaje += 30;
        if (detalle) detalle.push({
          tipo: 'continuidad_semestre',
          descripcion: `Semestre ${items[i].gen[GEN.SEMESTRE]} carrera ${items[i].gen[GEN.CARRERA_ID]}: cursos consecutivos en día ${items[i].dia}`,
          bono: 30,
        });
      }
    }
  }

  return puntaje;
}

function bonoCapacidadAdecuada(genes, ctx, detalle) {
  let puntaje = 0;
  const salonesByIndex = ctx.salonesByIndex;
  const salonesById = ctx.salonesById;

  for (const gen of genes) {
    if (!gen[GEN.SALON_ID] || !gen[GEN.NUM_ESTUDIANTES]) continue;
    const salon = resolverDesdeValor(gen[GEN.SALON_ID], salonesByIndex, salonesById);
    if (!salon || !salon.capacidad) continue;

    if (gen[GEN.NUM_ESTUDIANTES] <= salon.capacidad) {
      puntaje += 10;
      if (detalle) detalle.push({
        tipo: 'capacidad_adecuada',
        descripcion: `${gen[GEN.NUM_ESTUDIANTES]} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
        bono: 10,
      });
    }
  }
  return puntaje;
}

function evaluarAptitud(individuo, ctx, conDetalle = false) {
  const genes = individuo.genes;
  const detalle = conDetalle ? [] : null;

  const { slotDocente, slotSalon, slotSemestre } = construirMapas(genes, ctx);

  const aptitud =
    penalizarConflictosDocente(slotDocente, detalle) +
    penalizarConflictosSalon(slotSalon, detalle) +
    penalizarConflictosSemestre(slotSemestre, detalle) +
    penalizarHorarioIncorrecto(genes, ctx, detalle) +
    penalizarSalonInadecuado(genes, ctx, detalle) +
    penalizarDocenteFueraDeHorario(genes, ctx, detalle) +
    penalizarCapacidadSuperada(genes, ctx, detalle) +
    penalizarDocenteNoAutorizado(genes, ctx, detalle) +
    penalizarSobreusoPeriodo(genes, detalle) +
    bonoContinuidadSemestre(genes, detalle) +
    bonoCapacidadAdecuada(genes, ctx, detalle);

  individuo.aptitud = aptitud;
  return conDetalle ? { aptitud, detalle } : { aptitud };
}

function evaluarPoblacion(poblacion, ctx) {
  for (const individuo of poblacion) evaluarAptitud(individuo, ctx);
  return poblacion.sort((a, b) => b.aptitud - a.aptitud);
}

module.exports = {
  evaluarAptitud,
  evaluarPoblacion,
  obtenerBloques,
};