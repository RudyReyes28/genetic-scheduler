
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

const { generarPoblacion }              = require('./cromosoma');
const { evaluarAptitud, evaluarPoblacion } = require('./aptitud');
const { seleccionarPadres }             = require('./seleccion');
const { cruzar }                        = require('./cruce');
const { mutar }                         = require('./mutacion');
const db                                = require('../db');
const { GEN, esLaboratorio, obtenerBloques, clonarIndividuo,
        periodoIdFromIndex, salonIdFromIndex, docenteIdFromIndex } = require('./genoma');

// --------------------- LOOP PRINCIPAL ---------------------

async function ejecutarAG(ctx, onProgreso = null) {
  const config    = ctx.config;
  const historial = [];
  const inicioMs  = Date.now();

  const numElite = Math.max(1, Math.floor(config.tamano_poblacion * 0.10));

  let poblacion      = generarPoblacion(ctx);
  evaluarPoblacion(poblacion, ctx);

  let mejorIndividuo = clonarIndividuo(poblacion[0]);
  let generacion     = 0;

  while (generacion < config.max_generaciones) {
    generacion++;

    if (config.aptitud_objetivo !== null &&
        mejorIndividuo.aptitud  >= config.aptitud_objetivo) break;

    const nuevaPoblacion = [];

    // Elitismo
    for (let i = 0; i < numElite; i++) {
      nuevaPoblacion.push(clonarIndividuo(poblacion[i]));
    }

    // Generar hijos
    while (nuevaPoblacion.length < config.tamano_poblacion) {
      const [padreA, padreB] = seleccionarPadres(poblacion, config.metodo_seleccion, 5);
      const [hijo1, hijo2]   = cruzar(padreA, padreB, config.metodo_cruce);
      const mutado1 = mutar(hijo1, config.metodo_mutacion, config.tasa_mutacion, ctx);
      const mutado2 = mutar(hijo2, config.metodo_mutacion, config.tasa_mutacion, ctx);

      nuevaPoblacion.push(mutado1);
      if (nuevaPoblacion.length < config.tamano_poblacion) nuevaPoblacion.push(mutado2);
    }

    poblacion = evaluarPoblacion(nuevaPoblacion, ctx);

    if (poblacion[0].aptitud > mejorIndividuo.aptitud) {
      mejorIndividuo = clonarIndividuo(poblacion[0]);
    }

    const { detalle } = evaluarAptitud(mejorIndividuo, ctx, true);
    const numConflictos = detalle.filter(d => d.penalizacion).length;

    historial.push({ generacion, mejorAptitud: mejorIndividuo.aptitud, conflictos: numConflictos });

    if (onProgreso) onProgreso({ generacion, mejorAptitud: mejorIndividuo.aptitud, conflictos: numConflictos });
  }

  const stats = {
    generaciones_ejecutadas: generacion,
    tiempo_ejecucion_ms:     Date.now() - inicioMs,
    aptitud_final:           mejorIndividuo.aptitud,
    metodo_seleccion:        config.metodo_seleccion,
    metodo_cruce:            config.metodo_cruce,
    metodo_mutacion:         config.metodo_mutacion,
  };

  return { mejorIndividuo, historial, stats };
}

// ---------------- GUARDAR RESULTADOS ----------------

async function guardarHorario(mejorIndividuo, stats, nombre = 'Horario generado', ctx = null) {
  const { rows: [horario] } = await db.query(`
    INSERT INTO horarios
      (nombre, aptitud_final, generaciones_ejecutadas, tiempo_ejecucion_ms,
       metodo_seleccion, metodo_cruce, metodo_mutacion, es_activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING id
  `, [
    nombre, stats.aptitud_final, stats.generaciones_ejecutadas,
    stats.tiempo_ejecucion_ms, stats.metodo_seleccion,
    stats.metodo_cruce, stats.metodo_mutacion,
  ]);

  const horarioId = horario.id;

  await db.query(`UPDATE horarios SET es_activo = false WHERE id != $1`, [horarioId]);

  if (!ctx) {
    // intentar cargar contexto si no fue provisto
    const { cargarContexto } = require('./contexto');
    ctx = await cargarContexto();
  }

  for (const gen of mejorIndividuo.genes) {
    if (esLaboratorio(gen)) {
      const bloques = obtenerBloques(gen);
      for (const bloque of bloques) {
        const diaEspecifico = bloque.dia === 2 ? 'martes' : 'jueves';
        const periodoInicioId = periodoIdFromIndex(ctx, bloque.periodoInicio);
        const periodoFinId = periodoIdFromIndex(ctx, bloque.periodoFin);
        const salonId = salonIdFromIndex(ctx, gen[GEN.SALON_ID]);
        const docenteId = docenteIdFromIndex(ctx, gen[GEN.DOCENTE_ID]);
        await db.query(`
          INSERT INTO horario_detalle
            (horario_id, seccion_id, seccion_lab_id, salon_id, docente_id,
             dia_horario_id, periodo_inicio_id, periodo_fin_id,
             dia_especifico, modificado_manual)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
        `, [
          horarioId,
          null,
          gen[GEN.SECCION_LAB_ID],
          salonId,
          docenteId,
          gen[GEN.DIA_HORARIO_ID],
          periodoInicioId,
          periodoFinId,
          diaEspecifico,
        ]);
      }

    } else {
      // Curso teórico — una sola fila, dia_especifico null
      const salonId = gen[GEN.SALON_ID] != null ? salonIdFromIndex(ctx, gen[GEN.SALON_ID]) : null;
      const docenteId = gen[GEN.DOCENTE_ID] != null ? docenteIdFromIndex(ctx, gen[GEN.DOCENTE_ID]) : null;
      const periodoInicioId = periodoIdFromIndex(ctx, gen[GEN.PERIODO_INICIO_ID]);
      const periodoFinId = periodoIdFromIndex(ctx, gen[GEN.PERIODO_FIN_ID]);
      await db.query(`
        INSERT INTO horario_detalle
          (horario_id, seccion_id, seccion_lab_id, salon_id, docente_id,
           dia_horario_id, periodo_inicio_id, periodo_fin_id,
           dia_especifico, modificado_manual)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
      `, [
        horarioId,
        gen[GEN.SECCION_ID]     ?? null,
        gen[GEN.SECCION_LAB_ID] ?? null,
        salonId,
        docenteId,
        gen[GEN.DIA_HORARIO_ID],
        periodoInicioId,
        periodoFinId,
        null,
      ]);
    }
  }

  return horarioId;
}

module.exports = { ejecutarAG, guardarHorario };