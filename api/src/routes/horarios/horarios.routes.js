
const router = require('express').Router();

const horariosController = require('../../controllers/horarios/horarios.controller');

// Listar todos los horarios generados
router.get('/',                   horariosController.listar);
 
// Obtener un horario completo (la grilla)
router.get('/:id',                horariosController.obtener);
 
// Conflictos de un horario
router.get('/:id/conflictos',     horariosController.conflictos);
 
// Reporte de estadísticas
router.get('/:id/reporte',        horariosController.reporte);
 
// Exportar a CSV
router.get('/:id/exportar/csv',   horariosController.exportarCSV);
 
// Edición manual de un detalle del horario
router.put('/:id/detalle/:detalleId', horariosController.editarDetalle);
 
// Activar un horario como el oficial
router.put('/:id/activar',        horariosController.activar);
 
// Eliminar un horario
router.delete('/:id',             horariosController.eliminar);

module.exports = router;