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
 * Obtiene los detalles COMPLETOS de un jugador, incluyendo perfil, historial y desafíos.
 */
exports.getPlayerDetails = async (req, res, next) => { // Añadimos 'next' para el manejo de errores
  const { id } = req.params;
  try {
    // Usamos Promise.all para ejecutar todas las consultas en paralelo, ¡mucho más rápido!
    const [playerRes, historyRes, achievementsRes] = await Promise.all([
      pool.query('SELECT * FROM players WHERE id = $1', [id]),
      pool.query('SELECT session_date, games_won, games_lost, goals, assists, performance_score, is_mvp FROM daily_stats WHERE player_id = $1 ORDER BY session_date ASC', [id]),
      pool.query('SELECT a.name, a.description, a.icon FROM player_achievements pa JOIN achievements a ON pa.achievement_id = a.id WHERE pa.player_id = $1', [id]),
      // NOTA: Las misiones son más complejas de unificar aquí porque son diarias.
      // Por ahora, las dejaremos en un endpoint separado o las podríamos añadir si es necesario.
      // Por simplicidad del Sprint 3, nos enfocaremos en los logros.
    ]);

    if (playerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Jugador no encontrado.' });
    }
    
    const response = {
      profile: playerRes.rows[0],
      history: historyRes.rows,
      achievements: achievementsRes.rows // ¡Ahora los logros vienen incluidos!
    };

    res.status(200).json(response);
  } catch (error) {
    // Usamos el manejador de errores central que ya tenemos
    console.error('Error al obtener los detalles del jugador:', error);
    // En el futuro, podríamos usar next(error) si implementamos un middleware de errores
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene los datos agregados para la página de portada.
 */
exports.getHomePageData = async (req, res, next) => {
  try {
    // 1. Encontrar la fecha de la última jornada registrada
    const lastSessionDateQuery = 'SELECT MAX(session_date) as last_date FROM daily_stats';
    const { rows: lastDateRows } = await pool.query(lastSessionDateQuery);

    if (lastDateRows.length === 0 || !lastDateRows[0].last_date) {
      // Si no hay datos, devolver una respuesta predeterminada
      return res.status(200).json({
        mvp: null,
        top3: [],
        funFact: "¡Registra tu primera jornada para empezar a ver estadísticas!"
      });
    }
    const lastDate = lastDateRows[0].last_date;

    // 2. Obtener el MVP de esa última jornada
    const mvpQuery = `
      SELECT p.id, p.nickname, p.avatar_type, p.avatar_value, ds.goals, ds.assists, ds.games_won, ds.games_lost
      FROM daily_stats ds
      JOIN players p ON ds.player_id = p.id
      WHERE ds.session_date = $1 AND ds.is_mvp = TRUE
      LIMIT 1;
    `;
    const { rows: mvpRows } = await pool.query(mvpQuery, [lastDate]);

    // 3. Obtener el Top 3 de la clasificación general (usamos la misma lógica que en getClasificacion)
    const top3Query = `
      SELECT id, nickname, avatar_type, avatar_value,
        CASE
          WHEN total_games_played > 0 THEN ROUND((total_wins::DECIMAL / total_games_played) * 100, 2)
          ELSE 0
        END AS win_percentage
      FROM players
      ORDER BY win_percentage DESC, total_wins DESC
      LIMIT 3;
    `;
    const { rows: top3Rows } = await pool.query(top3Query);

    // 4. Generar un "Dato Curioso" (Fun Fact) - Lógica simple por ahora
    const funFact = `Con ${mvpRows[0]?.goals || 0} goles, ¡${mvpRows[0]?.nickname || 'nadie'} fue imparable en la última jornada!`;
    
    res.status(200).json({
      mvp: mvpRows.length > 0 ? mvpRows[0] : null,
      top3: top3Rows,
      funFact: funFact
    });

  } catch (error) {
    next(error);
  }
};