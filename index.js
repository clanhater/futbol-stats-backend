// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jornadaRoutes = require('./routes/jornadaRoutes');
const statsRoutes = require('./routes/statsRoutes'); // 1. Importar

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/jornada', jornadaRoutes); // Rutas de Admin
app.use('/api', statsRoutes);           // 2. Usar las rutas públicas

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;