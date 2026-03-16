const express = require('express');
const cursosRoutes = require('./cursos/cursos.routes');
const laboratoriosRoutes = require('./laboratorios/laboratorios.routes');
const seccionesRoutes = require('./secciones/secciones.routes');
const seccionLaboratorioRoutes = require('./seccion-laboratorio/seccionLaboratorio.routes');
const docenteCursoRoutes = require('./docente-curso/docenteCurso.routes');
const configuracionRoutes = require('./configuracion/configuracion.routes');
const periodosRoutes = require('./periodos/periodos.routes');

const router = express.Router();

router.use('/cursos', cursosRoutes);
router.use('/laboratorios', laboratoriosRoutes);
router.use('/secciones', seccionesRoutes);
router.use('/seccion-laboratorio', seccionLaboratorioRoutes);
router.use('/docente-curso', docenteCursoRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/periodos', periodosRoutes);

module.exports = router;
