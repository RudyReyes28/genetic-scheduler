const GEN = {
  SECCION_ID: 0,
  SECCION_LAB_ID: 1,
  SALON_ID: 2,
  DOCENTE_ID: 3,
  PERIODO_INICIO_ID: 4,
  PERIODO_FIN_ID: 5,
  DIA_HORARIO_ID: 6,
  ES_LABORATORIO: 7,
  SIN_SALON: 8,
  CURSO_ID: 9,
  SEMESTRE: 10,
  CARRERA_ID: 11,
  TIPO: 12,
  PUEDE_MANANA: 13,
  PUEDE_TARDE: 14,
  NUM_ESTUDIANTES: 15,
  SALON_FIJO_ID: 16,
  DOCENTE_FIJO_ID: 17,
  PERIODO_FIJO_INICIO_ID: 18,
  DIA_HORARIO_FIJO_ID: 19,
  DIST_MARTES_INICIO_ID: 20,
  DIST_MARTES_FIN_ID: 21,
  DIST_JUEVES_INICIO_ID: 22,
  DIST_JUEVES_FIN_ID: 23,
  DIST_MARTES_NUM_PERIODOS: 24,
  DIST_JUEVES_NUM_PERIODOS: 25,
  LENGTH: 26,
};

const TIPO_OBLIGATORIO = 0;
const TIPO_OPTATIVO = 1;

function elegirAlAzar(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function crearGenBase() {
  return new Array(GEN.LENGTH).fill(null);
}

function clonarGen(gen) {
  return gen.slice();
}

function clonarIndividuo(individuo) {
  return {
    genes: individuo.genes.map(clonarGen),
    aptitud: individuo.aptitud,
  };
}

function esLaboratorio(gen) {
  return gen[GEN.ES_LABORATORIO] === 1;
}

function setDistribucionLab(gen, distribucion) {
  const martes = distribucion.martes ?? {};
  const jueves = distribucion.jueves ?? {};

  gen[GEN.DIST_MARTES_NUM_PERIODOS] = martes.num_periodos ?? 0;
  gen[GEN.DIST_MARTES_INICIO_ID] = martes.periodo_inicio_id ?? null;
  gen[GEN.DIST_MARTES_FIN_ID] = martes.periodo_fin_id ?? null;
  gen[GEN.DIST_JUEVES_NUM_PERIODOS] = jueves.num_periodos ?? 0;
  gen[GEN.DIST_JUEVES_INICIO_ID] = jueves.periodo_inicio_id ?? null;
  gen[GEN.DIST_JUEVES_FIN_ID] = jueves.periodo_fin_id ?? null;
}

function obtenerDistribucionLab(gen) {
  return {
    martes: {
      num_periodos: gen[GEN.DIST_MARTES_NUM_PERIODOS] ?? 0,
      periodo_inicio_id: gen[GEN.DIST_MARTES_INICIO_ID] ?? null,
      periodo_fin_id: gen[GEN.DIST_MARTES_FIN_ID] ?? null,
    },
    jueves: {
      num_periodos: gen[GEN.DIST_JUEVES_NUM_PERIODOS] ?? 0,
      periodo_inicio_id: gen[GEN.DIST_JUEVES_INICIO_ID] ?? null,
      periodo_fin_id: gen[GEN.DIST_JUEVES_FIN_ID] ?? null,
    },
  };
}

function obtenerBloques(gen) {
  if (!esLaboratorio(gen)) {
    return [{
      dia: gen[GEN.DIA_HORARIO_ID],
      periodoInicio: gen[GEN.PERIODO_INICIO_ID],
      periodoFin: gen[GEN.PERIODO_FIN_ID],
    }];
  }

  const bloques = [];

  if (gen[GEN.DIST_MARTES_NUM_PERIODOS] > 0 && gen[GEN.DIST_MARTES_INICIO_ID]) {
    bloques.push({
      dia: 2,
      periodoInicio: gen[GEN.DIST_MARTES_INICIO_ID],
      periodoFin: gen[GEN.DIST_MARTES_FIN_ID],
    });
  }

  if (gen[GEN.DIST_JUEVES_NUM_PERIODOS] > 0 && gen[GEN.DIST_JUEVES_INICIO_ID]) {
    bloques.push({
      dia: 4,
      periodoInicio: gen[GEN.DIST_JUEVES_INICIO_ID],
      periodoFin: gen[GEN.DIST_JUEVES_FIN_ID],
    });
  }

  return bloques;
}

function nombreGen(gen) {
  return gen[GEN.SECCION_ID] ?? `lab-${gen[GEN.SECCION_LAB_ID]}`;
}

// ---------- Helpers id <-> índice (usa el contexto cargado) ----------
function periodoIndexFromId(ctx, periodoId) {
  return ctx?.periodosIndexById?.[periodoId] ?? null;
}

function periodoIdFromIndex(ctx, idx) {
  const p = ctx?.periodosByIndex?.[idx];
  return p ? p.id : null;
}

function salonIndexFromId(ctx, salonId) {
  return ctx?.salonesIndexById?.[salonId] ?? null;
}

function salonIdFromIndex(ctx, idx) {
  const s = ctx?.salonesByIndex?.[idx];
  return s ? s.id : null;
}

function docenteIndexFromId(ctx, docenteId) {
  return ctx?.docentesIndexById?.[docenteId] ?? null;
}

function docenteIdFromIndex(ctx, idx) {
  const d = ctx?.docentesByIndex?.[idx];
  return d ? d.id : null;
}

// Resolución flexible: acepta índice (0..N-1) o id de BD
function periodoFromValue(ctx, val) {
  if (val == null) return null;
  if (Number.isInteger(val) && ctx?.periodosByIndex?.[val]) return ctx.periodosByIndex[val];
  return ctx?.periodosById?.[val] ?? null;
}

function salonFromValue(ctx, val) {
  if (val == null) return null;
  if (Number.isInteger(val) && ctx?.salonesByIndex?.[val]) return ctx.salonesByIndex[val];
  return ctx?.salonesById?.[val] ?? null;
}

function docenteFromValue(ctx, val) {
  if (val == null) return null;
  if (Number.isInteger(val) && ctx?.docentesByIndex?.[val]) return ctx.docentesByIndex[val];
  return ctx?.docentesById?.[val] ?? null;
}

module.exports = {
  GEN,
  TIPO_OBLIGATORIO,
  TIPO_OPTATIVO,
  elegirAlAzar,
  crearGenBase,
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
  periodoFromValue,
  salonFromValue,
  docenteFromValue,
};