const carrerasService = require('../services/carreras.service');

const getAllCarreras = async (req, res) => {
  try {
    const carreras = await carrerasService.findAll();
    res.json(carreras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carreras' });
  }
};

const getCarreraById = async (req, res) => {
  try {
    const carrera = await carrerasService.findById(req.params.id);

    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    res.json(carrera);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la carrera' });
  }
};

const getCarreraByCodigo = async (req, res) => {
  try {
    const carrera = await carrerasService.findByCodigo(req.params.codigo);

    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    res.json(carrera);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la carrera' });
  }
};

const createCarrera = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({
        error: 'Los campos nombre y codigo son obligatorios',
      });
    }

    const nuevaCarrera = await carrerasService.create({ nombre, codigo });
    res.status(201).json(nuevaCarrera);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código de la carrera ya existe' });
    }

    res.status(500).json({ error: 'Error al crear la carrera' });
  }
};

const updateCarrera = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({
        error: 'Los campos nombre y codigo son obligatorios',
      });
    }

    const carreraExistente = await carrerasService.findById(req.params.id);

    if (!carreraExistente) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    const carreraActualizada = await carrerasService.update(req.params.id, {
      nombre,
      codigo,
    });

    res.json(carreraActualizada);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código de la carrera ya existe' });
    }

    res.status(500).json({ error: 'Error al actualizar la carrera' });
  }
};

const deleteCarrera = async (req, res) => {
  try {
    const carreraEliminada = await carrerasService.remove(req.params.id);

    if (!carreraEliminada) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    res.json({ message: 'Carrera eliminada correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar la carrera porque está siendo usada en otros registros',
      });
    }

    res.status(500).json({ error: 'Error al eliminar la carrera' });
  }
};

module.exports = {
  getAllCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  getCarreraByCodigo,
  
};