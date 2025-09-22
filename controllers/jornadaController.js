const pool = require('../config/db');
const { processAchievements, processMissions } = require('../services/gamificationService');

exports.registrarJornada = async (req, res, next) => {
  const { date, stats } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let mvp = { player_id: null, score: -1 };

    for (const playerStat of stats) {
      const { player_id, wins, losses, goals, assists } = playerStat;
      const performanceScore = (wins * 2) + goals + assists - losses;

      const dailyStatQuery = `
        INSERT INTO daily_stats (player_id, session_date, games_won, games_lost, goals, assists, performance_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(dailyStatQuery, [player_id, date, wins, losses, goals, assists, performanceScore]);

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
	  
      await processAchievements(client, player_id);
      await processMissions(client, player_id, { date, ...playerStat });
      
      if (performanceScore > mvp.score) {
        mvp = { player_id: player_id, score: performanceScore };
      }
    }

    if (mvp.player_id) {
      const mvpQuery = 'UPDATE daily_stats SET is_mvp = TRUE WHERE player_id = $1 AND session_date = $2';
      await client.query(mvpQuery, [mvp.player_id, date]);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Jornada registrada y procesada exitosamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    
    // --- INICIO DE LA MEJORA ---
    if (error.code === '23505') {
      console.error('Error de duplicado:', error.detail);
      return res.status(409).json({ message: `Ya existen estadísticas para uno de los jugadores en la fecha seleccionada. No se guardó nada.` });
    }
    // --- FIN DE LA MEJORA ---
    
    console.error('Error al registrar la jornada:', error);
    // Pasamos el error al manejador central si tenemos uno
    next(error); 
  } finally {
    client.release();
  }
};

// --- INICIO DE LA NUEVA FUNCIONALIDAD ---
/**
 * Devuelve el estado de registro para todos los jugadores en una fecha específica.
 */
exports.getJornadaStatus = async (req, res, next) => {
  const { date } = req.params;
  try {
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
    next(error);
  }
};

/**
 * Obtiene las configuraciones globales de la aplicación, como la fecha de inicio.
 */
exports.getAppSettings = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT start_date FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró la configuración de la aplicación.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};
// --- FIN DE LA NUEVA FUNCIONALIDAD ---