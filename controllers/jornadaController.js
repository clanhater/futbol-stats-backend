// controllers/jornadaController.js
const pool = require('../config/db');
const { processAchievements, processMissions } = require('../services/gamificationService');

exports.registrarJornada = async (req, res) => {
  const { date, stats } = req.body; // stats es un array: [{ player_id, wins, losses, goals, assists }, ...]

  // Usamos una transacción para asegurar que todas las operaciones se completen o ninguna lo haga
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciar transacción

    let mvp = { player_id: null, score: -1 };

    // 1. Insertar las estadísticas diarias y actualizar los totales de cada jugador
    for (const playerStat of stats) {
      const { player_id, wins, losses, goals, assists } = playerStat;
      const performanceScore = (wins * 2) + goals + assists - losses;

      // Insertar en daily_stats
      const dailyStatQuery = `
        INSERT INTO daily_stats (player_id, session_date, games_won, games_lost, goals, assists, performance_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(dailyStatQuery, [player_id, date, wins, losses, goals, assists, performanceScore]);

      // Actualizar la tabla players
      const updatePlayerQuery = `
        UPDATE players
        SET
          total_games_played = total_games_played + $1,
          total_wins = total_wins + $2,
          total_losses = total_losses + $3,
          total_goals = total_goals + $4,
          total_assists = total_assists + $5
        WHERE id = $6
      `;
      await client.query(updatePlayerQuery, [wins + losses, wins, losses, goals, assists, player_id]);
	  await processAchievements(client, playerStat.player_id);
      await processMissions(client, playerStat.player_id, { date, ...playerStat });
      
      // Comprobar si es el MVP
      if (performanceScore > mvp.score) {
        mvp = { player_id: player_id, score: performanceScore };
      }
    }

    // 2. Marcar al MVP en la tabla daily_stats
    if (mvp.player_id) {
      const mvpQuery = 'UPDATE daily_stats SET is_mvp = TRUE WHERE player_id = $1 AND session_date = $2';
      await client.query(mvpQuery, [mvp.player_id, date]);
    }

    await client.query('COMMIT'); // Confirmar transacción
    res.status(201).json({ message: 'Jornada registrada y procesada exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK'); // Revertir en caso de error

    // --- ¡AQUÍ ESTÁ LA MEJORA! ---
    // '23505' es el código de error estándar de PostgreSQL para "unique_violation"
    if (error.code === '23505') {
      console.error('Error de duplicado:', error.detail); // Opcional: para tu log
      // El mensaje de 'error.detail' suele ser muy descriptivo, como:
      // "Key (player_id, session_date)=(1, 2025-09-24) already exists."
      return res.status(409).json({ message: `Ya existen estadísticas registradas para esta fecha. Por favor, elige otra fecha.` });
    }
    
    // Si es otro tipo de error, mantenemos el error genérico
    console.error('Error al registrar la jornada:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
};

/**
 * Devuelve el estado de registro para todos los jugadores en una fecha específica.
 */
exports.getJornadaStatus = async (req, res, next) => {
  const { date } = req.params;
  try {
    // Obtenemos todos los jugadores y comprobamos si tienen una entrada en daily_stats para la fecha dada
    const query = `
      SELECT
        p.id as player_id,
        CASE
          WHEN ds.id IS NOT NULL THEN 'registrado'
          ELSE 'pendiente'
        END as status
      FROM players p
      LEFT JOIN daily_stats ds ON p.id = ds.player_id AND ds.session_date = $1;
    `;
    const { rows } = await pool.query(query, [date]);
    res.status(200).json(rows);
  } catch (error) {
    next(error); // Pasa el error al manejador central si tienes uno
  }
};

exports.getAppSettings = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT start_date FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      // Fallback por si la tabla está vacía
      return res.status(404).json({ message: 'No se encontró la configuración de la aplicación.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};