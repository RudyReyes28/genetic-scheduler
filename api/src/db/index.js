const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then((client) => {
    console.log('Conexión exitosa a PostgreSQL');
    client.release();
  })
  .catch((error) => {
    console.error('Error al conectar a PostgreSQL:', error.message);
  });

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  query,
};