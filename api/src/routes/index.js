const express = require('express');
const cursosRoutes = require('./cursos/cursos.routes');
const laboratoriosRoutes = require('./laboratorios/laboratorios.routes');
const seccionesRoutes = require('./secciones/secciones.routes');
const seccionLaboratorioRoutes = require('./seccion-laboratorio/seccionLaboratorio.routes');
const docenteCursoRoutes = require('./docente-curso/docenteCurso.routes');

const carrerasRoutes = require('./carreras/carreras.routes');
const salonesRoutes = require('./salones/salones.routes');
const docentesRoutes = require('./docentes/docentes.routes');
const importarRoutes = require('./importaciones/importar.routes');


const router = express.Router();

router.use('/cursos', cursosRoutes);
router.use('/laboratorios', laboratoriosRoutes);
router.use('/secciones', seccionesRoutes);
router.use('/seccion-laboratorio', seccionLaboratorioRoutes);
router.use('/docente-curso', docenteCursoRoutes);

router.use('/carreras', carrerasRoutes);
router.use('/salones', salonesRoutes);
router.use('/docentes', docentesRoutes);
router.use('/importaciones', importarRoutes);

module.exports = router;
