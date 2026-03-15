const express = require('express');
const router = express.Router();
const docentesController = require('../controllers/docentes.controller');

router.get('/', docentesController.getAllDocentes);
router.get('/:id', docentesController.getDocenteById);
router.post('/', docentesController.createDocente);
router.put('/:id', docentesController.updateDocente);
router.delete('/:id', docentesController.deleteDocente);

module.exports = router;