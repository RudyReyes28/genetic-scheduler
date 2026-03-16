const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./src/routes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`API disponible en http://localhost:${port}/health`);
});
