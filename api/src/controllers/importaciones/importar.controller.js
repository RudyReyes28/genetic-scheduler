const importarService = require('../../services/importaciones/importar.service');

const validarArchivo = (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Debes enviar un archivo CSV en el campo "archivo"' });
    return false;
  }

  return true;
};

const importarDocentes = async (req, res) => {
  if (!validarArchivo(req, res)) return;

  try {
    const resultado = await importarService.importarDocentes(req.file.buffer);

    res.json({
      mensaje: 'Importación de docentes completada',
      ...resultado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al importar docentes' });
  }
};

const importarCursos = async (req, res) => {
  if (!validarArchivo(req, res)) return;

  try {
    const resultado = await importarService.importarCursos(req.file.buffer);

    res.json({
      mensaje: 'Importación de cursos completada',
      ...resultado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al importar cursos' });
  }
};

const importarDocenteCurso = async (req, res) => {
  if (!validarArchivo(req, res)) return;

  try {
    const resultado = await importarService.importarDocenteCurso(req.file.buffer);

    res.json({
      mensaje: 'Importación de docente-curso completada',
      ...resultado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al importar docente-curso' });
  }
};

const importarSalones = async (req, res) => {
  if (!validarArchivo(req, res)) return;

  try {
    const resultado = await importarService.importarSalones(req.file.buffer);

    res.json({
      mensaje: 'Importación de salones completada',
      ...resultado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al importar salones' });
  }
};

module.exports = {
  importarDocentes,
  importarCursos,
  importarDocenteCurso,
  importarSalones,
};