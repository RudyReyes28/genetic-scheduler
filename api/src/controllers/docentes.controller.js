const docentesService = require('../services/docentes.service');

const getAllDocentes = async (req, res) => {
  try {
    const docentes = await docentesService.findAll();
    res.json(docentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener docentes' });
  }
};

const getDocenteById = async (req, res) => {
  try {
    const docente = await docentesService.findById(req.params.id);

    if (!docente) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    res.json(docente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el docente' });
  }
};

const createDocente = async (req, res) => {
  try {
    const {
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo,
    } = req.body;

    if (!nombre || !registro_personal || !hora_entrada || !hora_salida) {
      return res.status(400).json({
        error: 'Los campos nombre, registro_personal, hora_entrada y hora_salida son obligatorios',
      });
    }

    const nuevoDocente = await docentesService.create({
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo,
    });

    res.status(201).json(nuevoDocente);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'El registro_personal ya existe',
      });
    }

    res.status(500).json({ error: 'Error al crear el docente' });
  }
};

const updateDocente = async (req, res) => {
  try {
    const {
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo,
    } = req.body;

    if (!nombre || !registro_personal || !hora_entrada || !hora_salida) {
      return res.status(400).json({
        error: 'Los campos nombre, registro_personal, hora_entrada y hora_salida son obligatorios',
      });
    }

    const docenteExistente = await docentesService.findById(req.params.id);

    if (!docenteExistente) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    const docenteActualizado = await docentesService.update(req.params.id, {
      nombre,
      registro_personal,
      hora_entrada,
      hora_salida,
      activo,
    });

    res.json(docenteActualizado);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'El registro_personal ya existe',
      });
    }

    res.status(500).json({ error: 'Error al actualizar el docente' });
  }
};

const deleteDocente = async (req, res) => {
  try {
    const docenteEliminado = await docentesService.remove(req.params.id);

    if (!docenteEliminado) {
      return res.status(404).json({ error: 'Docente no encontrado' });
    }

    res.json({ message: 'Docente eliminado correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar el docente porque está siendo usado en otros registros',
      });
    }

    res.status(500).json({ error: 'Error al eliminar el docente' });
  }
};

module.exports = {
  getAllDocentes,
  getDocenteById,
  createDocente,
  updateDocente,
  deleteDocente,
};