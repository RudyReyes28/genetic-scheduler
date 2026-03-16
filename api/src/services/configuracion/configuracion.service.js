const db = require('../../db');
const { mapPgError } = require('../common/errors');
const {
  REGENERATION_FIELDS,
  parseTimeToMinutes,
  regenerarPeriodos,
  validateConfigRanges,
} = require('../periodos/regenerarPeriodos.service');

function normalizeValue(key, value) {
  if (value === undefined) {
    return undefined;
  }

  if (REGENERATION_FIELDS.includes(key) && key !== 'duracion_periodo') {
    return parseTimeToMinutes(value);
  }

  if (key === 'duracion_periodo') {
    return Number(value);
  }

  return value;
}

function shouldRegeneratePeriods(current, payload) {
  return REGENERATION_FIELDS.some((field) => {
    if (payload[field] === undefined) {
      return false;
    }

    return normalizeValue(field, payload[field]) !== normalizeValue(field, current[field]);
  });
}

async function ensureConfigRecord(client) {
  const existing = await client.query(
    'SELECT * FROM configuracion_algoritmo ORDER BY id ASC LIMIT 1',
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const inserted = await client.query(
    'INSERT INTO configuracion_algoritmo DEFAULT VALUES RETURNING *',
  );

  await regenerarPeriodos(inserted.rows[0], client);
  return inserted.rows[0];
}

async function getCurrent() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const config = await ensureConfigRecord(client);
    await client.query('COMMIT');
    return config;
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

async function update(payload) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const current = await ensureConfigRecord(client);
    const nextConfig = {
      tamano_poblacion: payload.tamano_poblacion ?? current.tamano_poblacion,
      max_generaciones: payload.max_generaciones ?? current.max_generaciones,
      aptitud_objetivo: payload.aptitud_objetivo ?? current.aptitud_objetivo,
      tasa_mutacion: payload.tasa_mutacion ?? current.tasa_mutacion,
      metodo_seleccion: payload.metodo_seleccion ?? current.metodo_seleccion,
      metodo_cruce: payload.metodo_cruce ?? current.metodo_cruce,
      metodo_mutacion: payload.metodo_mutacion ?? current.metodo_mutacion,
      duracion_periodo: payload.duracion_periodo ?? current.duracion_periodo,
      hora_inicio_manana: payload.hora_inicio_manana ?? current.hora_inicio_manana,
      hora_fin_manana: payload.hora_fin_manana ?? current.hora_fin_manana,
      hora_inicio_tarde: payload.hora_inicio_tarde ?? current.hora_inicio_tarde,
      hora_fin_tarde: payload.hora_fin_tarde ?? current.hora_fin_tarde,
    };

    validateConfigRanges(nextConfig);

    const updated = await client.query(
      `UPDATE configuracion_algoritmo
       SET tamano_poblacion = $1,
           max_generaciones = $2,
           aptitud_objetivo = $3,
           tasa_mutacion = $4,
           metodo_seleccion = $5,
           metodo_cruce = $6,
           metodo_mutacion = $7,
           duracion_periodo = $8,
           hora_inicio_manana = $9,
           hora_fin_manana = $10,
           hora_inicio_tarde = $11,
           hora_fin_tarde = $12
       WHERE id = $13
       RETURNING *`,
      [
        nextConfig.tamano_poblacion,
        nextConfig.max_generaciones,
        nextConfig.aptitud_objetivo,
        nextConfig.tasa_mutacion,
        nextConfig.metodo_seleccion,
        nextConfig.metodo_cruce,
        nextConfig.metodo_mutacion,
        nextConfig.duracion_periodo,
        nextConfig.hora_inicio_manana,
        nextConfig.hora_fin_manana,
        nextConfig.hora_inicio_tarde,
        nextConfig.hora_fin_tarde,
        current.id,
      ],
    );

    const updatedConfig = updated.rows[0];

    if (shouldRegeneratePeriods(current, payload)) {
      await regenerarPeriodos(updatedConfig, client);
    }

    await client.query('COMMIT');
    return updatedConfig;
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getCurrent,
  update,
};
