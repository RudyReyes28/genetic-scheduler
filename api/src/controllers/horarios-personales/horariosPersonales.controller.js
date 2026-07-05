const horariosPersonalesService = require('../../services/horarios-personales/horariosPersonales.service');

const obtener = async (req, res) => {
  try {
    const result = await horariosPersonalesService.obtener(req.params.ra);
    return res.json(result);
  } catch (e) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
};

const upsert = async (req, res) => {
  try {
    const { ra } = req.params;

    if (!ra) {
      return res.status(400).json({ error: 'El parámetro ra es obligatorio' });
    }

    if (!req.body || !Array.isArray(req.body.detalles)) {
      return res.status(400).json({ error: 'El campo detalles debe ser un arreglo' });
    }

    const result = await horariosPersonalesService.upsert(ra, req.body);
    return res.json(result);
  } catch (e) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const result = await horariosPersonalesService.eliminar(req.params.ra);
    return res.json(result);
  } catch (e) {
    return res.status(e.status ?? 500).json({ error: e.message });
  }
};

module.exports = {
  obtener,
  upsert,
  eliminar,
};
