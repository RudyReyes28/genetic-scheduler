const periodosService = require('../../services/periodos/periodos.service');

async function getAll(req, res, next) {
  try {
    const data = await periodosService.getAll();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
};
