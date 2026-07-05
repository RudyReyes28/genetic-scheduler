const db = require('../../db');

const obtener = async (ra) => {
  const result = await db.query(
    `SELECT estudiante, horario_origen_id, detalles, actualizado
     FROM horarios_personales
     WHERE estudiante = $1`,
    [ra]
  );

  if (result.rows.length === 0) {
    return { estudiante: ra, horario_origen_id: null, detalles: [], actualizado: null };
  }

  return result.rows[0];
};

const upsert = async (ra, body) => {
  if (!ra || typeof ra !== 'string' || ra.trim() === '' || ra.length > 50) {
    const err = new Error('El parámetro ra debe ser una cadena no vacía de máximo 50 caracteres');
    err.status = 400;
    throw err;
  }

  const horario_origen_id = body.horario_origen_id ?? null;
  const detalles = Array.isArray(body.detalles) ? body.detalles : [];

  const result = await db.query(
    `INSERT INTO horarios_personales (estudiante, horario_origen_id, detalles, actualizado)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (estudiante) DO UPDATE SET
       horario_origen_id = EXCLUDED.horario_origen_id,
       detalles = EXCLUDED.detalles,
       actualizado = NOW()
     RETURNING *`,
    [ra, horario_origen_id, JSON.stringify(detalles)]
  );

  return result.rows[0];
};

const eliminar = async (ra) => {
  const result = await db.query(
    'DELETE FROM horarios_personales WHERE estudiante = $1 RETURNING *',
    [ra]
  );

  if (result.rows.length === 0) {
    const err = new Error('Horario personal no encontrado');
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

module.exports = {
  obtener,
  upsert,
  eliminar,
};
