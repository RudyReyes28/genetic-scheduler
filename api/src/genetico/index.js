// src/genetico/index.js
const { cargarContexto }                        = require('./contexto');
const { generarIndividuo, generarPoblacion,
        repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin }                    = require('./cromosoma');
const { GEN, TIPO_OBLIGATORIO, TIPO_OPTATIVO,
        clonarGen, clonarIndividuo,
        esLaboratorio, setDistribucionLab,
        obtenerDistribucionLab, obtenerBloques,
        nombreGen,
        periodoIndexFromId, periodoIdFromIndex,
        salonIndexFromId, salonIdFromIndex,
        docenteIndexFromId, docenteIdFromIndex } = require('./genoma');

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
  GEN,
  TIPO_OBLIGATORIO,
  TIPO_OPTATIVO,
  clonarGen,
  clonarIndividuo,
  esLaboratorio,
  setDistribucionLab,
  obtenerDistribucionLab,
  obtenerBloques,
  nombreGen,
  periodoIndexFromId,
  periodoIdFromIndex,
  salonIndexFromId,
  salonIdFromIndex,
  docenteIndexFromId,
  docenteIdFromIndex,
  evaluarAptitud,
  evaluarPoblacion,
  seleccionarPadres,
  cruzar,
  mutar,
  ejecutarAG,
  guardarHorario
};