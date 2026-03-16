const db = require('../../db');
const { ApiError, mapPgError } = require('../common/errors');

function toBool(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return Boolean(value);
}

async function ensureCursoExiste(cursoId) {
  const { rowCount } = await db.query('SELECT id FROM cursos WHERE id = $1', [cursoId]);
  if (rowCount === 0) {
    throw new ApiError(404, 'El curso indicado no existe.');
  }
}

async function getAll() {
  const { rows } = await db.query('SELECT * FROM laboratorios ORDER BY id ASC');
  return rows;
}

async function getById(id) {
  const { rows } = await db.query('SELECT * FROM laboratorios WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Laboratorio no encontrado.');
  }
  return rows[0];
}

async function create(payload) {
  try {
    if (!payload?.curso_id) {
      throw new ApiError(400, 'Debe enviar curso_id para el laboratorio.');
    }

    await ensureCursoExiste(payload.curso_id);

    const { rows } = await db.query(
      `INSERT INTO laboratorios
        (curso_id, nombre, num_periodos, puede_manana, puede_tarde, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        payload.curso_id,
        payload.nombre || null,
        payload.num_periodos || 3,
        toBool(payload.puede_manana, true),
        toBool(payload.puede_tarde, true),
        toBool(payload.activo, true),
      ],
    );

    await db.query('UPDATE cursos SET tiene_laboratorio = TRUE WHERE id = $1', [payload.curso_id]);

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}


async function update(id, payload) {
  try {
    const current = await getById(id);

    if (payload.curso_id && payload.curso_id !== current.curso_id) {
      await ensureCursoExiste(payload.curso_id);
    }

    const { rows } = await db.query(
      `UPDATE laboratorios
       SET curso_id = $1,
           nombre = $2,
           num_periodos = $3,
           puede_manana = $4,
           puede_tarde = $5,
           activo = $6
       WHERE id = $7
       RETURNING *`,
      [
        payload.curso_id ?? current.curso_id,
        payload.nombre ?? current.nombre,
        payload.num_periodos ?? current.num_periodos,
        payload.puede_manana !== undefined ? toBool(payload.puede_manana) : current.puede_manana,
        payload.puede_tarde !== undefined ? toBool(payload.puede_tarde) : current.puede_tarde,
        payload.activo !== undefined ? toBool(payload.activo) : current.activo,
        id,
      ],
    );

    await db.query('UPDATE cursos SET tiene_laboratorio = TRUE WHERE id = $1', [rows[0].curso_id]);

    if (current.curso_id !== rows[0].curso_id) {
      const oldLabs = await db.query('SELECT id FROM laboratorios WHERE curso_id = $1', [current.curso_id]);
      if (oldLabs.rowCount === 0) {
        await db.query('UPDATE cursos SET tiene_laboratorio = FALSE WHERE id = $1', [current.curso_id]);
      }
    }

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}

async function remove(id) {
  try {
    const current = await getById(id);

    await db.query('DELETE FROM laboratorios WHERE id = $1', [id]);

    const remaining = await db.query('SELECT id FROM laboratorios WHERE curso_id = $1', [current.curso_id]);
    if (remaining.rowCount === 0) {
      await db.query('UPDATE cursos SET tiene_laboratorio = FALSE WHERE id = $1', [current.curso_id]);
    }

    return { message: 'Laboratorio eliminado correctamente.' };
  } catch (error) {
    throw mapPgError(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
