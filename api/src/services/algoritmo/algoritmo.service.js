// ============================================================
// SERVICE — Algoritmo Genético
// src/services/algoritmo.service.js
// ============================================================

const db                              = require('../../db');
const { cargarContexto }              = require('../../genetico/contexto');
const { ejecutarAG, guardarHorario }  = require('../../genetico/algoritmo');

// Estado global de la ejecución actual
let estadoEjecucion = {
  corriendo:    false,
  generacion:   0,
  mejorAptitud: null,
  conflictos:   null,
  horarioId:    null,
  error:        null,
};

// ---------- EJECUTAR ALGORITMO ----------------

async function ejecutar(body) {
  if (estadoEjecucion.corriendo) {
    const err = new Error('Ya hay una ejecución en curso. Espera a que termine.');
    err.status = 409;
    throw err;
  }

  estadoEjecucion = {
    corriendo:    true,
    generacion:   0,
    mejorAptitud: null,
    conflictos:   null,
    horarioId:    null,
    error:        null,
  };

  const ctx = await cargarContexto();

  // Aplicar overrides del body sobre la configuración de BD
  const camposOverride = [
    'tamano_poblacion', 'max_generaciones', 'metodo_seleccion',
    'metodo_cruce', 'metodo_mutacion', 'tasa_mutacion', 'aptitud_objetivo',
  ];
  for (const campo of camposOverride) {
    if (body?.[campo] !== undefined) ctx.config[campo] = body[campo];
  }

  const nombre = body?.nombre ?? `Horario ${new Date().toLocaleString('es-GT')}`;

  const onProgreso = ({ generacion, mejorAptitud, conflictos }) => {
    estadoEjecucion.generacion   = generacion;
    estadoEjecucion.mejorAptitud = mejorAptitud;
    estadoEjecucion.conflictos   = conflictos;
  };

  const { mejorIndividuo, historial, stats } = await ejecutarAG(ctx, onProgreso);

  const horarioId = await guardarHorario(mejorIndividuo, stats, nombre);
  estadoEjecucion.horarioId = horarioId;

  await guardarHistorial(horarioId, historial);

  estadoEjecucion.corriendo = false;

  return {
    horario_id: horarioId,
    stats,
    historial_resumen: {
      primera_generacion: historial[0],
      ultima_generacion:  historial[historial.length - 1],
    },
  };
}

// --------- ESTADO DE EJECUCIÓN ----------------

function getEstado() {
  return estadoEjecucion;
}

// -------- HISTORIAL DE GENERACIONES ----------------

async function getHistorial(horarioId) {
  const { rows } = await db.query(`
    SELECT generacion, mejor_aptitud, conflictos
    FROM horario_historial
    WHERE horario_id = $1
    ORDER BY generacion ASC
  `, [horarioId]);

  if (rows.length === 0) {
    const err = new Error('Historial no encontrado');
    err.status = 404;
    throw err;
  }

  return rows;
}

// --------- CONFIGURACIÓN DEL ALGORITMO ----------------

async function getConfiguracion() {
  const { rows: [config] } = await db.query(`
    SELECT * FROM configuracion_algoritmo ORDER BY id LIMIT 1
  `);
  return config;
}

async function updateConfiguracion(campos) {
  const { rows: [configActual] } = await db.query(`
    SELECT * FROM configuracion_algoritmo ORDER BY id LIMIT 1
  `);

  await db.query(`
    UPDATE configuracion_algoritmo SET
      tamano_poblacion   = COALESCE($1,  tamano_poblacion),
      max_generaciones   = COALESCE($2,  max_generaciones),
      aptitud_objetivo   = COALESCE($3,  aptitud_objetivo),
      tasa_mutacion      = COALESCE($4,  tasa_mutacion),
      metodo_seleccion   = COALESCE($5,  metodo_seleccion),
      metodo_cruce       = COALESCE($6,  metodo_cruce),
      metodo_mutacion    = COALESCE($7,  metodo_mutacion),
      duracion_periodo   = COALESCE($8,  duracion_periodo),
      hora_inicio_manana = COALESCE($9,  hora_inicio_manana),
      hora_fin_manana    = COALESCE($10, hora_fin_manana),
      hora_inicio_tarde  = COALESCE($11, hora_inicio_tarde),
      hora_fin_tarde     = COALESCE($12, hora_fin_tarde)
    WHERE id = $13
  `, [
    campos.tamano_poblacion, campos.max_generaciones, campos.aptitud_objetivo,
    campos.tasa_mutacion,    campos.metodo_seleccion, campos.metodo_cruce,
    campos.metodo_mutacion,  campos.duracion_periodo,
    campos.hora_inicio_manana, campos.hora_fin_manana,
    campos.hora_inicio_tarde,  campos.hora_fin_tarde,
    configActual.id,
  ]);

  // Si cambió algún rango de horario, regenerar periodos
  const camposHorario = [
    'hora_inicio_manana', 'hora_fin_manana',
    'hora_inicio_tarde',  'hora_fin_tarde', 'duracion_periodo',
  ];
  const cambioHorario = camposHorario.some(
    c => campos[c] !== undefined && campos[c] !== configActual[c]
  );

  if (cambioHorario) {
    const { rows: [nuevaConfig] } = await db.query(`
      SELECT * FROM configuracion_algoritmo ORDER BY id LIMIT 1
    `);
    await regenerarPeriodos(nuevaConfig);
  }

  const { rows: [configActualizada] } = await db.query(`
    SELECT * FROM configuracion_algoritmo ORDER BY id LIMIT 1
  `);
  return configActualizada;
}

// --------- FUNCIONES AUXILIARES ----------------

async function guardarHistorial(horarioId, historial) {
  for (const punto of historial) {
    await db.query(`
      INSERT INTO horario_historial (horario_id, generacion, mejor_aptitud, conflictos)
      VALUES ($1, $2, $3, $4)
    `, [horarioId, punto.generacion, punto.mejorAptitud, punto.conflictos]);
  }
}

async function regenerarPeriodos(config) {
  await db.query('DELETE FROM periodos');

  const sumarMinutos = (horaStr, minutos) => {
    const [h, m]   = horaStr.split(':').map(Number);
    const totalMin = h * 60 + m + minutos;
    const hh       = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm       = String(totalMin % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const periodos = [];
  let numero = 1;

  let actual = config.hora_inicio_manana;
  while (actual < config.hora_fin_manana) {
    const fin = sumarMinutos(actual, config.duracion_periodo);
    if (fin > config.hora_fin_manana) break;
    periodos.push({ numero, hora_inicio: actual, hora_fin: fin,
                    es_manana: true, es_tarde: false });
    actual = fin;
    numero++;
  }

  actual = config.hora_inicio_tarde;
  while (actual < config.hora_fin_tarde) {
    const fin = sumarMinutos(actual, config.duracion_periodo);
    if (fin > config.hora_fin_tarde) break;
    periodos.push({ numero, hora_inicio: actual, hora_fin: fin,
                    es_manana: false, es_tarde: true });
    actual = fin;
    numero++;
  }

  for (const p of periodos) {
    await db.query(`
      INSERT INTO periodos (numero, hora_inicio, hora_fin, es_manana, es_tarde)
      VALUES ($1, $2, $3, $4, $5)
    `, [p.numero, p.hora_inicio, p.hora_fin, p.es_manana, p.es_tarde]);
  }
}

module.exports = {
  ejecutar,
  getEstado,
  getHistorial,
  getConfiguracion,
  updateConfiguracion,
};