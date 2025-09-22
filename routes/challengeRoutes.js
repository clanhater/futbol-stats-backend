// routes/challengeRoutes.js
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

// Rutas para que un jugador específico interactúe con sus desafíos
// Asumimos que la autenticación del jugador se manejará en el futuro.
// Por ahora, pasamos el ID en la URL.

// Reclamar recompensas de misiones
router.post('/jugadores/:playerId/reclamar-misiones', challengeController.claimMissions);

// Comprar un ítem de la tienda
router.post('/jugadores/:playerId/comprar-item', challengeController.buyStoreItem);

module.exports = router;