const db = require('../db');

const findAll = async () => {
  const result = await db.query(
    'SELECT * FROM docentes ORDER BY id ASC'
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM docentes WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const create = async ({
  nombre,
  registro_personal,
  hora_entrada,
  hora_salida,
  activo,
}) => {
  const result = await db.query(
    `INSERT INTO docentes
    (
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo ?? true,
    ]
  );
  return result.rows[0];
};

const update = async (
  id,
  {
    nombre,
    registro_personal,
    hora_entrada,
    hora_salida,
    activo,
  }
) => {
  const result = await db.query(
    `UPDATE docentes
     SET nombre = $1,
         registro_personal = $2,
         hora_entrada = $3,
         hora_salida = $4,
         activo = $5
     WHERE id = $6
     RETURNING *`,
    [
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo ?? true,
      id,
    ]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM docentes WHERE id = $1 RETURNING *',
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