const express = require('express');
const router = express.Router();
const carrerasController = require('../controllers/carreras.controller');

router.get('/', carrerasController.getAllCarreras);
router.get('/:id', carrerasController.getCarreraById);
router.post('/', carrerasController.createCarrera);
router.put('/:id', carrerasController.updateCarrera);
router.delete('/:id', carrerasController.deleteCarrera);

module.exports = router;