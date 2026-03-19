const express = require('express');
const router = express.Router();
const salonesController = require('../../controllers/salones/salones.controller');

router.get('/', salonesController.getAllSalones);
router.get('/:id', salonesController.getSalonById);
router.post('/', salonesController.createSalon);
router.put('/:id', salonesController.updateSalon);
router.delete('/:id', salonesController.deleteSalon);

module.exports = router;