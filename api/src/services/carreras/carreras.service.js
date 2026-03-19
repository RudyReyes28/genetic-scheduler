const db = require('../../db');

const findAll = async () => {
  const result = await db.query(
    'SELECT * FROM carreras ORDER BY id ASC'
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(
    'SELECT * FROM carreras WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const findByCodigo = async (codigo) => {
  const result = await db.query(
    'SELECT * FROM carreras WHERE codigo = $1',
    [codigo]
  );
  return result.rows[0];
};

const create = async ({ nombre, codigo }) => {
  const result = await db.query(
    `INSERT INTO carreras (nombre, codigo)
     VALUES ($1, $2)
     RETURNING *`,
    [nombre, codigo]
  );
  return result.rows[0];
};

const update = async (id, { nombre, codigo }) => {
  const result = await db.query(
    `UPDATE carreras
     SET nombre = $1,
         codigo = $2
     WHERE id = $3
     RETURNING *`,
    [nombre, codigo, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await db.query(
    'DELETE FROM carreras WHERE id = $1 RETURNING *',
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
  findByCodigo,
};