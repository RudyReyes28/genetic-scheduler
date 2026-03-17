const express = require('express');
const controller = require('../../controllers/cursos/cursos.controller');

const router = express.Router();
// Acciones masivas
router.patch('/desactivar-pares', controller.desactivarSemestresPares);
router.patch('/desactivar-impares', controller.desactivarSemestresImpares);
router.patch('/desactivar-todos', controller.desactivarTodos);
router.patch('/activar-todos', controller.activarTodos);

//CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
