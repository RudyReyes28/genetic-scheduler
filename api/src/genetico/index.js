// src/genetico/index.js
const { cargarContexto }                        = require('./contexto');
const { generarIndividuo, generarPoblacion,
        repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin }                    = require('./cromosoma');

const { evaluarAptitud, evaluarPoblacion } = require('./aptitud');


const { seleccionarPadres } = require('./seleccion');

const { cruzar } = require('./cruce');

const { mutar } = require('./mutacion');

const { ejecutarAG, guardarHorario } = require('./algoritmo');

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
  evaluarPoblacion,
  seleccionarPadres,
  cruzar,
  mutar,
  ejecutarAG,
  guardarHorario
};