const cursosService = require('../../services/cursos/cursos.service');

async function getAll(req, res, next) {
  try {
    const data = await cursosService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await cursosService.getById(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await cursosService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await cursosService.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await cursosService.remove(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

// ===== ACCIONES MASIVAS =====

async function desactivarSemestresPares(req, res) {
  try {
    const data = await cursosService.desactivarSemestresPares();
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Error desactivando cursos de semestre par.',
    });
  }
}

async function desactivarSemestresImpares(req, res) {
  try {
    const data = await cursosService.desactivarSemestresImpares();
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Error desactivando cursos de semestre impar.',
    });
  }
}

async function desactivarTodos(req, res) {
  try {
    const data = await cursosService.desactivarTodos();
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Error desactivando todos los cursos.',
    });
  }
}

async function activarTodos(req, res) {
  try {
    const data = await cursosService.activarTodos();
    res.json(data);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Error activando todos los cursos.',
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  desactivarSemestresPares,
  desactivarSemestresImpares,
  desactivarTodos,
  activarTodos,
};
