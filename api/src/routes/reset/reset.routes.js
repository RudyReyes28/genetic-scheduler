
const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/reset/reset.controller');
 
// Ver estado actual de la BD
router.get('/estado', controller.estado);
 
// Limpiar todo (cursos, docentes, salones, horarios, etc.)
router.delete('/completo', controller.resetCompleto);
 
// Limpiar solo horarios generados
router.delete('/horarios', controller.resetHorarios);
 
module.exports = router;