const db = require('../../db');
const { parseCsvBuffer } = require('../../utils/csv');

const normalizeBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;

  const str = String(value).toLowerCase().trim();
  return ['true', '1', 'si', 'sí', 'yes'].includes(str);
};

const isValidTime = (value) => {
  if (!value) return false;

  const time = String(value).trim();
  const regex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
  return regex.test(time);
};

const normalizeTime = (value) => {
  const time = String(value).trim();
  return time.length === 5 ? `${time}:00` : time;
};

const importarDocentes = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const nombre = row.nombre?.trim();
    const registro_personal = row.registro_personal?.trim();
    const hora_entrada_raw = row.hora_entrada?.trim();
    const hora_salida_raw = row.hora_salida?.trim();

    if (!nombre || !registro_personal || !hora_entrada_raw || !hora_salida_raw) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: nombre, registro_personal, hora_entrada, hora_salida',
      });
      continue;
    }

    if (!isValidTime(hora_entrada_raw) || !isValidTime(hora_salida_raw)) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'hora_entrada y hora_salida deben tener formato HH:mm o HH:mm:ss',
      });
      continue;
    }

    const hora_entrada = normalizeTime(hora_entrada_raw);
    const hora_salida = normalizeTime(hora_salida_raw);

    try {
      const existente = await db.query(
        `SELECT id FROM docentes WHERE registro_personal = $1`,
        [registro_personal]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE docentes
           SET nombre = $1,
               hora_entrada = $2,
               hora_salida = $3
           WHERE registro_personal = $4`,
          [nombre, hora_entrada, hora_salida, registro_personal]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Docente con registro ${registro_personal} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO docentes (nombre, registro_personal, hora_entrada, hora_salida)
           VALUES ($1, $2, $3, $4)`,
          [nombre, registro_personal, hora_entrada, hora_salida]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Docente ${registro_personal} insertado correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarCursos = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const nombre = row.nombre?.trim();
    const codigo = row.codigo?.trim();
    const codigo_carrera = row.codigo_carrera?.trim();
    const semestre = row.semestre ? Number(row.semestre) : null;
    const tipo = row.tipo?.trim()?.toLowerCase();
    const num_estudiantes =
      row.num_estudiantes !== undefined && row.num_estudiantes !== ''
        ? Number(row.num_estudiantes)
        : null;

    if (!nombre || !codigo || !codigo_carrera || !semestre || !tipo) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: nombre, codigo, codigo_carrera, semestre, tipo',
      });
      continue;
    }

    if (!['obligatorio', 'optativo'].includes(tipo)) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'El campo tipo debe ser obligatorio u optativo',
      });
      continue;
    }

    try {
      const carrera = await db.query(
        `SELECT id FROM carreras WHERE codigo = $1`,
        [codigo_carrera]
      );

      if (carrera.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe la carrera con código ${codigo_carrera}`,
        });
        continue;
      }

      const carrera_id = carrera.rows[0].id;

      const existente = await db.query(
        `SELECT id FROM cursos WHERE codigo = $1`,
        [codigo]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE cursos
           SET nombre = $1,
               carrera_id = $2,
               semestre = $3,
               tipo = $4,
               num_estudiantes = $5
           WHERE codigo = $6`,
          [nombre, carrera_id, semestre, tipo, num_estudiantes, codigo]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Curso con código ${codigo} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO cursos
           (nombre, codigo, carrera_id, semestre, tipo, num_estudiantes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nombre, codigo, carrera_id, semestre, tipo, num_estudiantes]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Curso ${codigo} insertado correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarDocenteCurso = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const registro_personal = row.registro_personal?.trim();
    const codigo_curso = row.codigo_curso?.trim();
    const puede_laboratorio = normalizeBoolean(row.puede_laboratorio, false);

    if (!registro_personal || !codigo_curso) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: registro_personal, codigo_curso',
      });
      continue;
    }

    try {
      const docenteResult = await db.query(
        `SELECT id FROM docentes WHERE registro_personal = $1`,
        [registro_personal]
      );

      if (docenteResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe docente con registro ${registro_personal}`,
        });
        continue;
      }

      const cursoResult = await db.query(
        `SELECT id FROM cursos WHERE codigo = $1`,
        [codigo_curso]
      );

      if (cursoResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe curso con código ${codigo_curso}`,
        });
        continue;
      }

      const docente_id = docenteResult.rows[0].id;
      const curso_id = cursoResult.rows[0].id;

      const existente = await db.query(
        `SELECT id FROM docente_curso
         WHERE docente_id = $1 AND curso_id = $2`,
        [docente_id, curso_id]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE docente_curso
           SET puede_laboratorio = $1
           WHERE docente_id = $2 AND curso_id = $3`,
          [puede_laboratorio, docente_id, curso_id]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Relación ${registro_personal} - ${codigo_curso} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO docente_curso (docente_id, curso_id, puede_laboratorio)
           VALUES ($1, $2, $3)`,
          [docente_id, curso_id, puede_laboratorio]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Relación ${registro_personal} - ${codigo_curso} insertada`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarSalones = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const nombre = row.nombre?.trim();
    const capacidad =
      row.capacidad !== undefined && row.capacidad !== ''
        ? Number(row.capacidad)
        : null;

    const es_laboratorio = normalizeBoolean(row.es_laboratorio, false);
    const lab_habilitado_teorico = normalizeBoolean(row.lab_habilitado_teorico, false);
    const disponible_manana = normalizeBoolean(row.disponible_manana, true);
    const disponible_tarde = normalizeBoolean(row.disponible_tarde, true);
    const activo = normalizeBoolean(row.activo, true);

    if (!nombre) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Falta la columna requerida: nombre',
      });
      continue;
    }

    if (capacidad !== null && Number.isNaN(capacidad)) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'capacidad debe ser numérica',
      });
      continue;
    }

    try {
      const existente = await db.query(
        `SELECT id FROM salones WHERE nombre = $1`,
        [nombre]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE salones
           SET capacidad = $1,
               es_laboratorio = $2,
               lab_habilitado_teorico = $3,
               disponible_manana = $4,
               disponible_tarde = $5,
               activo = $6
           WHERE nombre = $7`,
          [
            capacidad,
            es_laboratorio,
            lab_habilitado_teorico,
            disponible_manana,
            disponible_tarde,
            activo,
            nombre,
          ]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Salón con nombre ${nombre} ya existía`,
        });
      } else {
        await db.query(
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
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            nombre,
            capacidad,
            es_laboratorio,
            lab_habilitado_teorico,
            disponible_manana,
            disponible_tarde,
            activo,
          ]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Salón ${nombre} insertado correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarLaboratorios = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const codigo_curso = row.codigo_curso?.trim();
    const nombre = row.nombre?.trim();
    const num_periodos =
      row.num_periodos !== undefined && row.num_periodos !== ''
        ? Number(row.num_periodos)
        : 3;

    const puede_manana = normalizeBoolean(row.puede_manana, true);
    const puede_tarde = normalizeBoolean(row.puede_tarde, true);
    const activo = normalizeBoolean(row.activo, true);

    if (!codigo_curso || !nombre) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: codigo_curso, nombre',
      });
      continue;
    }

    if (Number.isNaN(num_periodos) || num_periodos <= 0) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'num_periodos debe ser un número mayor que 0',
      });
      continue;
    }

    try {
      const cursoResult = await db.query(
        `SELECT id,nombre FROM cursos WHERE codigo = $1`,
        [codigo_curso]
      );

      if (cursoResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe curso con código ${codigo_curso}`,
        });
        continue;
      }

      const curso_id = cursoResult.rows[0].id;

      const existente = await db.query(
        `SELECT id FROM laboratorios WHERE curso_id = $1`,
        [curso_id]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE laboratorios
           SET nombre = $1,
               num_periodos = $2,
               puede_manana = $3,
               puede_tarde = $4,
               activo = $5
           WHERE curso_id = $6`,
          [nombre, num_periodos, puede_manana, puede_tarde, activo, curso_id]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Laboratorio para curso ${cursoResult.rows[0].nombre} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO laboratorios
           (curso_id, nombre, num_periodos, puede_manana, puede_tarde, activo)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [curso_id, nombre, num_periodos, puede_manana, puede_tarde, activo]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Laboratorio para curso ${cursoResult.rows[0].nombre} insertado correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarSecciones = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const codigo_curso = row.codigo_curso?.trim();
    const letra = row.letra?.trim();
    const num_estudiantes_seccion =
      row.num_estudiantes_seccion !== undefined && row.num_estudiantes_seccion !== ''
        ? Number(row.num_estudiantes_seccion)
        : null;

    const sin_salon = normalizeBoolean(row.sin_salon, false);

    if (!codigo_curso || !letra) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: codigo_curso, letra',
      });
      continue;
    }

    if (
      num_estudiantes_seccion !== null &&
      (Number.isNaN(num_estudiantes_seccion) || num_estudiantes_seccion < 0)
    ) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'num_estudiantes_seccion debe ser un número válido',
      });
      continue;
    }

    try {
      const cursoResult = await db.query(
        `SELECT id FROM cursos WHERE codigo = $1`,
        [codigo_curso]
      );

      if (cursoResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe curso con código ${codigo_curso}`,
        });
        continue;
      }

      const curso_id = cursoResult.rows[0].id;

      const existente = await db.query(
        `SELECT id FROM secciones
         WHERE curso_id = $1 AND letra = $2`,
        [curso_id, letra]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE secciones
           SET num_estudiantes_seccion = $1,
               sin_salon = $2
           WHERE curso_id = $3 AND letra = $4`,
          [num_estudiantes_seccion, sin_salon, curso_id, letra]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Sección ${codigo_curso}-${letra} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO secciones
           (curso_id, letra, num_estudiantes_seccion, sin_salon)
           VALUES ($1, $2, $3, $4)`,
          [curso_id, letra, num_estudiantes_seccion, sin_salon]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Sección ${codigo_curso}-${letra} insertada correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

const importarSeccionLaboratorio = async (fileBuffer) => {
  const rows = parseCsvBuffer(fileBuffer);

  let insertados = 0;
  let actualizados = 0;
  let omitidos = 0;
  const detalles = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fila = i + 2;

    const codigo_curso = row.codigo_curso?.trim();
    const letra = row.letra?.trim();
    const salon_nombre = row.salon_nombre?.trim();
    const registro_personal = row.registro_personal?.trim();

    if (!codigo_curso || !letra) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: 'Faltan columnas requeridas: codigo_curso, letra',
      });
      continue;
    }

    try {
      // 1) Buscar curso
      const cursoResult = await db.query(
        `SELECT id FROM cursos WHERE codigo = $1`,
        [codigo_curso]
      );

      if (cursoResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe curso con código ${codigo_curso}`,
        });
        continue;
      }

      const curso_id = cursoResult.rows[0].id;

      // 2) Buscar sección por curso_id + letra
      const seccionResult = await db.query(
        `SELECT id FROM secciones
         WHERE curso_id = $1 AND letra = $2`,
        [curso_id, letra]
      );

      if (seccionResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe la sección ${codigo_curso}-${letra}`,
        });
        continue;
      }

      const seccion_id = seccionResult.rows[0].id;

      // 3) Buscar laboratorio por curso_id
      const laboratorioResult = await db.query(
        `SELECT id FROM laboratorios WHERE curso_id = $1`,
        [curso_id]
      );

      if (laboratorioResult.rows.length === 0) {
        omitidos++;
        detalles.push({
          fila,
          estado: 'omitido',
          motivo: `No existe laboratorio asociado al curso ${codigo_curso}`,
        });
        continue;
      }

      const laboratorio_id = laboratorioResult.rows[0].id;

      // 4) Buscar salón si viene en CSV (opcional)
      let salon_fijo_id = null;
      if (salon_nombre) {
        const salonResult = await db.query(
          `SELECT id FROM salones WHERE nombre = $1`,
          [salon_nombre]
        );

        if (salonResult.rows.length === 0) {
          omitidos++;
          detalles.push({
            fila,
            estado: 'omitido',
            motivo: `No existe salón con nombre ${salon_nombre}`,
          });
          continue;
        }

        salon_fijo_id = salonResult.rows[0].id;
      }

      // 5) Buscar docente si viene en CSV (opcional)
      let docente_fijo_id = null;
      if (registro_personal) {
        const docenteResult = await db.query(
          `SELECT id FROM docentes WHERE registro_personal = $1`,
          [registro_personal]
        );

        if (docenteResult.rows.length === 0) {
          omitidos++;
          detalles.push({
            fila,
            estado: 'omitido',
            motivo: `No existe docente con registro ${registro_personal}`,
          });
          continue;
        }

        docente_fijo_id = docenteResult.rows[0].id;
      }

      // 6) Upsert por seccion_id
      const existente = await db.query(
        `SELECT id FROM seccion_laboratorio WHERE seccion_id = $1`,
        [seccion_id]
      );

      if (existente.rows.length > 0) {
        await db.query(
          `UPDATE seccion_laboratorio
           SET laboratorio_id = $1,
               salon_fijo_id = $2,
               docente_fijo_id = $3
           WHERE seccion_id = $4`,
          [laboratorio_id, salon_fijo_id, docente_fijo_id, seccion_id]
        );

        actualizados++;
        detalles.push({
          fila,
          estado: 'actualizado',
          motivo: `Sección laboratorio ${codigo_curso}-${letra} ya existía`,
        });
      } else {
        await db.query(
          `INSERT INTO seccion_laboratorio
           (seccion_id, laboratorio_id, salon_fijo_id, docente_fijo_id)
           VALUES ($1, $2, $3, $4)`,
          [seccion_id, laboratorio_id, salon_fijo_id, docente_fijo_id]
        );

        insertados++;
        detalles.push({
          fila,
          estado: 'insertado',
          motivo: `Sección laboratorio ${codigo_curso}-${letra} insertada correctamente`,
        });
      }
    } catch (error) {
      omitidos++;
      detalles.push({
        fila,
        estado: 'omitido',
        motivo: error.message,
      });
    }
  }

  return {
    total_filas: rows.length,
    insertados,
    actualizados,
    omitidos,
    detalles,
  };
};

module.exports = {
  importarDocentes,
  importarCursos,
  importarDocenteCurso,
  importarSalones,
  importarLaboratorios,
  importarSecciones,
  importarSeccionLaboratorio,
};