
const db = require('../../db');


/**
 * Elimina todos los datos operativos.
 * Mantiene: dias, dias_horario, dias_horario_dia, configuracion_algoritmo.
 * Reinicia las secuencias de IDs de todas las tablas borradas.
 */
async function resetCompleto() {
  const tablas = [
    'horario_historial',
    'horario_detalle',
    'horarios',
    'seccion_laboratorio',
    'secciones',
    'docente_curso',
    'laboratorios',
    'cursos',
    'docentes',
    'salones',
    //'carreras',
    //'periodos',
  ];

  const resultado = {};

  for (const tabla of tablas) {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS total FROM ${tabla}`
    );
    const totalAntes = parseInt(rows[0].total);

    await db.query(`TRUNCATE TABLE ${tabla} RESTART IDENTITY CASCADE`);

    resultado[tabla] = { eliminados: totalAntes };
  }

  return {
    mensaje: 'Base de datos limpiada correctamente',
    tablas_limpiadas: resultado,
    tablas_conservadas: [
      'dias',
      'dias_horario',
      'dias_horario_dia',
      'configuracion_algoritmo',
    ],
  };
}


/**
 * Elimina solo los horarios generados y su historial.
 * Mantiene todos los datos de cursos, docentes, salones, etc.
 * Útil para regenerar el horario sin recargar los CSVs.
 */
async function resetHorarios() {
  const { rows: [{ total: totalHistorial }] } = await db.query(
    `SELECT COUNT(*) AS total FROM horario_historial`
  );
  const { rows: [{ total: totalDetalle }] } = await db.query(
    `SELECT COUNT(*) AS total FROM horario_detalle`
  );
  const { rows: [{ total: totalHorarios }] } = await db.query(
    `SELECT COUNT(*) AS total FROM horarios`
  );

  await db.query(`TRUNCATE TABLE horario_historial RESTART IDENTITY CASCADE`);
  await db.query(`TRUNCATE TABLE horario_detalle   RESTART IDENTITY CASCADE`);
  await db.query(`TRUNCATE TABLE horarios          RESTART IDENTITY CASCADE`);

  return {
    mensaje: 'Horarios eliminados correctamente',
    eliminados: {
      horario_historial: parseInt(totalHistorial),
      horario_detalle:   parseInt(totalDetalle),
      horarios:          parseInt(totalHorarios),
    },
  };
}


/**
 * Retorna el conteo de registros en cada tabla operativa.
 * Útil para verificar el estado antes y después de limpiar.
 */
async function getEstadoBD() {
  const tablas = [
    'carreras',
    'salones',
    'docentes',
    'cursos',
    'laboratorios',
    'secciones',
    'seccion_laboratorio',
    'docente_curso',
    'periodos',
    'horarios',
    'horario_detalle',
    'horario_historial',
  ];

  const estado = {};
  for (const tabla of tablas) {
    const { rows } = await db.query(`SELECT COUNT(*) AS total FROM ${tabla}`);
    estado[tabla] = parseInt(rows[0].total);
  }

  return estado;
}

module.exports = {
  resetCompleto,
  resetHorarios,
  getEstadoBD,
};