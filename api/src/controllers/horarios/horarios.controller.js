
const horariosService = require('../../services/horarios/horarios.service');

async function listar(req, res) {
  try {
    const horarios = await horariosService.listar();
    return res.json(horarios);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function obtener(req, res) {
  try {
    const resultado = await horariosService.obtener(req.params.id, req.query);
    return res.json(resultado);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function conflictos(req, res) {
  try {
    const resultado = await horariosService.getConflictos(req.params.id);
    return res.json(resultado);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function reporte(req, res) {
  try {
    const resultado = await horariosService.getReporte(req.params.id);
    return res.json(resultado);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function exportarCSV(req, res) {
  try {
    const csv = await horariosService.exportarCSV(req.params.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="horario_${req.params.id}.csv"`);
    return res.send(csv);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function editarDetalle(req, res) {
  try {
    const resultado = await horariosService.editarDetalle(
      req.params.id,
      req.params.detalleId,
      req.body
    );
    return res.json(resultado);
  } catch (error) {
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function activar(req, res) {
  try {
    const resultado = await horariosService.activar(req.params.id);
    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function eliminar(req, res) {
  try {
    const resultado = await horariosService.eliminar(req.params.id);
    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  listar,
  obtener,
  conflictos,
  reporte,
  exportarCSV,
  editarDetalle,
  activar,
  eliminar,
};