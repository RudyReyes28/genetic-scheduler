
const db                 = require('../../db');
const { evaluarAptitud } = require('../../genetico/aptitud');
const { cargarContexto } = require('../../genetico/contexto');

// ------------ Listar --------------------

async function listar() {
  const { rows } = await db.query(`
    SELECT id, nombre, fecha_generacion, aptitud_final,
           generaciones_ejecutadas, tiempo_ejecucion_ms,
           metodo_seleccion, metodo_cruce, metodo_mutacion, es_activo
    FROM horarios
    ORDER BY fecha_generacion DESC
  `);
  return rows;
}

// ----------- Obtener detalle --------------------

async function obtener(id, filtros = {}) {
  const { rows: [horario] } = await db.query(
    `SELECT * FROM horarios WHERE id = $1`, [id]
  );

  if (!horario) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }

  const condiciones = ['hd.horario_id = $1'];
  const valores     = [id];
  let   idx         = 2;

  if (filtros.tipo === 'cursos')       condiciones.push('hd.seccion_id IS NOT NULL');
  if (filtros.tipo === 'laboratorios') condiciones.push('hd.seccion_lab_id IS NOT NULL');
  if (filtros.carrera_id) { condiciones.push(`c.carrera_id = $${idx++}`); valores.push(filtros.carrera_id); }
  if (filtros.semestre)   { condiciones.push(`c.semestre = $${idx++}`);   valores.push(filtros.semestre); }

  const { rows: detalles } = await db.query(`
    SELECT
      hd.id              AS detalle_id,
      hd.seccion_id,
      hd.seccion_lab_id,
      hd.salon_id,
      hd.docente_id,
      hd.dia_horario_id,
      hd.periodo_inicio_id,
      hd.periodo_fin_id,
      hd.modificado_manual,
      c.id               AS curso_id,
      c.nombre           AS curso_nombre,
      c.codigo           AS curso_codigo,
      c.semestre,
      c.tipo             AS curso_tipo,
      c.carrera_id,
      ca.nombre          AS carrera_nombre,
      s.letra            AS seccion_letra,
      sa.nombre          AS salon_nombre,
      sa.es_laboratorio  AS salon_es_laboratorio,
      d.nombre           AS docente_nombre,
      p_ini.hora_inicio,
      p_fin.hora_fin,
      p_ini.es_manana,
      p_ini.es_tarde,
      dh.nombre          AS dias_nombre,
      dh.es_laboratorio  AS es_lab_dia,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN true ELSE false END AS es_laboratorio
    FROM horario_detalle hd
    LEFT JOIN secciones s            ON s.id   = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl ON sl.id  = hd.seccion_lab_id
    LEFT JOIN cursos c               ON c.id   = COALESCE(s.curso_id, (
      SELECT s2.curso_id FROM secciones s2
      JOIN seccion_laboratorio sl2 ON sl2.seccion_id = s2.id
      WHERE sl2.id = hd.seccion_lab_id LIMIT 1
    ))
    LEFT JOIN carreras ca            ON ca.id  = c.carrera_id
    LEFT JOIN salones sa             ON sa.id  = hd.salon_id
    LEFT JOIN docentes d             ON d.id   = hd.docente_id
    LEFT JOIN periodos p_ini         ON p_ini.id = hd.periodo_inicio_id
    LEFT JOIN periodos p_fin         ON p_fin.id = hd.periodo_fin_id
    LEFT JOIN dias_horario dh        ON dh.id  = hd.dia_horario_id
    WHERE ${condiciones.join(' AND ')}
    ORDER BY hd.dia_horario_id, hd.periodo_inicio_id, hd.salon_id
  `, valores);

  return { horario, detalles };
}

//  --------- Obtener conflictos --------------------

async function getConflictos(id) {
  const individuo = await reconstruirIndividuo(id);
  if (!individuo) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }

  const ctx = await cargarContexto();
  const { aptitud, detalle } = evaluarAptitud(individuo, ctx, true);

  return {
    aptitud,
    total_conflictos:   detalle.filter(d => d.penalizacion).length,
    total_penalizacion: detalle.filter(d => d.penalizacion).reduce((s, d) => s + d.penalizacion, 0),
    total_bonos:        detalle.filter(d => d.bono).reduce((s, d) => s + d.bono, 0),
    conflictos:         detalle.filter(d => d.penalizacion),
    bonos:              detalle.filter(d => d.bono),
  };
}

//  --------- Obtener historial de aptitud --------------------

async function getReporte(id) {
  const { rows: [horario] } = await db.query(
    `SELECT * FROM horarios WHERE id = $1`, [id]
  );
  if (!horario) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }

  const individuo = await reconstruirIndividuo(id);
  const ctx       = await cargarContexto();
  const { aptitud, detalle } = evaluarAptitud(individuo, ctx, true);

  const conflictosList  = detalle.filter(d => d.penalizacion);
  const conflictosPorTipo = conflictosList.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] ?? 0) + 1;
    return acc;
  }, {});

  const { rows: historialRows } = await db.query(`
    SELECT generacion, mejor_aptitud, conflictos
    FROM horario_historial
    WHERE horario_id = $1
    ORDER BY generacion ASC
  `, [id]);

  const memoria = process.memoryUsage();

  return {
    horario_id:              horario.id,
    nombre:                  horario.nombre,
    fecha_generacion:        horario.fecha_generacion,
    metodo_seleccion:        horario.metodo_seleccion,
    metodo_cruce:            horario.metodo_cruce,
    metodo_mutacion:         horario.metodo_mutacion,
    aptitud_final:           aptitud,
    generaciones_ejecutadas: horario.generaciones_ejecutadas,
    tiempo_ejecucion_ms:     horario.tiempo_ejecucion_ms,
    tiempo_ejecucion_seg:    (horario.tiempo_ejecucion_ms / 1000).toFixed(2),
    total_conflictos:        conflictosList.length,
    conflictos_por_tipo:     conflictosPorTipo,
    lista_conflictos:        conflictosList,
    porcentaje_continuidad:  calcularPorcentajeContinuidad(individuo.genes),
    memoria_mb: {
      rss:        (memoria.rss       / 1024 / 1024).toFixed(2),
      heap_total: (memoria.heapTotal / 1024 / 1024).toFixed(2),
      heap_usado: (memoria.heapUsed  / 1024 / 1024).toFixed(2),
    },
    historial: historialRows,
  };
}

//  --------- Exportar CSV --------------------

async function exportarCSV(id) {
  const { rows: detalles } = await db.query(`
    SELECT
      p_ini.hora_inicio,
      p_fin.hora_fin,
      sa.nombre          AS salon,
      c.nombre           AS curso,
      c.codigo,
      c.semestre,
      ca.nombre          AS carrera,
      s.letra            AS seccion,
      d.nombre           AS docente,
      dh.nombre          AS dias,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN 'Laboratorio' ELSE 'Teórico' END AS tipo
    FROM horario_detalle hd
    LEFT JOIN secciones s            ON s.id  = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl ON sl.id = hd.seccion_lab_id
    LEFT JOIN cursos c               ON c.id  = COALESCE(s.curso_id, (
      SELECT s2.curso_id FROM secciones s2
      JOIN seccion_laboratorio sl2 ON sl2.seccion_id = s2.id
      WHERE sl2.id = hd.seccion_lab_id LIMIT 1
    ))
    LEFT JOIN carreras ca            ON ca.id = c.carrera_id
    LEFT JOIN salones sa             ON sa.id = hd.salon_id
    LEFT JOIN docentes d             ON d.id  = hd.docente_id
    LEFT JOIN periodos p_ini         ON p_ini.id = hd.periodo_inicio_id
    LEFT JOIN periodos p_fin         ON p_fin.id = hd.periodo_fin_id
    LEFT JOIN dias_horario dh        ON dh.id = hd.dia_horario_id
    WHERE hd.horario_id = $1
    ORDER BY dh.id, p_ini.hora_inicio, sa.nombre
  `, [id]);

  const cabecera = 'Hora Inicio,Hora Fin,Salón,Curso,Código,Tipo,Semestre,Carrera,Sección,Docente,Días\n';
  const filas    = detalles.map(r =>
    [
      r.hora_inicio, r.hora_fin,
      r.salon   ?? '',
      `"${r.curso   ?? ''}"`,
      r.codigo  ?? '',
      r.tipo,
      r.semestre,
      `"${r.carrera ?? ''}"`,
      r.seccion ?? '',
      `"${r.docente ?? ''}"`,
      `"${r.dias    ?? ''}"`,
    ].join(',')
  ).join('\n');

  return '\uFEFF' + cabecera + filas; // BOM para Excel
}

//  --------- Editar detalle manual --------------------

async function editarDetalle(horarioId, detalleId, cambios) {
  const { rows: [detalle] } = await db.query(`
    SELECT * FROM horario_detalle WHERE id = $1 AND horario_id = $2
  `, [detalleId, horarioId]);

  if (!detalle) {
    const err = new Error('Detalle no encontrado');
    err.status = 404;
    throw err;
  }

  await db.query(`
    UPDATE horario_detalle SET
      salon_id          = COALESCE($1, salon_id),
      docente_id        = COALESCE($2, docente_id),
      periodo_inicio_id = COALESCE($3, periodo_inicio_id),
      periodo_fin_id    = COALESCE($4, periodo_fin_id),
      dia_horario_id    = COALESCE($5, dia_horario_id),
      modificado_manual = true
    WHERE id = $6
  `, [
    cambios.salon_id, cambios.docente_id,
    cambios.periodo_inicio_id, cambios.periodo_fin_id,
    cambios.dia_horario_id, detalleId,
  ]);

  const individuo = await reconstruirIndividuo(horarioId);
  const ctx       = await cargarContexto();
  const { aptitud, detalle: detalleAptitud } = evaluarAptitud(individuo, ctx, true);

  return {
    mensaje:       'Cambio guardado correctamente',
    advertencias:  detalleAptitud.filter(d => d.penalizacion),
    nueva_aptitud: aptitud,
  };
}

//  --------- Activar --------------------

async function activar(id) {
  await db.query(`UPDATE horarios SET es_activo = false`);
  await db.query(`UPDATE horarios SET es_activo = true WHERE id = $1`, [id]);
  return { mensaje: `Horario ${id} activado correctamente` };
}

//  --------- Eliminar --------------------

async function eliminar(id) {
  await db.query(`DELETE FROM horarios WHERE id = $1`, [id]);
  return { mensaje: `Horario ${id} eliminado correctamente` };
}

//  --------- Helpers --------------------

async function reconstruirIndividuo(horarioId) {
  const { rows } = await db.query(`
    SELECT
      hd.seccion_id, hd.seccion_lab_id,
      hd.salon_id, hd.docente_id, hd.dia_horario_id,
      hd.periodo_inicio_id, hd.periodo_fin_id,
      c.semestre, c.carrera_id, c.tipo,
      c.puede_manana, c.puede_tarde,
      s.num_estudiantes_seccion AS num_estudiantes,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN true ELSE false END AS es_laboratorio,
      COALESCE(s.sin_salon, false)                                     AS sin_salon,
      COALESCE(s.curso_id, (
        SELECT s2.curso_id FROM secciones s2
        JOIN seccion_laboratorio sl2 ON sl2.seccion_id = s2.id
        WHERE sl2.id = hd.seccion_lab_id LIMIT 1
      )) AS curso_id
    FROM horario_detalle hd
    LEFT JOIN secciones s            ON s.id  = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl ON sl.id = hd.seccion_lab_id
    LEFT JOIN cursos c               ON c.id  = COALESCE(s.curso_id, (
      SELECT s2.curso_id FROM secciones s2
      JOIN seccion_laboratorio sl2 ON sl2.seccion_id = s2.id
      WHERE sl2.id = hd.seccion_lab_id LIMIT 1
    ))
    WHERE hd.horario_id = $1
  `, [horarioId]);

  if (rows.length === 0) return null;

  return {
    genes: rows.map(r => ({
      seccion_id:        r.seccion_id,
      seccion_lab_id:    r.seccion_lab_id,
      salon_id:          r.salon_id,
      docente_id:        r.docente_id,
      periodo_inicio_id: r.periodo_inicio_id,
      periodo_fin_id:    r.periodo_fin_id,
      dia_horario_id:    r.dia_horario_id,
      es_laboratorio:    r.es_laboratorio,
      sin_salon:         r.sin_salon,
      semestre:          r.semestre,
      carrera_id:        r.carrera_id,
      tipo:              r.tipo,
      puede_manana:      r.puede_manana,
      puede_tarde:       r.puede_tarde,
      num_estudiantes:   r.num_estudiantes,
      curso_id:          r.curso_id,
    })),
    aptitud: null,
  };
}

function calcularPorcentajeContinuidad(genes) {
  const grupos = {};
  for (const gen of genes) {
    if (gen.tipo !== 'obligatorio' || !gen.semestre || !gen.carrera_id) continue;
    const key = `${gen.semestre}-${gen.carrera_id}-${gen.dia_horario_id}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(gen);
  }

  let totalPares = 0;
  let paresConsecutivos = 0;

  for (const grupo of Object.values(grupos)) {
    if (grupo.length < 2) continue;
    grupo.sort((a, b) => a.periodo_inicio_id - b.periodo_inicio_id);
    for (let i = 0; i < grupo.length - 1; i++) {
      totalPares++;
      if (grupo[i].periodo_fin_id + 1 === grupo[i + 1].periodo_inicio_id) {
        paresConsecutivos++;
      }
    }
  }

  if (totalPares === 0) return 100;
  return ((paresConsecutivos / totalPares) * 100).toFixed(1);
}

module.exports = {
  listar,
  obtener,
  getConflictos,
  getReporte,
  exportarCSV,
  editarDetalle,
  activar,
  eliminar,
};