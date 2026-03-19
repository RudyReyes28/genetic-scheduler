const seccionesService = require('../../services/secciones/secciones.service');

async function getAll(req, res, next) {
  try {
    const data = await seccionesService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await seccionesService.getById(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await seccionesService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await seccionesService.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await seccionesService.remove(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getByCursoId(req, res, next) {
  try {
    const data = await seccionesService.getByCursoId(Number(req.params.cursoId));
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
  getByCursoId,
};
