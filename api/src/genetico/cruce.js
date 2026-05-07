
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
const { GEN, clonarGen } = require('./genoma');

// -------------------- HELPERS --------------

/**
 * Copia solo los atributos de asignación del fuente al destino.
 * Los metadatos de contexto del destino se preservan.
 * distribucion_lab se copia completo cuando aplica.
 */
function copiarAsignacion(destino, fuente) {
  const copia = clonarGen(destino);
  copia[GEN.SALON_ID] = fuente[GEN.SALON_ID];
  copia[GEN.DOCENTE_ID] = fuente[GEN.DOCENTE_ID];
  copia[GEN.PERIODO_INICIO_ID] = fuente[GEN.PERIODO_INICIO_ID];
  copia[GEN.PERIODO_FIN_ID] = fuente[GEN.PERIODO_FIN_ID];
  copia[GEN.DIA_HORARIO_ID] = fuente[GEN.DIA_HORARIO_ID];
  copia[GEN.DIST_MARTES_INICIO_ID] = fuente[GEN.DIST_MARTES_INICIO_ID];
  copia[GEN.DIST_MARTES_FIN_ID] = fuente[GEN.DIST_MARTES_FIN_ID];
  copia[GEN.DIST_JUEVES_INICIO_ID] = fuente[GEN.DIST_JUEVES_INICIO_ID];
  copia[GEN.DIST_JUEVES_FIN_ID] = fuente[GEN.DIST_JUEVES_FIN_ID];
  copia[GEN.DIST_MARTES_NUM_PERIODOS] = fuente[GEN.DIST_MARTES_NUM_PERIODOS];
  copia[GEN.DIST_JUEVES_NUM_PERIODOS] = fuente[GEN.DIST_JUEVES_NUM_PERIODOS];
  return copia;
}

function clonarIndividuo(individuo) {
  return {
    genes: individuo.genes.map(clonarGen),
    aptitud: null,
  };
}

// ----------------------- CRUCE DE UN PUNTO ----------------------------

function cruceUnPunto(padreA, padreB) {
  const n     = padreA.genes.length;
  const punto = Math.floor(Math.random() * (n - 1)) + 1;

  const hijo1 = clonarIndividuo(padreA);
  const hijo2 = clonarIndividuo(padreB);

  for (let i = punto; i < n; i++) {
    hijo1.genes[i] = copiarAsignacion(hijo1.genes[i], padreB.genes[i]);
    hijo2.genes[i] = copiarAsignacion(hijo2.genes[i], padreA.genes[i]);
  }

  return [repararIndividuo(hijo1), repararIndividuo(hijo2)];
}

// -------------------- CRUCE MULTIPUNTO ----------------------------

function cruceMultipunto(padreA, padreB) {
  const n = padreA.genes.length;

  let p1 = Math.floor(Math.random() * (n - 2)) + 1;
  let p2 = Math.floor(Math.random() * (n - 1)) + 1;
  if (p1 === p2) p2 = p2 < n - 1 ? p2 + 1 : p2 - 1;
  if (p1 > p2) [p1, p2] = [p2, p1];

  const hijo1 = clonarIndividuo(padreA);
  const hijo2 = clonarIndividuo(padreB);

  for (let i = p1; i < p2; i++) {
    hijo1.genes[i] = copiarAsignacion(hijo1.genes[i], padreB.genes[i]);
    hijo2.genes[i] = copiarAsignacion(hijo2.genes[i], padreA.genes[i]);
  }

  return [repararIndividuo(hijo1), repararIndividuo(hijo2)];
}

// ------------------- FUNCION UNIFICADA --------------

function cruzar(padreA, padreB, metodo = 'un_punto') {
  if (metodo === 'multipunto') return cruceMultipunto(padreA, padreB);
  return cruceUnPunto(padreA, padreB);
}

module.exports = { cruceUnPunto, cruceMultipunto, cruzar };