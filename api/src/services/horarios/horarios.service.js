const db                 = require('../../db');
const { evaluarAptitud } = require('../../genetico/aptitud');
const { cargarContexto } = require('../../genetico/contexto');
const { GEN }            = require('../../genetico/genoma');
const pdfmake = require('pdfmake');
const path = require('path');
// ----------------- LISTAR --------------------
 
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
 
// ----------- OBTENER DETALLES --------------
 
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
      hd.id                AS detalle_id,
      hd.seccion_id,
      hd.seccion_lab_id,
      hd.salon_id,
      hd.docente_id,
      hd.dia_horario_id,
      hd.periodo_inicio_id,
      hd.periodo_fin_id,
      hd.dia_especifico,
      hd.modificado_manual,
      c.id                 AS curso_id,
      c.nombre             AS curso_nombre,
      c.codigo             AS curso_codigo,
      c.semestre,
      c.tipo               AS curso_tipo,
      c.carrera_id,
      ca.nombre            AS carrera_nombre,
      COALESCE(s.letra, s_lab.letra)  AS seccion_letra,
      sa.nombre            AS salon_nombre,
      sa.es_laboratorio    AS salon_es_laboratorio,
      d.nombre             AS docente_nombre,
      p_ini.hora_inicio,
      p_fin.hora_fin,
      p_ini.es_manana,
      p_ini.es_tarde,
      dh.nombre            AS dias_nombre,
      COALESCE(hd.dia_especifico, dh.nombre) AS dia_display,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN true ELSE false END AS es_laboratorio
    FROM horario_detalle hd
    LEFT JOIN secciones s              ON s.id   = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl   ON sl.id  = hd.seccion_lab_id
    LEFT JOIN secciones s_lab          ON s_lab.id = sl.seccion_id
    LEFT JOIN cursos c                 ON c.id   = COALESCE(s.curso_id, s_lab.curso_id)
    LEFT JOIN carreras ca              ON ca.id  = c.carrera_id
    LEFT JOIN salones sa               ON sa.id  = hd.salon_id
    LEFT JOIN docentes d               ON d.id   = hd.docente_id
    LEFT JOIN periodos p_ini           ON p_ini.id = hd.periodo_inicio_id
    LEFT JOIN periodos p_fin           ON p_fin.id = hd.periodo_fin_id
    LEFT JOIN dias_horario dh          ON dh.id  = hd.dia_horario_id
    WHERE ${condiciones.join(' AND ')}
    ORDER BY hd.dia_horario_id, hd.periodo_inicio_id, hd.salon_id
  `, valores);
 
  return { horario, detalles };
}
 
// ----------- CONFLICTOS --------------
 
async function getConflictos(id) {
  const { rows: [horario] } = await db.query(
    `SELECT id, aptitud_final FROM horarios WHERE id = $1`,
    [id]
  );

  if (!horario) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }

  //  CARGAMOS CONTEXTO ANTES
  const ctx = await cargarContexto();
  
  // PASAMOS CTX PARA TRADUCIR
  const individuo = await reconstruirIndividuo(id, ctx);
  if (!individuo) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }
  
  const { aptitud, detalle } = evaluarAptitud(individuo, ctx, true);
  
  return {
    aptitud: Number(horario.aptitud_final),
    aptitud_recalculada: aptitud,
    total_conflictos:   detalle.filter(d => d.penalizacion).reduce((s, d) => s + (d.num_conflictos || 1), 0),
    total_penalizacion: detalle.filter(d => d.penalizacion).reduce((s, d) => s + d.penalizacion, 0),
    total_bonos:        detalle.filter(d => d.bono).reduce((s, d) => s + d.bono, 0),
    conflictos:         detalle.filter(d => d.penalizacion),
    bonos:              detalle.filter(d => d.bono),
  };
}
 
// ----------- REPORTE --------------
 
async function getReporte(id) {
  const { rows: [horario] } = await db.query(`SELECT * FROM horarios WHERE id = $1`, [id]);
  if (!horario) {
    const err = new Error('Horario no encontrado');
    err.status = 404;
    throw err;
  }
 
  //  CARGAMOS CONTEXTO ANTES Y PASAMOS A RECONSTRUIR
  const ctx       = await cargarContexto();
  const individuo = await reconstruirIndividuo(id, ctx);
  const { aptitud, detalle } = evaluarAptitud(individuo, ctx, true);
 
  const conflictosList    = detalle.filter(d => d.penalizacion);
  const totalConflictos   = conflictosList.reduce((s, d) => s + (d.num_conflictos || 1), 0);
  const conflictosPorTipo = conflictosList.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] ?? 0) + (c.num_conflictos || 1);
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
    aptitud_final:           Number(horario.aptitud_final),
    aptitud_recalculada:     aptitud,
    generaciones_ejecutadas: horario.generaciones_ejecutadas,
    tiempo_ejecucion_ms:     horario.tiempo_ejecucion_ms,
    tiempo_ejecucion_seg:    (horario.tiempo_ejecucion_ms / 1000).toFixed(2),
    total_conflictos:        totalConflictos,
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
 
// ----------- EXPORTAR CSV --------------
 
async function exportarCSV(id) {
  const { rows: detalles } = await db.query(`
    SELECT
      p_ini.hora_inicio,
      p_fin.hora_fin,
      sa.nombre                                           AS salon,
      c.nombre                                            AS curso,
      c.codigo,
      c.semestre,
      ca.nombre                                           AS carrera,
      COALESCE(s.letra, s_lab.letra)                      AS seccion,
      d.nombre                                            AS docente,
      COALESCE(
        INITCAP(hd.dia_especifico),
        dh.nombre
      )                                                   AS dias,
      CASE
        WHEN hd.seccion_lab_id IS NOT NULL THEN 'Laboratorio'
        ELSE 'Teórico'
      END                                                 AS tipo
    FROM horario_detalle hd
    LEFT JOIN secciones s              ON s.id   = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl   ON sl.id  = hd.seccion_lab_id
    LEFT JOIN secciones s_lab          ON s_lab.id = sl.seccion_id
    LEFT JOIN cursos c                 ON c.id   = COALESCE(s.curso_id, s_lab.curso_id)
    LEFT JOIN carreras ca              ON ca.id  = c.carrera_id
    LEFT JOIN salones sa               ON sa.id  = hd.salon_id
    LEFT JOIN docentes d               ON d.id   = hd.docente_id
    LEFT JOIN periodos p_ini           ON p_ini.id = hd.periodo_inicio_id
    LEFT JOIN periodos p_fin           ON p_fin.id = hd.periodo_fin_id
    LEFT JOIN dias_horario dh          ON dh.id  = hd.dia_horario_id
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
 
  return '\uFEFF' + cabecera + filas;
}
 
// ----------- EDITAR DETALLE MANUAL --------------
 
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
      dia_especifico    = COALESCE($6, dia_especifico),
      modificado_manual = true
    WHERE id = $7
  `, [
    cambios.salon_id, cambios.docente_id,
    cambios.periodo_inicio_id, cambios.periodo_fin_id,
    cambios.dia_horario_id, cambios.dia_especifico,
    detalleId,
  ]);
 
  //  CARGAMOS CONTEXTO ANTES Y PASAMOS A RECONSTRUIR
  const ctx       = await cargarContexto();
  const individuo = await reconstruirIndividuo(horarioId, ctx);
  const { aptitud, detalle: detalleAptitud } = evaluarAptitud(individuo, ctx, true);
 
  return {
    mensaje:       'Cambio guardado correctamente',
    advertencias:  detalleAptitud.filter(d => d.penalizacion),
    nueva_aptitud: aptitud,
  };
}
 
// ----------- ACTIVAR / ELIMINAR --------------
 
async function activar(id) {
  await db.query(`UPDATE horarios SET es_activo = false`);
  await db.query(`UPDATE horarios SET es_activo = true WHERE id = $1`, [id]);
  return { mensaje: `Horario ${id} activado correctamente` };
}
 
async function eliminar(id) {
  await db.query(`DELETE FROM horarios WHERE id = $1`, [id]);
  return { mensaje: `Horario ${id} eliminado correctamente` };
}
 
// ----------- HELPERS -----------

/**
 * Convierte un gen objeto a gen array compacto y TRADUCE los IDs a Índices
 */
function genObjToArray(genObj, ctx) {
  const arr = new Array(GEN.LENGTH).fill(null);
  arr[GEN.SECCION_ID]            = genObj.seccion_id ?? null;
  arr[GEN.SECCION_LAB_ID]        = genObj.seccion_lab_id ?? null;
  
  //  TRADUCCIÓN : De ID de BD -> a Índice de Arreglo
  arr[GEN.SALON_ID]              = genObj.salon_id != null ? (ctx.salonesIndexById[genObj.salon_id] ?? null) : null;
  arr[GEN.DOCENTE_ID]            = genObj.docente_id != null ? (ctx.docentesIndexById[genObj.docente_id] ?? null) : null;
  arr[GEN.PERIODO_INICIO_ID]     = genObj.periodo_inicio_id != null ? (ctx.periodosIndexById[genObj.periodo_inicio_id] ?? null) : null;
  arr[GEN.PERIODO_FIN_ID]        = genObj.periodo_fin_id != null ? (ctx.periodosIndexById[genObj.periodo_fin_id] ?? null) : null;
  
  arr[GEN.DIA_HORARIO_ID]        = genObj.dia_horario_id ?? null;
  arr[GEN.ES_LABORATORIO]        = genObj.es_laboratorio ? 1 : 0;
  arr[GEN.SIN_SALON]             = genObj.sin_salon ? 1 : 0;
  arr[GEN.CURSO_ID]              = genObj.curso_id ?? null;
  arr[GEN.SEMESTRE]              = genObj.semestre ?? null;
  arr[GEN.CARRERA_ID]            = genObj.carrera_id ?? null;
  arr[GEN.TIPO]                  = genObj.tipo === 'obligatorio' ? 0 : 1; 
  arr[GEN.PUEDE_MANANA]          = genObj.puede_manana ? 1 : 0;
  arr[GEN.PUEDE_TARDE]           = genObj.puede_tarde ? 1 : 0;
  arr[GEN.NUM_ESTUDIANTES]       = genObj.num_estudiantes ?? null;
  
  arr[GEN.SALON_FIJO_ID]         = genObj.salon_fijo_id ?? null;
  arr[GEN.DOCENTE_FIJO_ID]       = genObj.docente_fijo_id ?? null;
  arr[GEN.PERIODO_FIJO_INICIO_ID] = genObj.periodo_fijo_inicio_id ?? null;
  arr[GEN.DIA_HORARIO_FIJO_ID]   = genObj.dia_horario_fijo_id ?? null;
  
  //  TRADUCCIÓN DE LABS
  if (genObj.distribucion_lab) {
    const dist = genObj.distribucion_lab;
    arr[GEN.DIST_MARTES_NUM_PERIODOS]  = dist.martes?.num_periodos ?? 0;
    arr[GEN.DIST_MARTES_INICIO_ID]     = dist.martes?.periodo_inicio_id != null ? (ctx.periodosIndexById[dist.martes.periodo_inicio_id] ?? null) : null;
    arr[GEN.DIST_MARTES_FIN_ID]        = dist.martes?.periodo_fin_id != null ? (ctx.periodosIndexById[dist.martes.periodo_fin_id] ?? null) : null;
    
    arr[GEN.DIST_JUEVES_NUM_PERIODOS]  = dist.jueves?.num_periodos ?? 0;
    arr[GEN.DIST_JUEVES_INICIO_ID]     = dist.jueves?.periodo_inicio_id != null ? (ctx.periodosIndexById[dist.jueves.periodo_inicio_id] ?? null) : null;
    arr[GEN.DIST_JUEVES_FIN_ID]        = dist.jueves?.periodo_fin_id != null ? (ctx.periodosIndexById[dist.jueves.periodo_fin_id] ?? null) : null;
  }
  return arr;
}

// Añadimos "ctx" como parámetro
async function reconstruirIndividuo(horarioId, ctx) {
  const { rows } = await db.query(`
    SELECT
      hd.id, hd.seccion_id, hd.seccion_lab_id,
      hd.salon_id, hd.docente_id, hd.dia_horario_id,
      hd.periodo_inicio_id, hd.periodo_fin_id,
      hd.dia_especifico,
      c.semestre, c.carrera_id, c.tipo,
      c.puede_manana, c.puede_tarde,
      COALESCE(s.num_estudiantes_seccion, s_lab.num_estudiantes_seccion) AS num_estudiantes,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN true ELSE false END   AS es_laboratorio,
      COALESCE(s.sin_salon, false)                                       AS sin_salon,
      COALESCE(s.curso_id, s_lab.curso_id)                               AS curso_id
    FROM horario_detalle hd
    LEFT JOIN secciones s              ON s.id   = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl   ON sl.id  = hd.seccion_lab_id
    LEFT JOIN secciones s_lab          ON s_lab.id = sl.seccion_id
    LEFT JOIN cursos c                 ON c.id   = COALESCE(s.curso_id, s_lab.curso_id)
    WHERE hd.horario_id = $1
  `, [horarioId]);
 
  if (rows.length === 0) return null;
 
  const filasCursos = rows.filter(r => !r.es_laboratorio);
  const filasLabs   = rows.filter(r => r.es_laboratorio);
 
  const labsAgrupados = {};
  for (const fila of filasLabs) {
    const key = fila.seccion_lab_id;
    if (!labsAgrupados[key]) labsAgrupados[key] = { base: fila, filas: [] };
    labsAgrupados[key].filas.push(fila);
  }
 
  const genesLabs = Object.values(labsAgrupados).map(({ base, filas }) => {
    const filaMartes = filas.find(f => f.dia_especifico === 'martes');
    const filaJueves = filas.find(f => f.dia_especifico === 'jueves');
 
    const sinDistribucion = filas.every(f => !f.dia_especifico);
 
    const distribucion_lab = sinDistribucion ? null : {
      martes: filaMartes
        ? { num_periodos: filaMartes.periodo_fin_id - filaMartes.periodo_inicio_id + 1,
            periodo_inicio_id: filaMartes.periodo_inicio_id,
            periodo_fin_id:    filaMartes.periodo_fin_id }
        : { num_periodos: 0, periodo_inicio_id: null, periodo_fin_id: null },
      jueves: filaJueves
        ? { num_periodos: filaJueves.periodo_fin_id - filaJueves.periodo_inicio_id + 1,
            periodo_inicio_id: filaJueves.periodo_inicio_id,
            periodo_fin_id:    filaJueves.periodo_fin_id }
        : { num_periodos: 0, periodo_inicio_id: null, periodo_fin_id: null },
    };
 
    return {
      seccion_id:        null,
      seccion_lab_id:    base.seccion_lab_id,
      salon_id:          base.salon_id,
      docente_id:        base.docente_id,
      dia_horario_id:    base.dia_horario_id,
      periodo_inicio_id: base.periodo_inicio_id,
      periodo_fin_id:    base.periodo_fin_id,
      distribucion_lab,
      es_laboratorio:    true,
      sin_salon:         false,
      semestre:          base.semestre,
      carrera_id:        base.carrera_id,
      tipo:              base.tipo,
      puede_manana:      base.puede_manana,
      puede_tarde:       base.puede_tarde,
      num_estudiantes:   base.num_estudiantes,
      curso_id:          base.curso_id,
    };
  });
 
  const genesCursos = filasCursos.map(r => ({
    seccion_id:        r.seccion_id,
    seccion_lab_id:    null,
    salon_id:          r.salon_id,
    docente_id:        r.docente_id,
    dia_horario_id:    r.dia_horario_id,
    periodo_inicio_id: r.periodo_inicio_id,
    periodo_fin_id:    r.periodo_fin_id,
    distribucion_lab:  null,
    es_laboratorio:    false,
    sin_salon:         r.sin_salon,
    semestre:          r.semestre,
    carrera_id:        r.carrera_id,
    tipo:              r.tipo,
    puede_manana:      r.puede_manana,
    puede_tarde:       r.puede_tarde,
    num_estudiantes:   r.num_estudiantes,
    curso_id:          r.curso_id,
  }));
 
  //  Mapeamos enviando 'ctx' a la función de traducción
  return { genes: [...genesCursos, ...genesLabs].map(g => genObjToArray(g, ctx)), aptitud: null };
}
 
function calcularPorcentajeContinuidad(genes) {
  const TIPO_OBLIGATORIO = 0;
  const grupos = {};
  for (const gen of genes) {
    if (gen[GEN.TIPO] !== TIPO_OBLIGATORIO || !gen[GEN.SEMESTRE] || !gen[GEN.CARRERA_ID]) continue;
    const key = `${gen[GEN.SEMESTRE]}-${gen[GEN.CARRERA_ID]}-${gen[GEN.DIA_HORARIO_ID]}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(gen);
  }
  let totalPares = 0, paresConsecutivos = 0;
  for (const grupo of Object.values(grupos)) {
    if (grupo.length < 2) continue;
    grupo.sort((a, b) => a[GEN.PERIODO_INICIO_ID] - b[GEN.PERIODO_INICIO_ID]);
    for (let i = 0; i < grupo.length - 1; i++) {
      totalPares++;
      if (grupo[i][GEN.PERIODO_FIN_ID] + 1 === grupo[i + 1][GEN.PERIODO_INICIO_ID]) paresConsecutivos++;
    }
  }
  if (totalPares === 0) return 100;
  return ((paresConsecutivos / totalPares) * 100).toFixed(1);
}

const pdfmakePackageJson = require.resolve('pdfmake/package.json');
const fontsDir = path.join(path.dirname(pdfmakePackageJson), 'fonts', 'Roboto');
 
pdfmake.setFonts({
  Roboto: {
    normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontsDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf'),
  },
});
 
 

pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((filePath) => filePath.startsWith(fontsDir));
 
// Colores oficiales por carrera (igual que antes)
const COLORES_CARRERA = {
  SISTEMAS: '#8bb4e7',
  CIVIL: '#89c182',
  MECANICA: '#ff4d4d',
  INDUSTRIAL: '#ff9900',
  MEC_INDUSTRIAL: '#ffd966',
  DEFAULT: '#d9d9d9',
};
 
const formatearDias = (diasStr) => {
  if (!diasStr) return '';
  return diasStr
    .replace(/Lunes, Mi[eé]rcoles y Viernes/gi, 'Lu-Mi-Vi')
    .replace(/Martes y Jueves/gi, 'Ma-Ju')
    .replace(/^Martes$/gi, 'Martes')
    .replace(/^Jueves$/gi, 'Jueves');
};
 

function construirContenidoCelda(cursosEnCelda) {
  if (cursosEnCelda.length === 1) {
    return construirBloqueCurso(cursosEnCelda[0]);
  }
 
  return {
    margin: [0, 0, 0, 0],
    table: {
      widths: ['*'],
      heights: cursosEnCelda.map(() => '*'),
      body: cursosEnCelda.map((curso) => [construirBloqueCurso(curso)]),
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 1),
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}
 
/**
 * Construye el bloque de un solo curso: color de fondo + texto centrado
 * (equivalente a un .curso-box de la versión HTML).
 */
function construirBloqueCurso(curso) {
  const color = COLORES_CARRERA[curso.carrera_codigo] || COLORES_CARRERA.DEFAULT;
  const diasAbreviados = formatearDias(curso.dias);
  const horaTexto = `${curso.hora_inicio.slice(0, 5)} - ${curso.hora_fin.slice(0, 5)}`;
 
  return {
    fillColor: color,
    alignment: 'center',
    margin: [3, 4, 3, 4],
    stack: [
      { text: curso.curso, bold: true, fontSize: 7, alignment: 'center', margin: [0, 0, 0, 2] },
      { text: `Sec: ${curso.seccion} | ${curso.codigo}`, fontSize: 6, alignment: 'center' },
      { text: curso.docente || 'Sin Docente', fontSize: 6, alignment: 'center' },
      {
        text: `${diasAbreviados} | ${horaTexto}`,
        fontSize: 5.5,
        bold: true,
        alignment: 'center',
        margin: [0, 2, 0, 0],
      },
    ],
  };
}
 

function construirGridPdfMake(datos, salones, periodos, titulo, esPrimeraSeccion) {
  const celdasOmitidas = {}; // key: `${salon.id}-${periodo.numero}` -> true si está cubierta por un rowSpan de arriba
 
  const headerRow = [
    { text: 'HORARIO', style: 'headerCell', fillColor: '#eaeaea' },
    ...salones.map((s) => ({ text: s.nombre, style: 'headerCell' })),
  ];
 
  const body = [headerRow];
 
  for (const periodo of periodos) {
    // Franja divisoria negra (equivalente al <tr> de separación en periodo 6)
    if (periodo.numero === 6) {
      const filaDivisoria = [
        {
          text: '',
          colSpan: salones.length + 1,
          fillColor: '#222222',
          border: [false, false, false, false],
        },
      ];
      for (let i = 0; i < salones.length; i++) filaDivisoria.push({});
      body.push(filaDivisoria);
    }
 
    const tiempoTexto = `${periodo.hora_inicio.slice(0, 5)}\n-\n${periodo.hora_fin.slice(0, 5)}`;
    const fila = [{ text: tiempoTexto, style: 'timeCell', fillColor: '#eaeaea' }];
 
    for (const salon of salones) {
      const celdaKey = `${salon.id}-${periodo.numero}`;
 
      if (celdasOmitidas[celdaKey]) {
        // Placeholder obligatorio: esta celda ya está "ocupada" por el
        // rowSpan de una fila anterior en esta misma columna.
        fila.push({});
        continue;
      }
 
      const cursosEnCelda = datos.filter(
        (d) => d.salon_id === salon.id && d.periodo_inicio_num === periodo.numero
      );
 
      if (cursosEnCelda.length > 0) {
        const maxRowspan = Math.max(
          ...cursosEnCelda.map((c) => c.periodo_fin_num - c.periodo_inicio_num + 1)
        );
 
        if (maxRowspan > 1) {
          for (let i = 1; i < maxRowspan; i++) {
            celdasOmitidas[`${salon.id}-${periodo.numero + i}`] = true;
          }
        }
 
        const celda = construirContenidoCelda(cursosEnCelda);
        celda.rowSpan = maxRowspan;
        fila.push(celda);
      } else {
        fila.push({ text: '' });
      }
    }
 
    body.push(fila);
  }
 
  const anchoColumnaTiempo = 45;
  const widths = [anchoColumnaTiempo, ...salones.map(() => '*')];
 
  return [
    {
      text: titulo,
      style: 'tituloSeccion',
      pageBreak: esPrimeraSeccion ? undefined : 'before',
    },
    {
      table: {
        headerRows: 1,
        widths,
        body,
      },
      layout: {
        hLineWidth: () => 1.5,
        vLineWidth: () => 1.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
    },
  ];
}
 
async function exportarPDF(id) {
  const { rows: detalles } = await db.query(
    `
    SELECT
      hd.dia_especifico,
      COALESCE(INITCAP(hd.dia_especifico), dh.nombre) AS dias,
      sa.id AS salon_id, sa.nombre AS salon,
      c.nombre AS curso, c.codigo, ca.codigo AS carrera_codigo,
      COALESCE(s.letra, s_lab.letra) AS seccion,
      d.nombre AS docente,
      p_ini.numero AS periodo_inicio_num,
      p_fin.numero AS periodo_fin_num,
      p_ini.hora_inicio,
      p_fin.hora_fin,
      CASE WHEN hd.seccion_lab_id IS NOT NULL THEN true ELSE false END AS es_laboratorio
    FROM horario_detalle hd
    LEFT JOIN secciones s ON s.id = hd.seccion_id
    LEFT JOIN seccion_laboratorio sl ON sl.id = hd.seccion_lab_id
    LEFT JOIN secciones s_lab ON s_lab.id = sl.seccion_id
    LEFT JOIN cursos c ON c.id = COALESCE(s.curso_id, s_lab.curso_id)
    LEFT JOIN carreras ca ON ca.id = c.carrera_id
    LEFT JOIN salones sa ON sa.id = hd.salon_id
    LEFT JOIN docentes d ON d.id = hd.docente_id
    LEFT JOIN periodos p_ini ON p_ini.id = hd.periodo_inicio_id
    LEFT JOIN periodos p_fin ON p_fin.id = hd.periodo_fin_id
    LEFT JOIN dias_horario dh ON dh.id = hd.dia_horario_id
    WHERE hd.horario_id = $1 AND hd.salon_id IS NOT NULL
    ORDER BY p_ini.numero ASC
  `,
    [id]
  );
 
  const { rows: salones } = await db.query(
    `SELECT id, nombre FROM salones WHERE activo = true ORDER BY nombre`
  );
  const { rows: periodos } = await db.query(
    `SELECT numero, hora_inicio, hora_fin, es_manana FROM periodos ORDER BY numero`
  );
 
  const teoricos = detalles.filter((d) => !d.es_laboratorio);
  const laboratorios = detalles.filter((d) => d.es_laboratorio);
 
  const contenido = [
    ...construirGridPdfMake(teoricos, salones, periodos, 'Horario de Clases - Cursos Teóricos', true),
    ...construirGridPdfMake(laboratorios, salones, periodos, 'Horario de Clases - Laboratorios', false),
  ];
 
  // A1 landscape en puntos (72 dpi): 594mm x 841mm -> ~1683.78 x 2383.94 pt
  const docDefinition = {
    pageSize: { width: 2383.94, height: 1683.78 }, // A1 landscape
    pageOrientation: 'landscape',
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8,
    },
    styles: {
      tituloSeccion: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        color: '#333333',
        margin: [0, 0, 0, 20],
      },
      headerCell: {
        fontSize: 10,
        bold: true,
        alignment: 'center',
        color: '#111111',
      },
      timeCell: {
        fontSize: 9,
        bold: true,
        alignment: 'center',
        color: '#000000',
      },
    },
    content: contenido,
  };
 
  const documento = pdfmake.createPdf(docDefinition);
  return documento.getBuffer();
}
 
module.exports = {
  listar, obtener, getConflictos, getReporte,
  exportarCSV, editarDetalle, activar, eliminar, exportarPDF
};