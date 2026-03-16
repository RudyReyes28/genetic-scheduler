const docenteCursoService = require('../../services/docente-curso/docenteCurso.service');

async function getAll(req, res, next) {
  try {
    const data = await docenteCursoService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await docenteCursoService.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await docenteCursoService.remove(Number(req.params.id));
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  create,
  remove,
};
