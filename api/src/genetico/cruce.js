
// Implementa dos métodos de cruce:
//
// 1. UN PUNTO
//    Se elige un punto de corte aleatorio en el array de genes.
//    Hijo 1 = genes de A hasta el corte + genes de B desde el corte
//    Hijo 2 = genes de B hasta el corte + genes de A desde el corte
//
//    PadreA: [g1, g2, g3, | g4, g5, g6]
//    PadreB: [h1, h2, h3, | h4, h5, h6]
//    Hijo1:  [g1, g2, g3,   h4, h5, h6]
//    Hijo2:  [h1, h2, h3,   g4, g5, g6]
//
// 2. MULTIPUNTO (dos puntos)
//    Se eligen dos puntos de corte aleatorios.
//    El segmento del medio se intercambia entre padres.
//
//    PadreA: [g1, g2, | g3, g4, | g5, g6]
//    PadreB: [h1, h2, | h3, h4, | h5, h6]
//    Hijo1:  [g1, g2,   h3, h4,   g5, g6]
//    Hijo2:  [h1, h2,   g3, g4,   h5, h6]
//
// Nota:
//   Los genes tienen metadatos de contexto (semestre, carrera_id, tipo,
//   puede_manana, etc.) que NO deben mezclarse entre padres — cada gen
//   debe mantener sus propios metadatos.
//
//   Por eso el cruce NO copia genes completos de un padre al otro.
//   En cambio, copia solo los atributos de ASIGNACIÓN (los que el AG
//   decide) y mantiene los metadatos del gen original de cada hijo.
//
//   Atributos de asignación (se cruzan):
//     salon_id, docente_id, periodo_inicio_id, periodo_fin_id, dia_horario_id
//
//   Atributos de contexto (NO se cruzan, se mantienen del gen original):
//     seccion_id, seccion_lab_id, es_laboratorio, sin_salon,
//     semestre, carrera_id, tipo, puede_manana, puede_tarde,
//     num_estudiantes, salon_fijo_id, docente_fijo_id,
//     periodo_fijo_inicio_id, dia_horario_fijo_id

const { repararIndividuo } = require('./cromosoma');

// Helpers

/**
 * Copia solo los atributos de asignación de un gen fuente
 * hacia un gen destino, preservando los metadatos del destino.
 *
 * @param {Gen} destino  - gen que recibe la asignación
 * @param {Gen} fuente   - gen del que se toman los valores
 * @returns {Gen}
 */
function copiarAsignacion(destino, fuente) {
  return {
    ...destino,                                  // metadatos propios del destino
    salon_id:          fuente.salon_id,          // asignación del fuente
    docente_id:        fuente.docente_id,
    periodo_inicio_id: fuente.periodo_inicio_id,
    periodo_fin_id:    fuente.periodo_fin_id,
    dia_horario_id:    fuente.dia_horario_id,
  };
}

/**
 * Clona un individuo profundamente para no mutar los padres.
 *
 * @param {Individuo} individuo
 * @returns {Individuo}
 */
function clonarIndividuo(individuo) {
  return {
    genes:   individuo.genes.map(g => ({ ...g })),
    aptitud: null,
  };
}

// ------------------- CRUCE DE UN PUNTO -------------------------

/**
 * Cruce de un punto.
 * Elige un punto de corte aleatorio y combina los segmentos.
 *
 * @param {Individuo} padreA
 * @param {Individuo} padreB
 * @returns {[Individuo, Individuo]}
 */
function cruceUnPunto(padreA, padreB) {
  const n     = padreA.genes.length;
  // Punto de corte entre 1 y n-1 para que ambos segmentos tengan genes
  const punto = Math.floor(Math.random() * (n - 1)) + 1;

  const hijo1 = clonarIndividuo(padreA);
  const hijo2 = clonarIndividuo(padreB);

  // Desde el punto de corte, copiar asignaciones del otro padre
  for (let i = punto; i < n; i++) {
    hijo1.genes[i] = copiarAsignacion(hijo1.genes[i], padreB.genes[i]);
    hijo2.genes[i] = copiarAsignacion(hijo2.genes[i], padreA.genes[i]);
  }

  return [
    repararIndividuo(hijo1),
    repararIndividuo(hijo2),
  ];
}

// ------------------- CRUCE MULTIPUNTO (DOS PUNTOS) -------------------

/**
 * Cruce de dos puntos.
 * Elige dos puntos de corte y el segmento del medio se intercambia.
 *
 * @param {Individuo} padreA
 * @param {Individuo} padreB
 * @returns {[Individuo, Individuo]}
 */
function cruceMultipunto(padreA, padreB) {
  const n = padreA.genes.length;

  // Generar dos puntos distintos garantizando p1 < p2
  let p1 = Math.floor(Math.random() * (n - 2)) + 1;
  let p2 = Math.floor(Math.random() * (n - 1)) + 1;
  if (p1 === p2) p2 = p2 < n - 1 ? p2 + 1 : p2 - 1;
  if (p1 > p2) [p1, p2] = [p2, p1];

  const hijo1 = clonarIndividuo(padreA);
  const hijo2 = clonarIndividuo(padreB);

  // Solo el segmento entre p1 y p2 se intercambia
  for (let i = p1; i < p2; i++) {
    hijo1.genes[i] = copiarAsignacion(hijo1.genes[i], padreB.genes[i]);
    hijo2.genes[i] = copiarAsignacion(hijo2.genes[i], padreA.genes[i]);
  }

  return [
    repararIndividuo(hijo1),
    repararIndividuo(hijo2),
  ];
}

// ------------------- FUNCION UNIFICADA -------------------

/**
 * Cruza dos padres usando el método configurado.
 *
 * @param {Individuo} padreA
 * @param {Individuo} padreB
 * @param {string}    metodo  - 'un_punto' | 'multipunto'
 * @returns {[Individuo, Individuo]}
 */
function cruzar(padreA, padreB, metodo = 'un_punto') {
  if (metodo === 'multipunto') {
    return cruceMultipunto(padreA, padreB);
  }
  return cruceUnPunto(padreA, padreB);
}

module.exports = {
  cruceUnPunto,
  cruceMultipunto,
  cruzar,
};