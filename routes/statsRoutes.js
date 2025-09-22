// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Ruta para la tabla de clasificación general
router.get('/clasificacion', statsController.getClasificacion);

// Ruta para el perfil detallado de un jugador por su ID
router.get('/jugadores/:id/perfil', statsController.getPlayerDetails);

module.exports = router;