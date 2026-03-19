// PENALIZACIONES:
//   -100  conflicto de docente
//   -100  conflicto de salón
//    -80  conflicto de semestre
//    -70  horario incorrecto (mañana/tarde)
//    -60  salón inadecuado
//    -50  docente fuera de horario
//    -20  capacidad superada (soft)
//
// BONOS:
//    +30  cursos del mismo semestre consecutivos
//    +10  salón con capacidad adecuada
// ============================================================

// IDs de días individuales (tabla dias)
const ID_MARTES = 2;
const ID_JUEVES = 4;

// ------------- HELPERS DE BLOQUES----------------

/**
 * Retorna los bloques de tiempo que ocupa un gen.
 * Cursos teóricos  → un bloque con dia_horario_id.
 * Labs con distribucion_lab → uno o dos bloques (martes y/o jueves).
 */
function obtenerBloques(gen) {
  if (!gen.es_laboratorio || !gen.distribucion_lab) {
    return [{
      dia:           gen.dia_horario_id,
      periodoInicio: gen.periodo_inicio_id,
      periodoFin:    gen.periodo_fin_id,
    }];
  }

  const bloques = [];
  const { martes, jueves } = gen.distribucion_lab;

  if (martes.num_periodos > 0 && martes.periodo_inicio_id) {
    bloques.push({
      dia:           ID_MARTES,
      periodoInicio: martes.periodo_inicio_id,
      periodoFin:    martes.periodo_fin_id,
    });
  }

  if (jueves.num_periodos > 0 && jueves.periodo_inicio_id) {
    bloques.push({
      dia:           ID_JUEVES,
      periodoInicio: jueves.periodo_inicio_id,
      periodoFin:    jueves.periodo_fin_id,
    });
  }

  return bloques;
}

// --------------- CONSTRUCCIÓN DE MAPAS ----------------

function construirMapas(genes) {
  const slotDocente  = {};
  const slotSalon    = {};
  const slotSemestre = {};

  for (const gen of genes) {
    const bloques = obtenerBloques(gen);

    for (const { dia, periodoInicio, periodoFin } of bloques) {
      for (let p = periodoInicio; p <= periodoFin; p++) {

        if (gen.docente_id) {
          const keyD = `${gen.docente_id}-${dia}-${p}`;
          if (!slotDocente[keyD]) slotDocente[keyD] = [];
          slotDocente[keyD].push(gen);
        }

        if (gen.salon_id) {
          const keyS = `${gen.salon_id}-${dia}-${p}`;
          if (!slotSalon[keyS]) slotSalon[keyS] = [];
          slotSalon[keyS].push(gen);
        }

        if (gen.tipo === 'obligatorio' && gen.semestre && gen.carrera_id) {
          const keyM = `${gen.semestre}-${gen.carrera_id}-${dia}-${p}`;
          if (!slotSemestre[keyM]) slotSemestre[keyM] = [];
          slotSemestre[keyM].push(gen);
        }
      }
    }
  }

  return { slotDocente, slotSalon, slotSemestre };
}

// ----------------------- PENALIZACIONES -----------------------

function penalizarConflictosDocente(slotDocente, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotDocente)) {
    if (genes.length > 1) {
      const conflictos = genes.length - 1;
      puntaje -= conflictos * 100;
      if (detalle) detalle.push({
        tipo: 'conflicto_docente',
        descripcion: `Docente ${genes[0].docente_id} tiene ${genes.length} asignaciones en slot ${key}`,
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
      const conflictos = genes.length - 1;
      puntaje -= conflictos * 100;
      if (detalle) detalle.push({
        tipo: 'conflicto_salon',
        descripcion: `Salón ${genes[0].salon_id} tiene ${genes.length} asignaciones en slot ${key}`,
        penalizacion: conflictos * -100,
      });
    }
  }
  return puntaje;
}

function penalizarConflictosSemestre(slotSemestre, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotSemestre)) {
    const porCurso = {};
    for (const gen of genes) {
      const cursoKey = gen.seccion_id ?? `lab-${gen.seccion_lab_id}`;
      if (!porCurso[cursoKey]) porCurso[cursoKey] = gen;
    }
    const cursosDistintos = Object.keys(porCurso).length;
    if (cursosDistintos > 1) {
      const conflictos = cursosDistintos - 1;
      puntaje -= conflictos * 80;
      if (detalle) detalle.push({
        tipo: 'conflicto_semestre',
        descripcion: `Semestre ${genes[0].semestre} carrera ${genes[0].carrera_id} tiene ${cursosDistintos} cursos obligatorios en slot ${key}`,
        penalizacion: conflictos * -80,
      });
    }
  }
  return puntaje;
}

function penalizarHorarioIncorrecto(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    const periodo = ctx.periodos.find(p => p.id === gen.periodo_inicio_id);
    if (!periodo) continue;
    if (periodo.es_manana && !gen.puede_manana) {
      puntaje -= 70;
      if (detalle) detalle.push({
        tipo: 'horario_incorrecto',
        descripcion: `Gen ${gen.seccion_id ?? 'lab-' + gen.seccion_lab_id} asignado en mañana pero puede_manana=false`,
        penalizacion: -70,
      });
    }
    if (periodo.es_tarde && !gen.puede_tarde) {
      puntaje -= 70;
      if (detalle) detalle.push({
        tipo: 'horario_incorrecto',
        descripcion: `Gen ${gen.seccion_id ?? 'lab-' + gen.seccion_lab_id} asignado en tarde pero puede_tarde=false`,
        penalizacion: -70,
      });
    }
  }
  return puntaje;
}

function penalizarSalonInadecuado(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.salon_id) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon) continue;
    if (!gen.es_laboratorio && salon.es_laboratorio && !salon.lab_habilitado_teorico) {
      puntaje -= 60;
      if (detalle) detalle.push({
        tipo: 'salon_inadecuado',
        descripcion: `Curso teórico ${gen.seccion_id} en laboratorio ${salon.nombre} no habilitado para teóricos`,
        penalizacion: -60,
      });
    }
    if (gen.es_laboratorio && !salon.es_laboratorio) {
      puntaje -= 60;
      if (detalle) detalle.push({
        tipo: 'salon_inadecuado',
        descripcion: `Lab ${gen.seccion_lab_id} asignado a salón teórico ${salon.nombre}`,
        penalizacion: -60,
      });
    }
  }
  return puntaje;
}

function penalizarDocenteFueraDeHorario(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.docente_id) continue;
    const docente = ctx.docentes.find(d => d.id === gen.docente_id);
    const periodo = ctx.periodos.find(p => p.id === gen.periodo_inicio_id);
    if (!docente || !periodo) continue;
    if (periodo.hora_inicio < docente.hora_entrada ||
        periodo.hora_fin    > docente.hora_salida) {
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
  for (const gen of genes) {
    if (!gen.salon_id || !gen.num_estudiantes) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon || !salon.capacidad) continue;
    if (gen.num_estudiantes > salon.capacidad) {
      puntaje -= 20;
      if (detalle) detalle.push({
        tipo: 'capacidad_superada',
        descripcion: `${gen.num_estudiantes} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
        penalizacion: -20,
      });
    }
  }
  return puntaje;
}

// ----------------- BONOS -----------------

function bonoContinuidadSemestre(genes, detalle) {
  let puntaje = 0;
  const grupos = {};

  for (const gen of genes) {
    if (gen.tipo !== 'obligatorio' || !gen.semestre || !gen.carrera_id) continue;
    const bloques = obtenerBloques(gen);
    for (const { dia } of bloques) {
      const key = `${gen.semestre}-${gen.carrera_id}-${dia}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push({ gen, dia });
    }
  }

  for (const [key, items] of Object.entries(grupos)) {
    if (items.length < 2) continue;
    items.sort((a, b) => a.gen.periodo_inicio_id - b.gen.periodo_inicio_id);
    for (let i = 0; i < items.length - 1; i++) {
      if (items[i].gen.periodo_fin_id + 1 === items[i + 1].gen.periodo_inicio_id) {
        puntaje += 30;
        if (detalle) detalle.push({
          tipo: 'continuidad_semestre',
          descripcion: `Semestre ${items[i].gen.semestre} carrera ${items[i].gen.carrera_id}: cursos consecutivos en día ${items[i].dia}`,
          bono: 30,
        });
      }
    }
  }

  return puntaje;
}

function bonoCapacidadAdecuada(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.salon_id || !gen.num_estudiantes) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon || !salon.capacidad) continue;
    if (gen.num_estudiantes <= salon.capacidad) {
      puntaje += 10;
      if (detalle) detalle.push({
        tipo: 'capacidad_adecuada',
        descripcion: `${gen.num_estudiantes} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
        bono: 10,
      });
    }
  }
  return puntaje;
}

// ----------------------- FUNCION PRINCIPAL DE EVALUACIÓN -----------------------

function evaluarAptitud(individuo, ctx, conDetalle = false) {
  const genes   = individuo.genes;
  const detalle = conDetalle ? [] : null;

  const { slotDocente, slotSalon, slotSemestre } = construirMapas(genes);

  const aptitud =
    penalizarConflictosDocente(slotDocente, detalle)   +
    penalizarConflictosSalon(slotSalon, detalle)       +
    penalizarConflictosSemestre(slotSemestre, detalle) +
    penalizarHorarioIncorrecto(genes, ctx, detalle)    +
    penalizarSalonInadecuado(genes, ctx, detalle)      +
    penalizarDocenteFueraDeHorario(genes, ctx, detalle)+
    penalizarCapacidadSuperada(genes, ctx, detalle)    +
    bonoContinuidadSemestre(genes, detalle)            +
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