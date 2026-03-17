
// Implementa dos métodos de mutación:
//
// 1. INTERCAMBIO
//    Elige dos genes al azar e intercambia sus atributos de asignación.
//    Es conservadora — no genera valores nuevos, solo reordena
//    lo que ya existe en el individuo.
//
//    Antes: [gen1(salon=1,doc=3,periodo=8), ..., gen5(salon=4,doc=7,periodo=12)]
//    Después:[gen1(salon=4,doc=7,periodo=12), ..., gen5(salon=1,doc=3,periodo=8)]
//
// 2. REINSERCIÓN ALEATORIA
//    Elige un gen al azar y le reasigna valores completamente nuevos
//    respetando todas las restricciones (horario docente, tipo salón, etc.).
//    Es más agresiva — puede explorar zonas del espacio de búsqueda
//    que el cruce nunca alcanzaría.
//
// CUÁNDO APLICA CADA UNA:
//    Ambas se aplican con probabilidad tasa_mutacion (ej: 0.05 = 5%).
//    Se aplican sobre cada gen individualmente, no sobre el individuo completo.
//    Es decir, cada gen tiene un 5% de probabilidad de mutar.
//
// IMPORTANTE:
//    Al igual que en el cruce, solo se mutan los atributos de asignación.
//    Los metadatos de contexto y las fijaciones nunca se tocan.
//    repararIndividuo() al final garantiza que las fijaciones se respeten.
// ============================================================

const { repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin }              = require('./cromosoma');

// ---------------- MUTACIÓN POR INTERCAMBIO -----------------------

/**
 * Intercambia los atributos de asignación entre dos genes elegidos al azar.
 * Solo intercambia genes del mismo tipo (curso↔curso, lab↔lab)
 * para evitar asignar un salón de laboratorio a un curso teórico.
 *
 * @param {Individuo} individuo
 * @param {number}    tasa  - probabilidad de que ocurra el intercambio (0 a 1)
 * @returns {Individuo}
 */
function mutacionIntercambio(individuo, tasa) {
  // Separar genes por tipo para no mezclar cursos con labs
  const idxCursos = individuo.genes
    .map((g, i) => (!g.es_laboratorio ? i : null))
    .filter(i => i !== null);

  const idxLabs = individuo.genes
    .map((g, i) => (g.es_laboratorio ? i : null))
    .filter(i => i !== null);

  // Intentar intercambio en cursos
  if (idxCursos.length >= 2 && Math.random() < tasa) {
    const [i, j] = elegirDosDinstintos(idxCursos);
    intercambiarAsignacion(individuo.genes, i, j);
  }

  // Intentar intercambio en labs
  if (idxLabs.length >= 2 && Math.random() < tasa) {
    const [i, j] = elegirDosDinstintos(idxLabs);
    intercambiarAsignacion(individuo.genes, i, j);
  }

  return repararIndividuo(individuo);
}

/**
 * Intercambia los atributos de asignación entre genes[i] y genes[j].
 * Muta en lugar para no crear objetos nuevos innecesariamente.
 */
function intercambiarAsignacion(genes, i, j) {
  const tmp = {
    salon_id:          genes[i].salon_id,
    docente_id:        genes[i].docente_id,
    periodo_inicio_id: genes[i].periodo_inicio_id,
    periodo_fin_id:    genes[i].periodo_fin_id,
    dia_horario_id:    genes[i].dia_horario_id,
  };

  genes[i].salon_id          = genes[j].salon_id;
  genes[i].docente_id        = genes[j].docente_id;
  genes[i].periodo_inicio_id = genes[j].periodo_inicio_id;
  genes[i].periodo_fin_id    = genes[j].periodo_fin_id;
  genes[i].dia_horario_id    = genes[j].dia_horario_id;

  genes[j].salon_id          = tmp.salon_id;
  genes[j].docente_id        = tmp.docente_id;
  genes[j].periodo_inicio_id = tmp.periodo_inicio_id;
  genes[j].periodo_fin_id    = tmp.periodo_fin_id;
  genes[j].dia_horario_id    = tmp.dia_horario_id;
}

// ── Mutación por reinserción aleatoria ────────────────────────

/**
 * Elige genes al azar y les reasigna valores completamente nuevos,
 * respetando restricciones de horario del docente, tipo de salón, etc.
 * Cada gen muta de forma independiente con probabilidad tasa.
 *
 * @param {Individuo} individuo
 * @param {number}    tasa  - probabilidad por gen (0 a 1)
 * @param {Contexto}  ctx
 * @returns {Individuo}
 */
function mutacionReisercion(individuo, tasa, ctx) {
  for (let i = 0; i < individuo.genes.length; i++) {
    if (Math.random() >= tasa) continue;

    const gen = individuo.genes[i];

    // No mutar atributos que estén fijados — repararIndividuo lo haría
    // igual, pero evitar trabajo innecesario
    const numPeriodos = gen.es_laboratorio ? 3 : 1;

    // 1. Nuevo docente (si no está fijado)
    if (!gen.docente_fijo_id) {
      const posibles = gen.es_laboratorio
        ? (ctx.docentesCursoLab[gen.curso_id] ?? ctx.docentesCurso[gen.curso_id] ?? [])
        : (ctx.docentesCurso[gen.curso_id]    ?? []);
      // Fallback: usar cualquier docente activo si no hay relación registrada
      const candidatos = posibles.length > 0
        ? posibles
        : ctx.docentes.map(d => d.id);
      const nuevoDocente = elegirAlAzar(candidatos);
      if (nuevoDocente) gen.docente_id = nuevoDocente;
    }

    // 2. Nuevo periodo (si no está fijado)
    if (!gen.periodo_fijo_inicio_id) {
      const validos = periodosValidos(
        ctx,
        gen.puede_manana,
        gen.puede_tarde,
        gen.docente_id,
        numPeriodos
      );
      const nuevoPeriodo = elegirAlAzar(validos);
      if (nuevoPeriodo) {
        gen.periodo_inicio_id = nuevoPeriodo.id;
        gen.periodo_fin_id    = calcularPeriodoFin(ctx, nuevoPeriodo.id, numPeriodos);
      }
    }

    // 3. Nuevo salón (si no está fijado y no es sin_salon)
    if (!gen.salon_fijo_id && !gen.sin_salon) {
      const validos = salonesValidos(ctx, gen.es_laboratorio, gen.periodo_inicio_id);
      const nuevoSalon = elegirAlAzar(validos);
      if (nuevoSalon) gen.salon_id = nuevoSalon.id;
    }

    // 4. Nuevo día (si no está fijado)
    if (!gen.dia_horario_fijo_id) {
      // Cursos teóricos → LMV (1), Labs → MarJue (2)
      // Solo se permite cambiar si no hay restricción fija
      gen.dia_horario_id = gen.es_laboratorio ? 2 : 1;
    }
  }

  return repararIndividuo(individuo);
}

// --------------- FUNCION UNIFICADA DE MUTACIÓN -----------------------

/**
 * Aplica mutación a un individuo usando el método configurado.
 *
 * @param {Individuo} individuo
 * @param {string}    metodo  - 'intercambio' | 'reisercion'
 * @param {number}    tasa    - probabilidad de mutación (viene de config)
 * @param {Contexto}  ctx     - solo requerido para 'reisercion'
 * @returns {Individuo}
 */
function mutar(individuo, metodo = 'intercambio', tasa = 0.05, ctx = null) {
  if (metodo === 'reisercion') {
    if (!ctx) throw new Error('mutar: ctx es requerido para método reisercion');
    return mutacionReisercion(individuo, tasa, ctx);
  }
  return mutacionIntercambio(individuo, tasa);
}

// --------------- HELPER INTERNO -----------------------

/**
 * Elige dos índices distintos al azar de un array de índices.
 * @param {number[]} indices
 * @returns {[number, number]}
 */
function elegirDosDinstintos(indices) {
  const copia = [...indices];
  const i     = Math.floor(Math.random() * copia.length);
  const valA  = copia.splice(i, 1)[0];
  const valB  = copia[Math.floor(Math.random() * copia.length)];
  return [valA, valB];
}

module.exports = {
  mutacionIntercambio,
  mutacionReisercion,
  mutar,
};