const express = require('express');
const cors = require('cors');

require('dotenv').config();
const apiRoutes = require('./src/routes');

require('./src/db');

const carrerasRoutes = require('./src/routes/carreras.routes');
const salonesRoutes = require('./src/routes/salones.routes');
const docentesRoutes = require('./src/routes/docentes.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Genetic Scheduler funcionando' });
});

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API disponible' });
});


// RURAS ACA
app.use('/api/carreras', carrerasRoutes);
app.use('/api/salones', salonesRoutes);
app.use('/api/docentes', docentesRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada.',
  });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Error interno del servidor.';

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;


app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/health`);
});