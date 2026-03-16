const configuracionService = require('../../services/configuracion/configuracion.service');

async function getCurrent(req, res, next) {
  try {
    const data = await configuracionService.getCurrent();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await configuracionService.update(req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrent,
  update,
};
