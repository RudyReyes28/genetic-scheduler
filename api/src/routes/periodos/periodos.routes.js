const express = require('express');
const controller = require('../../controllers/periodos/periodos.controller');

const router = express.Router();

router.get('/', controller.getAll);

module.exports = router;
