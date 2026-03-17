
// Flujo de cada generación:
//
//  1. Evaluar aptitud de toda la población
//  2. Guardar el mejor individuo (elitismo)
//  3. Verificar criterio de parada
//  4. Generar nueva población:
//     a. Conservar élite directamente (sin cruce ni mutación)
//     b. Seleccionar padres
//     c. Cruzar padres → 2 hijos
//     d. Mutar hijos
//     e. Agregar hijos a nueva población
//  5. Reemplazar población con la nueva
//  6. Registrar mejor aptitud de la generación
//  7. Emitir progreso por WebSocket si hay cliente conectado
//  8. Repetir hasta criterio de parada
//
// ELITISMO:
//   Se conserva el top N% de la población sin modificar para
//   garantizar que la mejor solución nunca se pierda entre generaciones.
//   Por defecto N=10% (configurable).
//
// CRITERIOS DE PARADA:
//   - Alcanzar aptitud_objetivo (viene de configuracion_algoritmo)
//   - Alcanzar max_generaciones (viene de configuracion_algoritmo)
// ============================================================

const { generarPoblacion, repararIndividuo } = require('./cromosoma');
const { evaluarAptitud, evaluarPoblacion }   = require('./aptitud');
const { seleccionarPadres }                  = require('./seleccion');
const { cruzar }                             = require('./cruce');
const { mutar }                              = require('./mutacion');
const db                                     = require('../db');

//  --------------- FLUJO PRINCIPAL DEL ALGORITMO GENÉTICO -----------------------

/**
 * Ejecuta el algoritmo genético completo.
 *
 * @param {Contexto}  ctx
 * @param {Function}  onProgreso  - callback opcional llamado cada generación
 *                                  recibe ({ generacion, mejorAptitud, conflictos })
 * @returns {Promise<{ mejorIndividuo, historial, stats }>}
 */
async function ejecutarAG(ctx, onProgreso = null) {
  const config      = ctx.config;
  const historial   = [];   // mejor aptitud por generación
  const inicioMs    = Date.now();

  // Porcentaje de élite a conservar (10% de la población, mínimo 1)
  const numElite = Math.max(1, Math.floor(config.tamano_poblacion * 0.10));

  // ---- 1. Población inicial -----
  let poblacion = generarPoblacion(ctx);
  evaluarPoblacion(poblacion, ctx);

  let mejorIndividuo = poblacion[0]; // evaluarPoblacion ordena de mejor a peor
  let generacion     = 0;

  // --------- 2. Loop generacional -------
  while (generacion < config.max_generaciones) {
    generacion++;

    // ------- 3. Verificar criterio de parada por aptitud -------
    if (config.aptitud_objetivo !== null &&
        mejorIndividuo.aptitud  >= config.aptitud_objetivo) {
      break;
    }

    // ------------- 4. Construir nueva población -----------
    const nuevaPoblacion = [];

    // Elitismo: conservar los mejores sin modificar
    for (let i = 0; i < numElite; i++) {
      nuevaPoblacion.push(clonarIndividuo(poblacion[i]));
    }

    // Rellenar el resto con hijos
    while (nuevaPoblacion.length < config.tamano_poblacion) {
      // a. Selección
      const [padreA, padreB] = seleccionarPadres(
        poblacion,
        config.metodo_seleccion,
        5  // k para torneo
      );

      // b. Cruce
      const [hijo1, hijo2] = cruzar(padreA, padreB, config.metodo_cruce);

      // c. Mutación
      const mutado1 = mutar(hijo1, config.metodo_mutacion,
                            config.tasa_mutacion, ctx);
      const mutado2 = mutar(hijo2, config.metodo_mutacion,
                            config.tasa_mutacion, ctx);

      nuevaPoblacion.push(mutado1);
      // Evitar pasarse del tamaño si tamano_poblacion es impar
      if (nuevaPoblacion.length < config.tamano_poblacion) {
        nuevaPoblacion.push(mutado2);
      }
    }

    // ------------ 5. Evaluar nueva población y actualizar mejor --------
    poblacion = evaluarPoblacion(nuevaPoblacion, ctx);

    if (poblacion[0].aptitud > mejorIndividuo.aptitud) {
      mejorIndividuo = clonarIndividuo(poblacion[0]);
    }

    // ------------ 6. Registrar historial ----------
    const { aptitud, detalle } = evaluarAptitud(mejorIndividuo, ctx, true);
    const numConflictos = detalle.filter(d => d.penalizacion).length;

    historial.push({
      generacion,
      mejorAptitud: mejorIndividuo.aptitud,
      conflictos:   numConflictos,
    });

    // ------------ 7. Emitir progreso al cliente ------------
    if (onProgreso) {
      onProgreso({
        generacion,
        mejorAptitud: mejorIndividuo.aptitud,
        conflictos:   numConflictos,
      });
    }
  }

  const tiempoMs = Date.now() - inicioMs;

  const stats = {
    generaciones_ejecutadas: generacion,
    tiempo_ejecucion_ms:     tiempoMs,
    aptitud_final:           mejorIndividuo.aptitud,
    metodo_seleccion:        config.metodo_seleccion,
    metodo_cruce:            config.metodo_cruce,
    metodo_mutacion:         config.metodo_mutacion,
  };

  return { mejorIndividuo, historial, stats };
}

// --------------- Guardar resultado en BD -----------------------

/**
 * Guarda el mejor individuo encontrado en las tablas
 * horarios y horario_detalle.
 *
 * @param {Individuo} mejorIndividuo
 * @param {Object}    stats
 * @param {string}    nombre  - nombre descriptivo del horario
 * @returns {Promise<number>} id del horario creado
 */
async function guardarHorario(mejorIndividuo, stats, nombre = 'Horario generado') {
  // Insertar en horarios y obtener el id generado
  const { rows: [horario] } = await db.query(`
    INSERT INTO horarios
      (nombre, aptitud_final, generaciones_ejecutadas, tiempo_ejecucion_ms,
       metodo_seleccion, metodo_cruce, metodo_mutacion, es_activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING id
  `, [
    nombre,
    stats.aptitud_final,
    stats.generaciones_ejecutadas,
    stats.tiempo_ejecucion_ms,
    stats.metodo_seleccion,
    stats.metodo_cruce,
    stats.metodo_mutacion,
  ]);

  const horarioId = horario.id;

  // Desactivar cualquier horario activo anterior
  await db.query(`
    UPDATE horarios SET es_activo = false
    WHERE id != $1
  `, [horarioId]);

  // Insertar cada gen como fila en horario_detalle
  for (const gen of mejorIndividuo.genes) {
    await db.query(`
      INSERT INTO horario_detalle
        (horario_id, seccion_id, seccion_lab_id, salon_id, docente_id,
         dia_horario_id, periodo_inicio_id, periodo_fin_id, modificado_manual)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
    `, [
      horarioId,
      gen.seccion_id    ?? null,
      gen.seccion_lab_id ?? null,
      gen.salon_id      ?? null,
      gen.docente_id    ?? null,
      gen.dia_horario_id,
      gen.periodo_inicio_id,
      gen.periodo_fin_id,
    ]);
  }

  return horarioId;
}

// --------------- Helper -----------------------

function clonarIndividuo(individuo) {
  return {
    genes:   individuo.genes.map(g => ({ ...g })),
    aptitud: individuo.aptitud,
  };
}

module.exports = {
  ejecutarAG,
  guardarHorario,
};