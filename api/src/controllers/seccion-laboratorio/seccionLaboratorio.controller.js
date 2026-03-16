const seccionLaboratorioService = require('../../services/seccion-laboratorio/seccionLaboratorio.service');

async function getAll(req, res, next) {
  try {
    const data = await seccionLaboratorioService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await seccionLaboratorioService.getById(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await seccionLaboratorioService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await seccionLaboratorioService.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await seccionLaboratorioService.remove(Number(req.params.id));
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
