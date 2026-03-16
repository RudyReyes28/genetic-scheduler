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

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
