const express = require('express');
const cors = require('cors');

require('dotenv').config();
const apiRoutes = require('./src/routes');

require('./src/db');

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/health`);
});