const salonesService = require('../services/salones.service');

const getAllSalones = async (req, res) => {
  try {
    const salones = await salonesService.findAll();
    res.json(salones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener salones' });
  }
};

const getSalonById = async (req, res) => {
  try {
    const salon = await salonesService.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    res.json(salon);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el salón' });
  }
};

const createSalon = async (req, res) => {
  try {
    const {
      nombre,
      capacidad,
      es_laboratorio,
      lab_habilitado_teorico,
      disponible_manana,
      disponible_tarde,
      activo,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'El campo nombre es obligatorio',
      });
    }

    const nuevoSalon = await salonesService.create({
      nombre,
      capacidad,
      es_laboratorio,
      lab_habilitado_teorico,
      disponible_manana,
      disponible_tarde,
      activo,
    });

    res.status(201).json(nuevoSalon);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el salón' });
  }
};

const updateSalon = async (req, res) => {
  try {
    const {
      nombre,
      capacidad,
      es_laboratorio,
      lab_habilitado_teorico,
      disponible_manana,
      disponible_tarde,
      activo,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'El campo nombre es obligatorio',
      });
    }

    const salonExistente = await salonesService.findById(req.params.id);

    if (!salonExistente) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    const salonActualizado = await salonesService.update(req.params.id, {
      nombre,
      capacidad,
      es_laboratorio,
      lab_habilitado_teorico,
      disponible_manana,
      disponible_tarde,
      activo,
    });

    res.json(salonActualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el salón' });
  }
};

const deleteSalon = async (req, res) => {
  try {
    const salonEliminado = await salonesService.remove(req.params.id);

    if (!salonEliminado) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    res.json({ message: 'Salón eliminado correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar el salón porque está siendo usado en otros registros',
      });
    }

    res.status(500).json({ error: 'Error al eliminar el salón' });
  }
};

module.exports = {
  getAllSalones,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
};