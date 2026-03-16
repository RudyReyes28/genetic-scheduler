const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./src/db');

const carrerasRoutes = require('./src/routes/carreras.routes');
const salonesRoutes = require('./src/routes/salones.routes');
const docentesRoutes = require('./src/routes/docentes.routes');
const importarRoutes = require('./src/routes/importar.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Genetic Scheduler funcionando' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API disponible' });
});

// RURAS ACA
app.use('/api/carreras', carrerasRoutes);
app.use('/api/salones', salonesRoutes);
app.use('/api/docentes', docentesRoutes);

// importacion de archivos csv
app.use('/api/importar', importarRoutes);

app.use((err, req, res, next) => {
  console.error(' Error no controlado:', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/health`);
});