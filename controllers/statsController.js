// controllers/statsController.js
const pool = require('../config/db');

/**
 * Obtiene la clasificación general de todos los jugadores.
 */
exports.getClasificacion = async (req, res) => {
  try {
    // Esta consulta calcula el porcentaje de victorias directamente en la base de datos.
    // Usamos CASE para evitar la división por cero si un jugador no ha jugado partidos.
    const query = `
      SELECT
        id,
        nickname,
        avatar_type,
        avatar_value,
        total_games_played,
        total_wins,
        total_losses,
        total_goals,
        total_assists,
        legend_points,
        CASE
          WHEN total_games_played > 0 THEN ROUND((total_wins::DECIMAL / total_games_played) * 100, 2)
          ELSE 0
        END AS win_percentage
      FROM players
      ORDER BY win_percentage DESC, total_wins DESC, total_goals DESC;
    `;

    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener la clasificación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene los detalles completos y el historial de un jugador específico.
 */
exports.getPlayerDetails = async (req, res) => {
  const { id } = req.params;
  try {
    // Primera consulta: obtener los datos principales del jugador
    const playerQuery = 'SELECT * FROM players WHERE id = $1';
    const playerResult = await pool.query(playerQuery, [id]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado.' });
    }
    
    // Segunda consulta: obtener su historial de estadísticas diarias para el gráfico
    const historyQuery = `
      SELECT session_date, games_won, games_lost, goals, assists, performance_score, is_mvp
      FROM daily_stats
      WHERE player_id = $1
      ORDER BY session_date ASC;
    `;
    const historyResult = await pool.query(historyQuery, [id]);

    // Combinamos los resultados en un solo objeto de respuesta
    const response = {
      profile: playerResult.rows[0],
      history: historyResult.rows,
      // TODO: Aquí irá la lógica de logros y misiones en sprints futuros
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener los detalles del jugador:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};