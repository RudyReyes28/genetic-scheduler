const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./src/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Genetic Scheduler funcionando' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API disponible' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/health`);
});