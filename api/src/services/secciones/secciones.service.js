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
  const { rows } = await db.query('SELECT * FROM secciones ORDER BY id ASC');
  return rows;
}

//Obtener secciones por id del curso
async function getByCursoId(cursoId) {
  const { rows } = await db.query('SELECT * FROM secciones WHERE curso_id = $1 ORDER BY id ASC', [cursoId]);
  return rows;
}

async function getById(id) {
  const { rows } = await db.query('SELECT * FROM secciones WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Sección no encontrada.');
  }
  return rows[0];
}

async function create(payload) {
  try {
    if (!payload?.curso_id || !payload?.letra) {
      throw new ApiError(400, 'Debe enviar curso_id y letra.');
    }

    await ensureCursoExiste(payload.curso_id);

    const { rows } = await db.query(
      `INSERT INTO secciones
        (curso_id, letra, num_estudiantes_seccion, salon_fijo_id, docente_fijo_id, periodo_fijo_inicio_id, dia_horario_fijo_id, sin_salon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payload.curso_id,
        payload.letra.trim(),
        payload.num_estudiantes_seccion || null,
        payload.salon_fijo_id || null,
        payload.docente_fijo_id || null,
        payload.periodo_fijo_inicio_id || null,
        payload.dia_horario_fijo_id || null,
        toBool(payload.sin_salon, false),
      ],
    );

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}


async function update(id, payload) {
  try {
    const current = await getById(id);

    const resolveField = (key, currentValue) => (payload[key] !== undefined ? payload[key] : currentValue);

    const nextCursoId = payload.curso_id ?? current.curso_id;
    if (nextCursoId !== current.curso_id) {
      await ensureCursoExiste(nextCursoId);
    }

    const { rows } = await db.query(
      `UPDATE secciones
       SET curso_id = $1,
           letra = $2,
           num_estudiantes_seccion = $3,
           salon_fijo_id = $4,
           docente_fijo_id = $5,
           periodo_fijo_inicio_id = $6,
           dia_horario_fijo_id = $7,
           sin_salon = $8
       WHERE id = $9
       RETURNING *`,
      [
        nextCursoId,
        payload.letra?.trim() ?? current.letra,
        resolveField('num_estudiantes_seccion', current.num_estudiantes_seccion),
        resolveField('salon_fijo_id', current.salon_fijo_id),
        resolveField('docente_fijo_id', current.docente_fijo_id),
        resolveField('periodo_fijo_inicio_id', current.periodo_fijo_inicio_id),
        resolveField('dia_horario_fijo_id', current.dia_horario_fijo_id),
        payload.sin_salon !== undefined ? toBool(payload.sin_salon) : current.sin_salon,
        id,
      ],
    );

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}

async function remove(id) {
  try {
    await getById(id);
    await db.query('DELETE FROM secciones WHERE id = $1', [id]);
    return { message: 'Sección eliminada correctamente.' };
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
  getByCursoId,
};
