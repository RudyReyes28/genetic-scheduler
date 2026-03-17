// src/genetico/index.js
const { cargarContexto }                        = require('./contexto');
const { generarIndividuo, generarPoblacion,
        repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin }                    = require('./cromosoma');

module.exports = {
  cargarContexto,
  generarIndividuo,
  generarPoblacion,
  repararIndividuo,
  elegirAlAzar,
  periodosValidos,
  salonesValidos,
  calcularPeriodoFin,
};