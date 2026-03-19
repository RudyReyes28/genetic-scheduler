

const algoritmoService = require('../../services/algoritmo/algoritmo.service');


async function ejecutar(req, res) {
  try {
    const resultado = await algoritmoService.ejecutar(req.body);
    return res.json(resultado);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

function estado(req, res) {
  return res.json(algoritmoService.getEstado());
}

async function historial(req, res) {
  try {
    const rows = await algoritmoService.getHistorial(req.params.id);
    return res.json(rows);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function getConfiguracion(req, res) {
  try {
    const config = await algoritmoService.getConfiguracion();
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function updateConfiguracion(req, res) {
  try {
    const config = await algoritmoService.updateConfiguracion(req.body);
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  ejecutar,
  estado,
  historial,
  getConfiguracion,
  updateConfiguracion,
};