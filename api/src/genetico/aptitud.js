
// La aptitud parte desde 0.
// Las penalizaciones RESTAN puntos (conflictos duros y blandos).
// Los bonos SUMAN puntos (optimizaciones deseables).
//
// Un individuo perfecto (sin conflictos) tendrá aptitud >= 0.
// Mientras más negativa la aptitud, peor es el horario.
//
// PENALIZACIONES (hard constraints — nunca deben ocurrir):
//   -100  conflicto de docente     (mismo docente, mismo slot)
//   -100  conflicto de salón       (mismo salón,   mismo slot)
//    -80  conflicto de semestre    (mismo semestre+carrera obligatorio, mismo slot)
//    -70  horario incorrecto       (curso en mañana si puede_manana=false, o viceversa)
//    -60  salón inadecuado         (curso teórico en lab no habilitado)
//    -50  docente fuera de horario (asignado fuera de hora_entrada/hora_salida)
//
// PENALIZACIONES (soft constraints — deseables pero no críticas):
//    -20  capacidad superada       (num_estudiantes > capacidad del salón)
//
// BONOS:
//    +30  cursos del mismo semestre consecutivos  (facilita asistencia)
//    +10  salón con capacidad adecuada            (num_estudiantes <= capacidad)

//  Helpers

/**
 * Construye una clave única de "slot" para detectar colisiones.
 * Dos genes colisionan si comparten día, y sus rangos de periodos se solapan.
 * Para cursos teóricos: inicio === fin (1 periodo)
 * Para labs: inicio a fin (3 periodos consecutivos)
 */
function seSolapan(genA, genB) {
  if (genA.dia_horario_id !== genB.dia_horario_id) return false;
  // Solapan si el rango [inicio, fin] de A intersecta con el de B
  return genA.periodo_inicio_id <= genB.periodo_fin_id &&
         genB.periodo_inicio_id <= genA.periodo_fin_id;
}

/**
 * Construye mapas de lookup para evaluar conflictos en O(n)
 * en lugar de comparar todos los pares en O(n²).
 *
 * Retorna:
 *   slotDocente  { `docente_id-dia-periodo`: [genes] }
 *   slotSalon    { `salon_id-dia-periodo`:   [genes] }
 *   slotSemestre { `semestre-carrera-dia-periodo`: [genes] }
 */
function construirMapas(genes) {
  const slotDocente  = {};
  const slotSalon    = {};
  const slotSemestre = {};

  for (const gen of genes) {
    // Expandir todos los periodos que ocupa el gen (1 para cursos, 3 para labs)
    for (let p = gen.periodo_inicio_id; p <= gen.periodo_fin_id; p++) {
      const dia = gen.dia_horario_id;

      // Mapa docente
      if (gen.docente_id) {
        const keyD = `${gen.docente_id}-${dia}-${p}`;
        if (!slotDocente[keyD]) slotDocente[keyD] = [];
        slotDocente[keyD].push(gen);
      }

      // Mapa salón (solo si tiene salón asignado)
      if (gen.salon_id) {
        const keyS = `${gen.salon_id}-${dia}-${p}`;
        if (!slotSalon[keyS]) slotSalon[keyS] = [];
        slotSalon[keyS].push(gen);
      }

      // Mapa semestre — solo cursos obligatorios
      if (gen.tipo === 'obligatorio' && gen.semestre && gen.carrera_id) {
        const keyM = `${gen.semestre}-${gen.carrera_id}-${dia}-${p}`;
        if (!slotSemestre[keyM]) slotSemestre[keyM] = [];
        slotSemestre[keyM].push(gen);
      }
    }
  }

  return { slotDocente, slotSalon, slotSemestre };
}

// Penalizaciones

/**
 * P1 — Conflicto de docente
 * Un docente no puede estar en dos lugares al mismo tiempo.
 * Penaliza cada colisión extra (si hay 3 genes en el mismo slot, son 2 conflictos).
 */
function penalizarConflictosDocente(slotDocente, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotDocente)) {
    if (genes.length > 1) {
      const conflictos = genes.length - 1;
      puntaje -= conflictos * 100;
      if (detalle) {
        detalle.push({
          tipo: 'conflicto_docente',
          descripcion: `Docente ${genes[0].docente_id} tiene ${genes.length} asignaciones en slot ${key}`,
          penalizacion: conflictos * -100,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P2 — Conflicto de salón
 * Un salón no puede tener dos cursos al mismo tiempo.
 */
function penalizarConflictosSalon(slotSalon, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotSalon)) {
    if (genes.length > 1) {
      const conflictos = genes.length - 1;
      puntaje -= conflictos * 100;
      if (detalle) {
        detalle.push({
          tipo: 'conflicto_salon',
          descripcion: `Salón ${genes[0].salon_id} tiene ${genes.length} asignaciones en slot ${key}`,
          penalizacion: conflictos * -100,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P3 — Conflicto de semestre
 * Dos cursos obligatorios del mismo semestre y carrera no pueden
 * coincidir en el mismo slot (a menos que sean secciones distintas
 * del mismo curso, lo cual ya está separado en genes distintos con
 * distinto seccion_id — eso está permitido).
 */
function penalizarConflictosSemestre(slotSemestre, detalle) {
  let puntaje = 0;
  for (const [key, genes] of Object.entries(slotSemestre)) {
    // Agrupar por curso_id para permitir secciones distintas del mismo curso
    const porCurso = {};
    for (const gen of genes) {
      const cursoKey = gen.seccion_id ?? `lab-${gen.seccion_lab_id}`;
      if (!porCurso[cursoKey]) porCurso[cursoKey] = gen;
    }
    const cursosDistintos = Object.keys(porCurso).length;
    if (cursosDistintos > 1) {
      const conflictos = cursosDistintos - 1;
      puntaje -= conflictos * 80;
      if (detalle) {
        detalle.push({
          tipo: 'conflicto_semestre',
          descripcion: `Semestre ${genes[0].semestre} carrera ${genes[0].carrera_id} tiene ${cursosDistintos} cursos obligatorios en slot ${key}`,
          penalizacion: conflictos * -80,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P4 — Horario incorrecto
 * Curso asignado en mañana cuando puede_manana=false, o en tarde cuando puede_tarde=false.
 * Se evalúa gen por gen usando el periodo asignado.
 */
function penalizarHorarioIncorrecto(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    const periodo = ctx.periodos.find(p => p.id === gen.periodo_inicio_id);
    if (!periodo) continue;

    if (periodo.es_manana && !gen.puede_manana) {
      puntaje -= 70;
      if (detalle) {
        detalle.push({
          tipo: 'horario_incorrecto',
          descripcion: `Gen ${gen.seccion_id ?? 'lab-' + gen.seccion_lab_id} asignado en mañana pero puede_manana=false`,
          penalizacion: -70,
        });
      }
    }
    if (periodo.es_tarde && !gen.puede_tarde) {
      puntaje -= 70;
      if (detalle) {
        detalle.push({
          tipo: 'horario_incorrecto',
          descripcion: `Gen ${gen.seccion_id ?? 'lab-' + gen.seccion_lab_id} asignado en tarde pero puede_tarde=false`,
          penalizacion: -70,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P5 — Salón inadecuado
 * Curso teórico en salón de laboratorio no habilitado para teóricos.
 * Lab en salón que no es de laboratorio.
 */
function penalizarSalonInadecuado(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.salon_id) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon) continue;

    if (!gen.es_laboratorio && salon.es_laboratorio && !salon.lab_habilitado_teorico) {
      puntaje -= 60;
      if (detalle) {
        detalle.push({
          tipo: 'salon_inadecuado',
          descripcion: `Curso teórico ${gen.seccion_id} en laboratorio ${salon.nombre} no habilitado para teóricos`,
          penalizacion: -60,
        });
      }
    }

    if (gen.es_laboratorio && !salon.es_laboratorio) {
      puntaje -= 60;
      if (detalle) {
        detalle.push({
          tipo: 'salon_inadecuado',
          descripcion: `Lab ${gen.seccion_lab_id} asignado a salón teórico ${salon.nombre}`,
          penalizacion: -60,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P6 — Docente fuera de su horario contratado
 * El periodo asignado cae fuera de hora_entrada / hora_salida del docente.
 */
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
      if (detalle) {
        detalle.push({
          tipo: 'docente_fuera_horario',
          descripcion: `Docente ${docente.nombre} asignado fuera de su horario (${periodo.hora_inicio}-${periodo.hora_fin})`,
          penalizacion: -50,
        });
      }
    }
  }
  return puntaje;
}

/**
 * P7 — Capacidad superada (soft constraint)
 * El salón tiene menos capacidad que el número de estudiantes.
 * Solo penaliza si ambos datos están disponibles.
 */
function penalizarCapacidadSuperada(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.salon_id || !gen.num_estudiantes) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon || !salon.capacidad) continue;

    if (gen.num_estudiantes > salon.capacidad) {
      puntaje -= 20;
      if (detalle) {
        detalle.push({
          tipo: 'capacidad_superada',
          descripcion: `${gen.num_estudiantes} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
          penalizacion: -20,
        });
      }
    }
  }
  return puntaje;
}

// Bonos

/**
 * B1 — Cursos del mismo semestre en periodos consecutivos
 * Por cada par de cursos obligatorios del mismo semestre y carrera
 * que queden en periodos adyacentes el mismo día, suma puntos.
 */
function bonoContinuidadSemestre(genes, detalle) {
  let puntaje = 0;

  // Agrupar genes obligatorios por semestre+carrera+dia
  const grupos = {};
  for (const gen of genes) {
    if (gen.tipo !== 'obligatorio' || !gen.semestre || !gen.carrera_id) continue;
    const key = `${gen.semestre}-${gen.carrera_id}-${gen.dia_horario_id}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(gen);
  }

  for (const [key, grupo] of Object.entries(grupos)) {
    if (grupo.length < 2) continue;

    // Ordenar por periodo_inicio
    grupo.sort((a, b) => a.periodo_inicio_id - b.periodo_inicio_id);

    // Verificar pares consecutivos
    for (let i = 0; i < grupo.length - 1; i++) {
      const actual   = grupo[i];
      const siguiente = grupo[i + 1];
      // Son consecutivos si el fin del actual + 1 = inicio del siguiente
      if (actual.periodo_fin_id + 1 === siguiente.periodo_inicio_id) {
        puntaje += 30;
        if (detalle) {
          detalle.push({
            tipo: 'continuidad_semestre',
            descripcion: `Semestre ${actual.semestre} carrera ${actual.carrera_id}: cursos consecutivos en día ${actual.dia_horario_id}`,
            bono: 30,
          });
        }
      }
    }
  }

  return puntaje;
}

/**
 * B2 — Salón con capacidad adecuada
 * Si num_estudiantes <= capacidad del salón, suma puntos.
 * Premia asignar salones más grandes a cursos con más estudiantes.
 */
function bonoCapacidadAdecuada(genes, ctx, detalle) {
  let puntaje = 0;
  for (const gen of genes) {
    if (!gen.salon_id || !gen.num_estudiantes) continue;
    const salon = ctx.salones.find(s => s.id === gen.salon_id);
    if (!salon || !salon.capacidad) continue;

    if (gen.num_estudiantes <= salon.capacidad) {
      puntaje += 10;
      if (detalle) {
        detalle.push({
          tipo: 'capacidad_adecuada',
          descripcion: `${gen.num_estudiantes} estudiantes en salón ${salon.nombre} (capacidad ${salon.capacidad})`,
          bono: 10,
        });
      }
    }
  }
  return puntaje;
}

// Funcion principal

/**
 * Evalúa la aptitud de un individuo y opcionalmente retorna
 * el detalle de cada penalización y bono aplicado.
 *
 * @param {Individuo} individuo
 * @param {Contexto}  ctx
 * @param {boolean}   conDetalle  - true para incluir lista de conflictos
 * @returns {{ aptitud: number, detalle?: Array }}
 */
function evaluarAptitud(individuo, ctx, conDetalle = false) {
  const genes   = individuo.genes;
  const detalle = conDetalle ? [] : null;

  // Construir mapas de lookup una sola vez
  const { slotDocente, slotSalon, slotSemestre } = construirMapas(genes);

  const aptitud =
    // Penalizaciones usando mapas (O(n))
    penalizarConflictosDocente(slotDocente, detalle)  +
    penalizarConflictosSalon(slotSalon, detalle)      +
    penalizarConflictosSemestre(slotSemestre, detalle)+

    // Penalizaciones gen por gen
    penalizarHorarioIncorrecto(genes, ctx, detalle)   +
    penalizarSalonInadecuado(genes, ctx, detalle)     +
    penalizarDocenteFueraDeHorario(genes, ctx, detalle)+
    penalizarCapacidadSuperada(genes, ctx, detalle)   +

    // Bonos
    bonoContinuidadSemestre(genes, detalle)           +
    bonoCapacidadAdecuada(genes, ctx, detalle);

  individuo.aptitud = aptitud;

  return conDetalle ? { aptitud, detalle } : { aptitud };
}

/**
 * Evalúa toda la población y actualiza individuo.aptitud en cada uno.
 * Retorna la población ordenada de mejor a peor aptitud.
 *
 * @param {Individuo[]} poblacion
 * @param {Contexto}    ctx
 * @returns {Individuo[]}
 */
function evaluarPoblacion(poblacion, ctx) {
  for (const individuo of poblacion) {
    evaluarAptitud(individuo, ctx);
  }
  return poblacion.sort((a, b) => b.aptitud - a.aptitud);
}

module.exports = {
  evaluarAptitud,
  evaluarPoblacion,
};