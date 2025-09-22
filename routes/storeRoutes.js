// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/items', storeController.getStoreItems);

module.exports = router;