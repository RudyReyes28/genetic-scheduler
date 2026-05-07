
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
//    La probabilidad se decide fuera de este módulo.
//    Cuando estas funciones se llaman, aplican la mutación directamente.
//
// IMPORTANTE:
//    Al igual que en el cruce, solo se mutan los atributos de asignación.
//    Los metadatos de contexto y las fijaciones nunca se tocan.
//    repararIndividuo() al final garantiza que las fijaciones se respeten.

const { repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin,
  generarDistribucionLab }          = require('./cromosoma');
const { GEN, esLaboratorio, setDistribucionLab,
        periodoIndexFromId, salonIndexFromId, docenteIndexFromId } = require('./genoma');
 
// ----------------------- MUTACIÓN POR INTERCAMBIO ----------------------------
 
function mutacionIntercambio(individuo) {
  const idxCursos = individuo.genes
    .map((g, i) => (!esLaboratorio(g) ? i : null)).filter(i => i !== null);
  const idxLabs = individuo.genes
    .map((g, i) => (esLaboratorio(g)  ? i : null)).filter(i => i !== null);
 
  if (idxCursos.length >= 2) {
    const [i, j] = elegirDosDinstintos(idxCursos);
    intercambiarAsignacion(individuo.genes, i, j);
  }
 
  if (idxLabs.length >= 2) {
    const [i, j] = elegirDosDinstintos(idxLabs);
    intercambiarAsignacion(individuo.genes, i, j);
  }
 
  return repararIndividuo(individuo);
}
 
function intercambiarAsignacion(genes, i, j) {
  const tmp = {
    salon_id:          genes[i][GEN.SALON_ID],
    docente_id:        genes[i][GEN.DOCENTE_ID],
    periodo_inicio_id: genes[i][GEN.PERIODO_INICIO_ID],
    periodo_fin_id:    genes[i][GEN.PERIODO_FIN_ID],
    dia_horario_id:    genes[i][GEN.DIA_HORARIO_ID],
    dist_martes_inicio: genes[i][GEN.DIST_MARTES_INICIO_ID],
    dist_martes_fin:    genes[i][GEN.DIST_MARTES_FIN_ID],
    dist_jueves_inicio: genes[i][GEN.DIST_JUEVES_INICIO_ID],
    dist_jueves_fin:    genes[i][GEN.DIST_JUEVES_FIN_ID],
    dist_martes_num:    genes[i][GEN.DIST_MARTES_NUM_PERIODOS],
    dist_jueves_num:    genes[i][GEN.DIST_JUEVES_NUM_PERIODOS],
  };
 
  genes[i][GEN.SALON_ID] = genes[j][GEN.SALON_ID];
  genes[i][GEN.DOCENTE_ID] = genes[j][GEN.DOCENTE_ID];
  genes[i][GEN.PERIODO_INICIO_ID] = genes[j][GEN.PERIODO_INICIO_ID];
  genes[i][GEN.PERIODO_FIN_ID] = genes[j][GEN.PERIODO_FIN_ID];
  genes[i][GEN.DIA_HORARIO_ID] = genes[j][GEN.DIA_HORARIO_ID];
  genes[i][GEN.DIST_MARTES_INICIO_ID] = genes[j][GEN.DIST_MARTES_INICIO_ID];
  genes[i][GEN.DIST_MARTES_FIN_ID] = genes[j][GEN.DIST_MARTES_FIN_ID];
  genes[i][GEN.DIST_JUEVES_INICIO_ID] = genes[j][GEN.DIST_JUEVES_INICIO_ID];
  genes[i][GEN.DIST_JUEVES_FIN_ID] = genes[j][GEN.DIST_JUEVES_FIN_ID];
  genes[i][GEN.DIST_MARTES_NUM_PERIODOS] = genes[j][GEN.DIST_MARTES_NUM_PERIODOS];
  genes[i][GEN.DIST_JUEVES_NUM_PERIODOS] = genes[j][GEN.DIST_JUEVES_NUM_PERIODOS];
 
  genes[j][GEN.SALON_ID] = tmp.salon_id;
  genes[j][GEN.DOCENTE_ID] = tmp.docente_id;
  genes[j][GEN.PERIODO_INICIO_ID] = tmp.periodo_inicio_id;
  genes[j][GEN.PERIODO_FIN_ID] = tmp.periodo_fin_id;
  genes[j][GEN.DIA_HORARIO_ID] = tmp.dia_horario_id;
  genes[j][GEN.DIST_MARTES_INICIO_ID] = tmp.dist_martes_inicio;
  genes[j][GEN.DIST_MARTES_FIN_ID] = tmp.dist_martes_fin;
  genes[j][GEN.DIST_JUEVES_INICIO_ID] = tmp.dist_jueves_inicio;
  genes[j][GEN.DIST_JUEVES_FIN_ID] = tmp.dist_jueves_fin;
  genes[j][GEN.DIST_MARTES_NUM_PERIODOS] = tmp.dist_martes_num;
  genes[j][GEN.DIST_JUEVES_NUM_PERIODOS] = tmp.dist_jueves_num;
}
 
// -------------------- MUTACIÓN POR REINSERCIÓN ALEATORIA ----------------------------
 
function mutacionReisercion(individuo, ctx) {
  for (let i = 0; i < individuo.genes.length; i++) {
    const gen = individuo.genes[i];
    const numPeriodos = esLaboratorio(gen) ? 3 : 1;

    // 1. Nuevo docente
    if (!gen[GEN.DOCENTE_FIJO_ID]) {
      const posiblesLab = esLaboratorio(gen)
        ? (ctx.docentesCursoLab[gen[GEN.CURSO_ID]] ?? []) : [];
      const posibles = esLaboratorio(gen)
        ? (posiblesLab.length > 0 ? posiblesLab : ctx.docentesCurso[gen[GEN.CURSO_ID]] ?? [])
        : (ctx.docentesCurso[gen[GEN.CURSO_ID]] ?? []);

      // Respetar relación si existe, si no usar cualquier docente
          const candidatos = posibles.length > 0
            ? posibles
            : ctx.docentes.map(d => d.id);

          const nuevo = elegirAlAzar(candidatos);
          if (nuevo) gen[GEN.DOCENTE_ID] = docenteIndexFromId(ctx, nuevo);
    }

    // 2. Nuevo periodo y distribucion_lab
    if (!gen[GEN.PERIODO_FIJO_INICIO_ID]) {
      if (esLaboratorio(gen)) {
        // Recalcular distribución completa para el lab
        const metadataLab = {
          puede_manana: gen[GEN.PUEDE_MANANA],
          puede_tarde: gen[GEN.PUEDE_TARDE],
          curso_id: gen[GEN.CURSO_ID],
        };
        const distribucion = generarDistribucionLab(metadataLab, ctx, gen[GEN.DOCENTE_ID]);
        setDistribucionLab(gen, distribucion);

        gen[GEN.PERIODO_INICIO_ID] =
          gen[GEN.DIST_MARTES_INICIO_ID] ??
          gen[GEN.DIST_JUEVES_INICIO_ID] ??
          gen[GEN.PERIODO_INICIO_ID];

        gen[GEN.PERIODO_FIN_ID] =
          gen[GEN.DIST_JUEVES_FIN_ID] ??
          gen[GEN.DIST_MARTES_FIN_ID] ??
          gen[GEN.PERIODO_FIN_ID];

      } else {
        const validos = periodosValidos(
          ctx, gen[GEN.PUEDE_MANANA], gen[GEN.PUEDE_TARDE], gen[GEN.DOCENTE_ID], numPeriodos
        );
        const nuevo = elegirAlAzar(validos);
        if (nuevo) {
          gen[GEN.PERIODO_INICIO_ID] = periodoIndexFromId(ctx, nuevo.id);
          gen[GEN.PERIODO_FIN_ID] = periodoIndexFromId(ctx, calcularPeriodoFin(ctx, nuevo.id, numPeriodos));
        }
      }
    }

    // 3. Nuevo salón
    if (!gen[GEN.SALON_FIJO_ID] && !gen[GEN.SIN_SALON]) {
      const validos = salonesValidos(ctx, esLaboratorio(gen), gen[GEN.PERIODO_INICIO_ID]);

      // Filtrar salones ya usados en este slot por otros genes del individuo
      const salonesOcupados = new Set(
        individuo.genes
          .filter(g => g !== gen &&
            g[GEN.SALON_ID] &&
            g[GEN.DIA_HORARIO_ID] === gen[GEN.DIA_HORARIO_ID] &&
            g[GEN.PERIODO_INICIO_ID] === gen[GEN.PERIODO_INICIO_ID])
          .map(g => g[GEN.SALON_ID])
      );

      const validosLibres = validos.filter(s => !salonesOcupados.has(s.id));
      const pool = validosLibres.length > 0 ? validosLibres : validos;
      const nuevo = elegirAlAzar(pool);
      if (nuevo) gen[GEN.SALON_ID] = salonIndexFromId(ctx, nuevo.id);
    }

    // 4. Día (fijo por tipo: LMV para cursos, MarJue para labs)
    if (!gen[GEN.DIA_HORARIO_FIJO_ID]) {
      gen[GEN.DIA_HORARIO_ID] = esLaboratorio(gen) ? 2 : 1;
    }
  }

  return repararIndividuo(individuo);
}

// ------------------- FUNCION UNIFICADA --------------

function mutar(individuo, metodo = 'intercambio', _tasa = 0.05, ctx = null) {
  if (metodo === 'reisercion') {
    if (!ctx) throw new Error('mutar: ctx es requerido para método reisercion');
    return mutacionReisercion(individuo, ctx);
  }
  return mutacionIntercambio(individuo);
}
 
// -------------------- HELPERS --------------

function elegirDosDinstintos(indices) {
  const copia = [...indices];
  const i     = Math.floor(Math.random() * copia.length);
  const valA  = copia.splice(i, 1)[0];
  const valB  = copia[Math.floor(Math.random() * copia.length)];
  return [valA, valB];
}
 
module.exports = { mutacionIntercambio, mutacionReisercion, mutar };