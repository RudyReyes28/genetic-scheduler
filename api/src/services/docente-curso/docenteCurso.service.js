const db = require('../../db');
const { ApiError, mapPgError } = require('../common/errors');

function toBool(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return Boolean(value);
}

async function ensureDocenteExiste(docenteId) {
  const { rowCount } = await db.query('SELECT id FROM docentes WHERE id = $1', [docenteId]);
  if (rowCount === 0) {
    throw new ApiError(404, 'El docente indicado no existe.');
  }
}

async function ensureCursoExiste(cursoId) {
  const { rowCount } = await db.query('SELECT id FROM cursos WHERE id = $1', [cursoId]);
  if (rowCount === 0) {
    throw new ApiError(404, 'El curso indicado no existe.');
  }
}

async function getAll() {
  const { rows } = await db.query('SELECT * FROM docente_curso ORDER BY id ASC');
  return rows;
}

async function create(payload) {
  try {
    if (!payload?.docente_id || !payload?.curso_id) {
      throw new ApiError(400, 'Debe enviar docente_id y curso_id.');
    }

    await ensureDocenteExiste(payload.docente_id);
    await ensureCursoExiste(payload.curso_id);

    const { rows } = await db.query(
      `INSERT INTO docente_curso (docente_id, curso_id, puede_laboratorio)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        payload.docente_id,
        payload.curso_id,
        toBool(payload.puede_laboratorio, false),
      ],
    );

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}

async function remove(id) {
  try {
    const { rowCount } = await db.query('DELETE FROM docente_curso WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new ApiError(404, 'Relación docente-curso no encontrada.');
    }

    return { message: 'Relación docente-curso eliminada correctamente.' };
  } catch (error) {
    throw mapPgError(error);
  }
}

module.exports = {
  getAll,
  create,
  remove,
};
