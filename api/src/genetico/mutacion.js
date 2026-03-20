
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

const { repararIndividuo, elegirAlAzar,
        periodosValidos, salonesValidos,
        calcularPeriodoFin,
        generarDistribucionLab }          = require('./cromosoma');
 
// ----------------------- MUTACIÓN POR INTERCAMBIO ----------------------------
 
function mutacionIntercambio(individuo, tasa) {
  const idxCursos = individuo.genes
    .map((g, i) => (!g.es_laboratorio ? i : null)).filter(i => i !== null);
  const idxLabs = individuo.genes
    .map((g, i) => (g.es_laboratorio  ? i : null)).filter(i => i !== null);
 
  if (idxCursos.length >= 2 && Math.random() < tasa) {
    const [i, j] = elegirDosDinstintos(idxCursos);
    intercambiarAsignacion(individuo.genes, i, j);
  }
 
  if (idxLabs.length >= 2 && Math.random() < tasa) {
    const [i, j] = elegirDosDinstintos(idxLabs);
    intercambiarAsignacion(individuo.genes, i, j);
  }
 
  return repararIndividuo(individuo);
}
 
function intercambiarAsignacion(genes, i, j) {
  const tmp = {
    salon_id:          genes[i].salon_id,
    docente_id:        genes[i].docente_id,
    periodo_inicio_id: genes[i].periodo_inicio_id,
    periodo_fin_id:    genes[i].periodo_fin_id,
    dia_horario_id:    genes[i].dia_horario_id,
    distribucion_lab:  genes[i].distribucion_lab,
  };
 
  genes[i].salon_id          = genes[j].salon_id;
  genes[i].docente_id        = genes[j].docente_id;
  genes[i].periodo_inicio_id = genes[j].periodo_inicio_id;
  genes[i].periodo_fin_id    = genes[j].periodo_fin_id;
  genes[i].dia_horario_id    = genes[j].dia_horario_id;
  genes[i].distribucion_lab  = genes[j].distribucion_lab;
 
  genes[j].salon_id          = tmp.salon_id;
  genes[j].docente_id        = tmp.docente_id;
  genes[j].periodo_inicio_id = tmp.periodo_inicio_id;
  genes[j].periodo_fin_id    = tmp.periodo_fin_id;
  genes[j].dia_horario_id    = tmp.dia_horario_id;
  genes[j].distribucion_lab  = tmp.distribucion_lab;
}
 
// -------------------- MUTACIÓN POR REINSERCIÓN ALEATORIA ----------------------------
 
function mutacionReisercion(individuo, tasa, ctx) {
  for (let i = 0; i < individuo.genes.length; i++) {
    if (Math.random() >= tasa) continue;

    const gen = individuo.genes[i];
    const numPeriodos = gen.es_laboratorio ? 3 : 1;

    // 1. Nuevo docente
    if (!gen.docente_fijo_id) {
      const posiblesLab = gen.es_laboratorio
        ? (ctx.docentesCursoLab[gen.curso_id] ?? []) : [];
      const posibles = gen.es_laboratorio
        ? (posiblesLab.length > 0 ? posiblesLab : ctx.docentesCurso[gen.curso_id] ?? [])
        : (ctx.docentesCurso[gen.curso_id] ?? []);

      // Respetar relación si existe, si no usar cualquier docente
      const candidatos = posibles.length > 0
        ? posibles
        : ctx.docentes.map(d => d.id);

      const nuevo = elegirAlAzar(candidatos);
      if (nuevo) gen.docente_id = nuevo;
    }

    // 2. Nuevo periodo y distribucion_lab
    if (!gen.periodo_fijo_inicio_id) {
      if (gen.es_laboratorio) {
        // Recalcular distribución completa para el lab
        const metadataLab = {
          puede_manana: gen.puede_manana,
          puede_tarde: gen.puede_tarde,
          curso_id: gen.curso_id,
        };
        gen.distribucion_lab = generarDistribucionLab(metadataLab, ctx, gen.docente_id);

        gen.periodo_inicio_id =
          gen.distribucion_lab.martes.periodo_inicio_id ??
          gen.distribucion_lab.jueves.periodo_inicio_id ??
          gen.periodo_inicio_id;

        gen.periodo_fin_id =
          gen.distribucion_lab.jueves.periodo_fin_id ??
          gen.distribucion_lab.martes.periodo_fin_id ??
          gen.periodo_fin_id;

      } else {
        const validos = periodosValidos(
          ctx, gen.puede_manana, gen.puede_tarde, gen.docente_id, numPeriodos
        );
        const nuevo = elegirAlAzar(validos);
        if (nuevo) {
          gen.periodo_inicio_id = nuevo.id;
          gen.periodo_fin_id = calcularPeriodoFin(ctx, nuevo.id, numPeriodos);
        }
      }
    }

    // 3. Nuevo salón
    if (!gen.salon_fijo_id && !gen.sin_salon) {
      const validos = salonesValidos(ctx, gen.es_laboratorio, gen.periodo_inicio_id);

      // Filtrar salones ya usados en este slot por otros genes del individuo
      const salonesOcupados = new Set(
        individuo.genes
          .filter(g => g !== gen &&
            g.salon_id &&
            g.dia_horario_id === gen.dia_horario_id &&
            g.periodo_inicio_id === gen.periodo_inicio_id)
          .map(g => g.salon_id)
      );

      const validosLibres = validos.filter(s => !salonesOcupados.has(s.id));
      const pool = validosLibres.length > 0 ? validosLibres : validos;
      const nuevo = elegirAlAzar(pool);
      if (nuevo) gen.salon_id = nuevo.id;
    }

    // 4. Día (fijo por tipo: LMV para cursos, MarJue para labs)
    if (!gen.dia_horario_fijo_id) {
      gen.dia_horario_id = gen.es_laboratorio ? 2 : 1;
    }
  }

  return repararIndividuo(individuo);
}

// ------------------- FUNCION UNIFICADA --------------

function mutar(individuo, metodo = 'intercambio', tasa = 0.05, ctx = null) {
  if (metodo === 'reisercion') {
    if (!ctx) throw new Error('mutar: ctx es requerido para método reisercion');
    return mutacionReisercion(individuo, tasa, ctx);
  }
  return mutacionIntercambio(individuo, tasa);
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