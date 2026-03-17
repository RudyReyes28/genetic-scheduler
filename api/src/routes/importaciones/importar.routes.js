const express = require('express');
const multer = require('multer');
const importarController = require('../../controllers/importaciones/importar.controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (!isCsv) {
      return cb(new Error('Solo se permiten archivos CSV'));
    }

    cb(null, true);
  },
});

router.post('/docentes', upload.single('archivo'), importarController.importarDocentes);
router.post('/cursos', upload.single('archivo'), importarController.importarCursos);
router.post('/docente-curso', upload.single('archivo'), importarController.importarDocenteCurso);
router.post('/salones', upload.single('archivo'), importarController.importarSalones);
router.post('/laboratorios', upload.single('archivo'), importarController.importarLaboratorios);
router.post('/secciones', upload.single('archivo'), importarController.importarSecciones);
router.post('/seccion-laboratorio', upload.single('archivo'), importarController.importarSeccionLaboratorio);

module.exports = router;