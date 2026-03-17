const db = require('../../db');
const { ApiError, mapPgError } = require('../common/errors');

async function ensureSeccionExiste(seccionId) {
  const { rowCount } = await db.query('SELECT id FROM secciones WHERE id = $1', [seccionId]);
  if (rowCount === 0) {
    throw new ApiError(404, 'La sección indicada no existe.');
  }
}

async function ensureLaboratorioExiste(laboratorioId) {
  const { rowCount } = await db.query('SELECT id FROM laboratorios WHERE id = $1', [laboratorioId]);
  if (rowCount === 0) {
    throw new ApiError(404, 'El laboratorio indicado no existe.');
  }
}

async function getAll() {
  const { rows } = await db.query('SELECT * FROM seccion_laboratorio ORDER BY id ASC');
  return rows;
}

async function getById(id) {
  const { rows } = await db.query('SELECT * FROM seccion_laboratorio WHERE id = $1', [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Sección de laboratorio no encontrada.');
  }
  return rows[0];
}

async function create(payload) {
  try {
    if (!payload?.seccion_id || !payload?.laboratorio_id) {
      throw new ApiError(400, 'Debe enviar seccion_id y laboratorio_id.');
    }

    await ensureSeccionExiste(payload.seccion_id);
    await ensureLaboratorioExiste(payload.laboratorio_id);

    const { rows } = await db.query(
      `INSERT INTO seccion_laboratorio
        (seccion_id, laboratorio_id, salon_fijo_id, docente_fijo_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        payload.seccion_id,
        payload.laboratorio_id,
        payload.salon_fijo_id || null,
        payload.docente_fijo_id || null,
      ],
    );

    return rows[0];
  } catch (error) {
    throw mapPgError(error);
  }
}
/*
create secciccion laboratiro
{
  "seccion_id": 1,
  "laboratorio_id": 1,
  "salon_fijo_id": 1,
  "docente_fijo_id": 1
}

*/

async function update(id, payload) {
  try {
    const current = await getById(id);
    const resolveField = (key, currentValue) => (payload[key] !== undefined ? payload[key] : currentValue);

    const nextSeccion = payload.seccion_id ?? current.seccion_id;
    const nextLaboratorio = payload.laboratorio_id ?? current.laboratorio_id;

    if (nextSeccion !== current.seccion_id) {
      await ensureSeccionExiste(nextSeccion);
    }

    if (nextLaboratorio !== current.laboratorio_id) {
      await ensureLaboratorioExiste(nextLaboratorio);
    }

    const { rows } = await db.query(
      `UPDATE seccion_laboratorio
       SET seccion_id = $1,
           laboratorio_id = $2,
           salon_fijo_id = $3,
           docente_fijo_id = $4
       WHERE id = $5
       RETURNING *`,
      [
        nextSeccion,
        nextLaboratorio,
        resolveField('salon_fijo_id', current.salon_fijo_id),
        resolveField('docente_fijo_id', current.docente_fijo_id),
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
    await db.query('DELETE FROM seccion_laboratorio WHERE id = $1', [id]);
    return { message: 'Sección de laboratorio eliminada correctamente.' };
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
