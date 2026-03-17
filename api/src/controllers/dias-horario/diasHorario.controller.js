const diasHorarioService = require('../../services/dias-horario/diasHorario.service');

const getAllDiasHorario = async (req, res) => {
  try {
    const diasHorario = await diasHorarioService.findAll();
    res.json(diasHorario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener días de horario' });
  }
};

module.exports = {
  getAllDiasHorario,
};
