const express = require('express');
const cursosRoutes = require('./cursos/cursos.routes');
const laboratoriosRoutes = require('./laboratorios/laboratorios.routes');
const seccionesRoutes = require('./secciones/secciones.routes');
const seccionLaboratorioRoutes = require('./seccion-laboratorio/seccionLaboratorio.routes');
const docenteCursoRoutes = require('./docente-curso/docenteCurso.routes');

const router = express.Router();

router.use('/cursos', cursosRoutes);
router.use('/laboratorios', laboratoriosRoutes);
router.use('/secciones', seccionesRoutes);
router.use('/seccion-laboratorio', seccionLaboratorioRoutes);
router.use('/docente-curso', docenteCursoRoutes);

module.exports = router;
