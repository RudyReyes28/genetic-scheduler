const express = require('express');
const controller = require('../../controllers/docente-curso/docenteCurso.controller');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
