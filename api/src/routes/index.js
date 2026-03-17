const express = require('express');
const cursosRoutes = require('./cursos/cursos.routes');
const laboratoriosRoutes = require('./laboratorios/laboratorios.routes');
const seccionesRoutes = require('./secciones/secciones.routes');
const seccionLaboratorioRoutes = require('./seccion-laboratorio/seccionLaboratorio.routes');
const docenteCursoRoutes = require('./docente-curso/docenteCurso.routes');
const configuracionRoutes = require('./configuracion/configuracion.routes');
const periodosRoutes = require('./periodos/periodos.routes');
const diasHorarioRoutes = require('./dias-horario/diasHorario.routes');

const carrerasRoutes = require('./carreras/carreras.routes');
const salonesRoutes = require('./salones/salones.routes');
const docentesRoutes = require('./docentes/docentes.routes');
const importarRoutes = require('./importaciones/importar.routes');


const algoritmoRoutes = require('./algoritmo/algoritmo.routes');

const horariosRoutes = require('./horarios/horarios.routes');


const router = express.Router();

router.use('/cursos', cursosRoutes);
router.use('/laboratorios', laboratoriosRoutes);
router.use('/secciones', seccionesRoutes);
router.use('/seccion-laboratorio', seccionLaboratorioRoutes);
router.use('/docente-curso', docenteCursoRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/periodos', periodosRoutes);
router.use('/dias-horario', diasHorarioRoutes);

router.use('/carreras', carrerasRoutes);
router.use('/salones', salonesRoutes);
router.use('/docentes', docentesRoutes);
router.use('/importar', importarRoutes);


router.use('/algoritmo', algoritmoRoutes);
router.use('/horarios', horariosRoutes);
module.exports = router;
