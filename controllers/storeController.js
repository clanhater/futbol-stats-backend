// controllers/storeController.js
const pool = require('../config/db');

/**
 * Obtiene todos los ítems disponibles en la tienda.
 */
exports.getStoreItems = async (req, res, next) => {
    try {
        const query = 'SELECT id, name, description, type, value, cost_points FROM store_items WHERE is_available = TRUE ORDER BY cost_points ASC';
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener los ítems de la tienda:", error);
        next(error);
    }
};