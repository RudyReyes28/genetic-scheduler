const express = require('express');
const router = express.Router();
const horariosPersonalesController = require('../../controllers/horarios-personales/horariosPersonales.controller');

router.get('/:ra', horariosPersonalesController.obtener);
router.put('/:ra', horariosPersonalesController.upsert);
router.delete('/:ra', horariosPersonalesController.eliminar);

module.exports = router;
