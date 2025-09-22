// controllers/challengeController.js
const pool = require('../config/db');

/**
 * Reclama las recompensas de misiones completadas.
 */
exports.claimMissions = async (req, res, next) => {
  const { playerId } = req.params; // Suponemos que el ID del jugador viene en la URL
  const { missionIds } = req.body; // El frontend enviará los IDs de las misiones a reclamar

  if (!missionIds || !Array.isArray(missionIds) || missionIds.length === 0) {
    return res.status(400).json({ message: 'Se requiere un array de IDs de misiones.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener las misiones que se quieren reclamar y verificar su estado
    const missionsQuery = `
      SELECT pm.id, m.reward_points
      FROM player_missions pm
      JOIN missions m ON pm.mission_id = m.id
      WHERE pm.player_id = $1 AND pm.id = ANY($2::bigint[]) AND pm.status = 'completada'
    `;
    const { rows: missionsToClaim } = await client.query(missionsQuery, [playerId, missionIds]);

    if (missionsToClaim.length === 0) {
      return res.status(400).json({ message: 'Ninguna de las misiones seleccionadas es válida para reclamar.' });
    }

    // 2. Calcular el total de puntos a otorgar
    const totalPointsToAdd = missionsToClaim.reduce((sum, mission) => sum + mission.reward_points, 0);

    // 3. Actualizar el estado de las misiones a 'reclamada'
    const missionIdsToUpdate = missionsToClaim.map(m => m.id);
    const updateMissionsQuery = `UPDATE player_missions SET status = 'reclamada' WHERE id = ANY($1::bigint[])`;
    await client.query(updateMissionsQuery, [missionIdsToUpdate]);

    // 4. Añadir los puntos al jugador
    const updatePlayerQuery = `UPDATE players SET legend_points = legend_points + $1 WHERE id = $2 RETURNING legend_points`;
    const { rows: updatedPlayer } = await client.query(updatePlayerQuery, [totalPointsToAdd, playerId]);

    await client.query('COMMIT');
    res.status(200).json({
      message: `${totalPointsToAdd} puntos reclamados exitosamente.`,
      newLegendPoints: updatedPlayer[0].legend_points
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error); // Pasamos el error al manejador central
  } finally {
    client.release();
  }
};

/**
 * Compra un ítem de la tienda.
 */
exports.buyStoreItem = async (req, res, next) => {
  const { playerId } = req.params;
  const { itemId } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Obtener los datos del jugador (puntos) y del ítem (costo)
    const playerQuery = 'SELECT legend_points FROM players WHERE id = $1 FOR UPDATE'; // FOR UPDATE bloquea la fila para evitar concurrencia
    const itemQuery = 'SELECT cost_points FROM store_items WHERE id = $1';
    const [playerRes, itemRes] = await Promise.all([
      client.query(playerQuery, [playerId]),
      client.query(itemQuery, [itemId])
    ]);

    if (playerRes.rows.length === 0) return res.status(404).json({ message: 'Jugador no encontrado.' });
    if (itemRes.rows.length === 0) return res.status(404).json({ message: 'Ítem no encontrado.' });

    const playerPoints = playerRes.rows[0].legend_points;
    const itemCost = itemRes.rows[0].cost_points;

    // 2. Verificar si el jugador tiene suficientes puntos
    if (playerPoints < itemCost) {
      return res.status(400).json({ message: 'Puntos de leyenda insuficientes.' });
    }

    // 3. Restar los puntos al jugador
    const newPoints = playerPoints - itemCost;
    const updatePlayerQuery = 'UPDATE players SET legend_points = $1 WHERE id = $2';
    await client.query(updatePlayerQuery, [newPoints, playerId]);

    // 4. Añadir el ítem al inventario del jugador
    const insertInventoryQuery = 'INSERT INTO player_inventory (player_id, item_id) VALUES ($1, $2)';
    await client.query(insertInventoryQuery, [playerId, itemId]);

    await client.query('COMMIT');
    res.status(200).json({
      message: '¡Compra realizada con éxito!',
      newLegendPoints: newPoints
    });

  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') { // Código de error para violación de constraint UNIQUE
      return res.status(409).json({ message: 'Ya posees este ítem.' });
    }
    next(error);
  } finally {
    client.release();
  }
};