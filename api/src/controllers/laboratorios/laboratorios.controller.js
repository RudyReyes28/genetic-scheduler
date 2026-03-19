const laboratoriosService = require('../../services/laboratorios/laboratorios.service');

async function getAll(req, res, next) {
  try {
    const data = await laboratoriosService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await laboratoriosService.getById(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await laboratoriosService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await laboratoriosService.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await laboratoriosService.remove(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getByCursoId(req, res, next) {
  try {
    const data = await laboratoriosService.getByCursoId(Number(req.params.cursoId));
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
