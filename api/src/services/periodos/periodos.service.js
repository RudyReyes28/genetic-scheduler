const db = require('../../db');
const { mapPgError } = require('../common/errors');
const { regenerarPeriodos } = require('./regenerarPeriodos.service');

async function ensurePeriodsExist() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const existingPeriods = await client.query('SELECT id FROM periodos LIMIT 1');
    if (existingPeriods.rows.length > 0) {
      await client.query('COMMIT');
      return;
    }

    let configResult = await client.query(
      'SELECT * FROM configuracion_algoritmo ORDER BY id ASC LIMIT 1',
    );

    if (configResult.rows.length === 0) {
      configResult = await client.query(
        'INSERT INTO configuracion_algoritmo DEFAULT VALUES RETURNING *',
      );
    }

    await regenerarPeriodos(configResult.rows[0], client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getAll() {
  try {
    await ensurePeriodsExist();

    const { rows } = await db.query(
      'SELECT * FROM periodos ORDER BY numero ASC, id ASC',
    );

    return rows;
  } catch (error) {
    throw mapPgError(error);
  }
}

module.exports = {
  getAll,
};
