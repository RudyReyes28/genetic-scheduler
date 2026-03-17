// src/genetico/index.js
const { cargarContexto }                        = require('./contexto');
const { generarIndividuo, generarPoblacion,
        repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin }                    = require('./cromosoma');

const { evaluarAptitud, evaluarPoblacion } = require('./aptitud');

module.exports = {
  cargarContexto,
  generarIndividuo,
  generarPoblacion,
  repararIndividuo,
  elegirAlAzar,
  periodosValidos,
  salonesValidos,
  calcularPeriodoFin,
  evaluarAptitud,
  evaluarPoblacion
};