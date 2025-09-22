// routes/jornadaRoutes.js
const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/status/:date', jornadaController.getJornadaStatus);

// Aplicar el middleware de autenticación a esta ruta
router.post('/registrar', authMiddleware, jornadaController.registrarJornada);

module.exports = router;