
const resetService = require('../../services/reset/reset.service');
 
async function estado(req, res) {
  try {
    const datos = await resetService.getEstadoBD();
    return res.json(datos);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
 
async function resetCompleto(req, res) {
  try {
    const resultado = await resetService.resetCompleto();
    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
 
async function resetHorarios(req, res) {
  try {
    const resultado = await resetService.resetHorarios();
    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
 
module.exports = { estado, resetCompleto, resetHorarios };
 
