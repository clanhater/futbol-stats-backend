const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas nuevas que no requieren autenticación de admin
router.get('/status/:date', jornadaController.getJornadaStatus);
router.get('/settings', jornadaController.getAppSettings);

router.get('/:date/player/:playerId', jornadaController.getPlayerStatsForDate);

// Ruta de registro que sí requiere autenticación
router.post('/registrar', authMiddleware, jornadaController.registrarJornada);

module.exports = router;