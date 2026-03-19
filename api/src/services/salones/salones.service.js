const db = require('../../db');

const findAll = async () => {
  const result = await db.query(
    'SELECT * FROM salones ORDER BY id ASC'
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM salones WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const create = async ({
  nombre,
  capacidad,
  es_laboratorio,
  lab_habilitado_teorico,
  disponible_manana,
  disponible_tarde,
  activo,
}) => {
  const result = await db.query(
    `INSERT INTO salones
    (
      nombre,
      capacidad,
      es_laboratorio,
      lab_habilitado_teorico,
      disponible_manana,
      disponible_tarde,
      activo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      nombre,
      capacidad ?? null,
      es_laboratorio ?? false,
      lab_habilitado_teorico ?? false,
      disponible_manana ?? true,
      disponible_tarde ?? true,
      activo ?? true,
    ]
  );
  return result.rows[0];
};

const update = async (
  id,
  {
    nombre,
    capacidad,
    es_laboratorio,
    lab_habilitado_teorico,
    disponible_manana,
    disponible_tarde,
    activo,
  }
) => {
  const result = await db.query(
    `UPDATE salones
     SET nombre = $1,
         capacidad = $2,
         es_laboratorio = $3,
         lab_habilitado_teorico = $4,
         disponible_manana = $5,
         disponible_tarde = $6,
         activo = $7
     WHERE id = $8
     RETURNING *`,
    [
      nombre,
      capacidad ?? null,
      es_laboratorio ?? false,
      lab_habilitado_teorico ?? false,
      disponible_manana ?? true,
      disponible_tarde ?? true,
      activo ?? true,
      id,
    ]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM salones WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};