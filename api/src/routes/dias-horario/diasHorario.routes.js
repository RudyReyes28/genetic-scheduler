const express = require('express');
const router = express.Router();
const diasHorarioController = require('../../controllers/dias-horario/diasHorario.controller');

router.get('/', diasHorarioController.getAllDiasHorario);

module.exports = router;
