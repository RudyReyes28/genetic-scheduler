const express = require('express');
const controller = require('../../controllers/configuracion/configuracion.controller');

const router = express.Router();

router.get('/', controller.getCurrent);
router.put('/', controller.update);

module.exports = router;
