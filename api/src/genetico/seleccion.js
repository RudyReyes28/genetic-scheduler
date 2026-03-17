
// 1. TORNEO
//    Elige K individuos al azar y retorna el de mejor aptitud.
//    Funciona con aptitudes negativas sin ningún ajuste.
//    Parámetro: k (tamaño del torneo, default 5)
//
// 2. RULETA CON NORMALIZACIÓN
//    La ruleta clásica no acepta aptitudes negativas porque
//    necesita probabilidades positivas.
//    Solución: desplazar todas las aptitudes restando el mínimo
//    y sumando 1, garantizando que todas sean > 0.
//
//    Ejemplo:
//      aptitudes originales: [-310, -200, -80, -10, 0]
//      mínimo: -310
//      desplazadas: [1, 111, 231, 301, 311]
//      total: 955
//      probabilidades: [0.001, 0.116, 0.242, 0.315, 0.326]
//
//    Así los mejores individuos (menos negativos) tienen mayor
//    probabilidad de ser seleccionados, igual que la ruleta clásica.

// ------------- TORNEO -----------------------------

/**
 * Selecciona un individuo mediante torneo.
 * Elige K individuos al azar y retorna el de mayor aptitud.
 *
 * @param {Individuo[]} poblacion
 * @param {number}      k  - tamaño del torneo (default 5)
 * @returns {Individuo}
 */
function seleccionTorneo(poblacion, k = 5) {
  const tamano = Math.min(k, poblacion.length);

  const candidatos = [];
  const indices    = new Set();

  while (candidatos.length < tamano) {
    const idx = Math.floor(Math.random() * poblacion.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      candidatos.push(poblacion[idx]);
    }
  }

  return candidatos.reduce((mejor, actual) =>
    actual.aptitud > mejor.aptitud ? actual : mejor
  );
}

// ------------------- RULETA CON NORMALIZACIÓN -------------------------

/**
 * Precalcula los pesos normalizados de la población para la ruleta.
 * Llamar una vez por generación y reusar el resultado en ambas
 * selecciones de padres, evitando recalcular dos veces.
 *
 * @param {Individuo[]} poblacion
 * @returns {{ pesos: number[], total: number }}
 */
function precalcularRuleta(poblacion) {
  const minAptitud = Math.min(...poblacion.map(ind => ind.aptitud));

  // Desplazar: restar el mínimo y sumar 1 para garantizar que todos sean > 0
  // Ejemplo: mínimo=-310 → desplazamiento=311 → aptitud -310 queda en 1
  const desplazamiento = Math.abs(minAptitud) + 1;

  const pesos = poblacion.map(ind => ind.aptitud + desplazamiento);
  const total = pesos.reduce((sum, p) => sum + p, 0);

  return { pesos, total };
}

/**
 * Selecciona un individuo mediante ruleta con aptitudes normalizadas.
 * Requiere los pesos precalculados con precalcularRuleta().
 *
 * @param {Individuo[]}                        poblacion
 * @param {{ pesos: number[], total: number }} ruleta
 * @returns {Individuo}
 */
function seleccionRuleta(poblacion, ruleta) {
  const { pesos, total } = ruleta;

  let punto     = Math.random() * total;
  let acumulado = 0;

  for (let i = 0; i < poblacion.length; i++) {
    acumulado += pesos[i];
    if (punto <= acumulado) {
      return poblacion[i];
    }
  }

  // Fallback por errores de punto flotante
  return poblacion[poblacion.length - 1];
}

// ------------- Función unificada -----------------------------

/**
 * Selecciona DOS padres usando el método configurado.
 * Garantiza que los dos padres sean distintos.
 *
 * @param {Individuo[]} poblacion
 * @param {string}      metodo    - 'torneo' | 'ruleta'
 * @param {number}      k         - tamaño del torneo (solo aplica a torneo)
 * @returns {[Individuo, Individuo]}
 */
function seleccionarPadres(poblacion, metodo = 'torneo', k = 5) {
  let padreA, padreB;

  if (metodo === 'ruleta') {
    const ruleta = precalcularRuleta(poblacion);
    padreA = seleccionRuleta(poblacion, ruleta);

    let intentos = 0;
    do {
      padreB = seleccionRuleta(poblacion, ruleta);
      intentos++;
    } while (padreB === padreA && intentos < 10);

  } else {
    // torneo por defecto
    padreA = seleccionTorneo(poblacion, k);

    let intentos = 0;
    do {
      padreB = seleccionTorneo(poblacion, k);
      intentos++;
    } while (padreB === padreA && intentos < 10);
  }

  return [padreA, padreB];
}

module.exports = {
  seleccionTorneo,
  seleccionRuleta,
  precalcularRuleta,
  seleccionarPadres,
};