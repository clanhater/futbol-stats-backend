// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Añadimos esta ruta para la página de inicio
router.get('/portada', statsController.getHomePageData);

// Ruta para la tabla de clasificación general
router.get('/clasificacion', statsController.getClasificacion);

// Ruta para el perfil detallado de un jugador por su ID
router.get('/jugadores/:id/perfil', statsController.getPlayerDetails);

module.exports = router;