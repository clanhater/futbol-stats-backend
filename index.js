// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jornadaRoutes = require('./routes/jornadaRoutes');
const statsRoutes = require('./routes/statsRoutes');
const challengeRoutes = require('./routes/challengeRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/jornada', jornadaRoutes); // Rutas de Admin
app.use('/api', statsRoutes);           // Rutas públicas
app.use('/api/desafio', challengeRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;