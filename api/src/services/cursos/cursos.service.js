const db = require('../../db');
const { ApiError, mapPgError } = require('../common/errors');

const TIPOS_PERMITIDOS = new Set(['obligatorio', 'optativo']);

function toBool(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return Boolean(value);
}

function normalizeTipo(tipo) {
  if (typeof tipo !== 'string') {
    return tipo;
  }
  return tipo.trim().toLowerCase();
}

function validateTipo(tipo) {
  const normalized = normalizeTipo(tipo);
  if (!TIPOS_PERMITIDOS.has(normalized)) {
    throw new ApiError(400, "El campo 'tipo' debe ser 'obligatorio' o 'optativo'.");
  }
  return normalized;
}

function ensureRequiredFields(payload) {
  if (!payload?.nombre || !payload?.codigo || payload?.semestre === undefined || payload?.tipo === undefined) {
    throw new ApiError(400, 'Debe enviar: nombre, codigo, semestre y tipo.');
  }
}

async function ensureCursoNameUnique(nombre, excludeId = null) {
  const params = [nombre.trim()];
  let queryText = 'SELECT id FROM cursos WHERE LOWER(nombre) = LOWER($1)';

  if (excludeId) {
    params.push(excludeId);
    queryText += ' AND id <> $2';
  }

  queryText += ' LIMIT 1';
  const { rowCount } = await db.query(queryText, params);

  if (rowCount > 0) {
    throw new ApiError(409, 'Ya existe un curso con ese nombre.');
  }
}

async function getAll() {
  const { rows } = await db.query('SELECT * FROM cursos ORDER BY id ASC');
  return rows;
}

async function getById(id) {
  const { rows } = await db.query('SELECT * FROM cursos WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new ApiError(404, 'Curso no encontrado.');
  }

  return rows[0];
}

async function create(payload) {
  try {
    ensureRequiredFields(payload);
    await ensureCursoNameUnique(payload.nombre);

    const tipo = validateTipo(payload.tipo);

    const { rows } = await db.query(
      `INSERT INTO cursos
        (nombre, codigo, carrera_id, semestre, tipo, num_estudiantes, puede_manana, puede_tarde, tiene_laboratorio, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        payload.nombre.trim(),
        payload.codigo.trim(),
        payload.carrera_id || null,
        payload.semestre,
        tipo,
        payload.num_estudiantes || null,
        toBool(payload.puede_manana, true),
        toBool(payload.puede_tarde, true),
        toBool(payload.tiene_laboratorio, false),
        toBool(payload.activo, true),
      ],
    );

    return getById(rows[0].id);
  } catch (error) {
    throw mapPgError(error);
  }
}



async function update(id, payload) {
  try {
    const current = await getById(id);

    if (payload.nombre && payload.nombre.trim().toLowerCase() !== current.nombre.trim().toLowerCase()) {
      await ensureCursoNameUnique(payload.nombre, id);
    }

    const nextTipo = payload.tipo !== undefined ? validateTipo(payload.tipo) : current.tipo;

    const updated = await db.query(
      `UPDATE cursos
       SET nombre = $1,
           codigo = $2,
           carrera_id = $3,
           semestre = $4,
           tipo = $5,
           num_estudiantes = $6,
           puede_manana = $7,
           puede_tarde = $8,
           tiene_laboratorio = $9,
           activo = $10
       WHERE id = $11
       RETURNING *`,
      [
        payload.nombre?.trim() ?? current.nombre,
        payload.codigo?.trim() ?? current.codigo,
        payload.carrera_id ?? current.carrera_id,
        payload.semestre ?? current.semestre,
        nextTipo,
        payload.num_estudiantes ?? current.num_estudiantes,
        payload.puede_manana !== undefined ? toBool(payload.puede_manana) : current.puede_manana,
        payload.puede_tarde !== undefined ? toBool(payload.puede_tarde) : current.puede_tarde,
        payload.tiene_laboratorio !== undefined ? toBool(payload.tiene_laboratorio) : current.tiene_laboratorio,
        payload.activo !== undefined ? toBool(payload.activo) : current.activo,
        id,
      ],
    );

    const curso = updated.rows[0];

    if (!curso.tiene_laboratorio) {
      const labForCurso = await db.query('SELECT id FROM laboratorios WHERE curso_id = $1', [id]);
      if (labForCurso.rowCount > 0) {
        throw new ApiError(409, 'El curso tiene laboratorio asociado. Elimine el laboratorio antes de desactivar tiene_laboratorio.');
      }
    }

    return getById(id);
  } catch (error) {
    throw mapPgError(error);
  }
}

async function remove(id) {
  try {
    await getById(id);
    await db.query('DELETE FROM cursos WHERE id = $1', [id]);
    return { message: 'Curso eliminado correctamente.' };
  } catch (error) {
    throw mapPgError(error);
  }
}

// ===== ACCIONES MASIVAS =====

async function desactivarSemestresPares() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cursosResult = await client.query(
      `UPDATE cursos
       SET activo = FALSE
       WHERE semestre % 2 = 0
       RETURNING id`
    );

    const cursoIds = cursosResult.rows.map((row) => row.id);

    let laboratoriosAfectados = 0;

    if (cursoIds.length > 0) {
      const labsResult = await client.query(
        `UPDATE laboratorios
         SET activo = FALSE
         WHERE curso_id = ANY($1::int[])`,
        [cursoIds]
      );

      laboratoriosAfectados = labsResult.rowCount;
    }

    await client.query('COMMIT');

    return {
      message: 'Cursos de semestre par y sus laboratorios fueron desactivados correctamente.',
      cursos_afectados: cursosResult.rowCount,
      laboratorios_afectados: laboratoriosAfectados,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

async function desactivarSemestresImpares() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cursosResult = await client.query(
      `UPDATE cursos
       SET activo = FALSE
       WHERE semestre % 2 <> 0
       RETURNING id`
    );

    const cursoIds = cursosResult.rows.map((row) => row.id);

    let laboratoriosAfectados = 0;

    if (cursoIds.length > 0) {
      const labsResult = await client.query(
        `UPDATE laboratorios
         SET activo = FALSE
         WHERE curso_id = ANY($1::int[])`,
        [cursoIds]
      );

      laboratoriosAfectados = labsResult.rowCount;
    }

    await client.query('COMMIT');

    return {
      message: 'Cursos de semestre impar y sus laboratorios fueron desactivados correctamente.',
      cursos_afectados: cursosResult.rowCount,
      laboratorios_afectados: laboratoriosAfectados,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

async function desactivarTodos() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cursosResult = await client.query(
      `UPDATE cursos
       SET activo = FALSE
       RETURNING id`
    );

    const labsResult = await client.query(
      `UPDATE laboratorios
       SET activo = FALSE`
    );

    await client.query('COMMIT');

    return {
      message: 'Todos los cursos y laboratorios fueron desactivados correctamente.',
      cursos_afectados: cursosResult.rowCount,
      laboratorios_afectados: labsResult.rowCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

async function activarTodos() {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const cursosResult = await client.query(
      `UPDATE cursos
       SET activo = TRUE
       RETURNING id`
    );

    const labsResult = await client.query(
      `UPDATE laboratorios
       SET activo = TRUE`
    );

    await client.query('COMMIT');

    return {
      message: 'Todos los cursos y laboratorios fueron activados correctamente.',
      cursos_afectados: cursosResult.rowCount,
      laboratorios_afectados: labsResult.rowCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw mapPgError(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  desactivarSemestresPares,
  desactivarSemestresImpares,
  desactivarTodos,
  activarTodos,
};
