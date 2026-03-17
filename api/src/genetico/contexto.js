// src/genetico/contexto.js
const db = require('../db');

async function cargarContexto() {
  const [periodos, salones, docentes, secciones, labs, relacionesDC, configResult] =
    await Promise.all([
      db.query(`SELECT id, numero, hora_inicio, hora_fin, es_manana, es_tarde
                FROM periodos ORDER BY numero`),

      db.query(`SELECT id, nombre, capacidad, es_laboratorio, lab_habilitado_teorico,
                       disponible_manana, disponible_tarde
                FROM salones WHERE activo = true`),

      db.query(`SELECT id, nombre, hora_entrada, hora_salida
                FROM docentes WHERE activo = true`),

      db.query(`
        SELECT s.id, s.curso_id, s.letra, s.num_estudiantes_seccion AS num_estudiantes,
               s.salon_fijo_id, s.docente_fijo_id, s.periodo_fijo_inicio_id,
               s.dia_horario_fijo_id, s.sin_salon,
               c.semestre, c.carrera_id, c.tipo,
               c.puede_manana, c.puede_tarde, c.tiene_laboratorio
        FROM secciones s
        JOIN cursos c ON c.id = s.curso_id
        WHERE c.activo = true
        ORDER BY s.id
      `),

      db.query(`
        SELECT sl.id, sl.seccion_id, sl.laboratorio_id,
               sl.salon_fijo_id, sl.docente_fijo_id,
               l.num_periodos, l.puede_manana, l.puede_tarde,
               s.num_estudiantes_seccion AS num_estudiantes,
               s.periodo_fijo_inicio_id, s.dia_horario_fijo_id,
               c.semestre, c.carrera_id, c.id AS curso_id
        FROM seccion_laboratorio sl
        JOIN laboratorios l ON l.id  = sl.laboratorio_id
        JOIN secciones    s ON s.id  = sl.seccion_id
        JOIN cursos       c ON c.id  = s.curso_id
        WHERE l.activo = true
        ORDER BY sl.id
      `),

      db.query(`
        SELECT dc.curso_id, dc.docente_id, dc.puede_laboratorio
        FROM docente_curso dc
        JOIN docentes d ON d.id = dc.docente_id
        WHERE d.activo = true
      `),

      db.query(`SELECT * FROM configuracion_algoritmo ORDER BY id LIMIT 1`),
    ]);

  // Construir mapa de docentes por curso
  const docentesCurso    = {};
  const docentesCursoLab = {};
  for (const rel of relacionesDC.rows) {
    if (!docentesCurso[rel.curso_id])    docentesCurso[rel.curso_id]    = [];
    if (!docentesCursoLab[rel.curso_id]) docentesCursoLab[rel.curso_id] = [];
    docentesCurso[rel.curso_id].push(rel.docente_id);
    if (rel.puede_laboratorio) docentesCursoLab[rel.curso_id].push(rel.docente_id);
  }

  return {
    periodos:         periodos.rows,
    salones:          salones.rows,
    docentes:         docentes.rows,
    secciones:        secciones.rows,
    labs:             labs.rows,
    docentesCurso,
    docentesCursoLab,
    config:           configResult.rows[0],
  };
}

module.exports = { cargarContexto };