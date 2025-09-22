// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Usamos 3001 para evitar conflictos

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running!' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Exportar app para Vercel