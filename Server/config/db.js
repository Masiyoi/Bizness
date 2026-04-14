const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('Connected to the Bizna_AI database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};