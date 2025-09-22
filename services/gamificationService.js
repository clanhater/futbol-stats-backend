// services/gamificationService.js
const pool = require('../config/db');

/**
 * Procesa los logros para un jugador después de una jornada.
 * @param {object} client - El cliente de la transacción de la base de datos.
 * @param {number} playerId - El ID del jugador.
 */
async function processAchievements(client, playerId) {
  // 1. Obtener los stats actualizados del jugador
  const statsQuery = 'SELECT total_goals, total_wins, total_games_played, CASE WHEN total_games_played > 0 THEN (total_wins::DECIMAL / total_games_played) * 100 ELSE 0 END AS win_percentage FROM players WHERE id = $1';
  const statsResult = await client.query(statsQuery, [playerId]);
  const playerStats = statsResult.rows[0];

  // 2. Obtener los IDs de los logros que el jugador YA tiene
  const unlockedQuery = 'SELECT achievement_id FROM player_achievements WHERE player_id = $1';
  const unlockedResult = await client.query(unlockedQuery, [playerId]);
  const unlockedIds = unlockedResult.rows.map(r => r.achievement_id);

  // 3. Obtener todos los logros posibles que el jugador AÚN NO ha desbloqueado
  let achievementsToTestQuery;
  let queryParams = [];
  
  // --- AQUÍ ESTÁ LA CORRECCIÓN CLAVE ---
  if (unlockedIds.length > 0) {
    // Si el jugador ya tiene logros, los excluimos de la búsqueda.
    // Usamos ANY($1::bigint[]) que es la forma correcta en PostgreSQL de pasar un array.
    achievementsToTestQuery = `SELECT * FROM achievements WHERE id != ALL($1::bigint[])`;
    queryParams.push(unlockedIds);
  } else {
    // Si el jugador no tiene ningún logro, simplemente los obtenemos todos.
    achievementsToTestQuery = `SELECT * FROM achievements`;
  }

  const achievementsResult = await client.query(achievementsToTestQuery, queryParams);
  const achievementsToTest = achievementsResult.rows;

  // 4. Comprobar si se cumple la condición para algún logro nuevo
  for (const achievement of achievementsToTest) {
    let conditionMet = false;
    // La lógica de comprobación sigue siendo la misma
    if (achievement.category === 'carrera' && playerStats[achievement.condition_field] >= achievement.condition_value) {
      conditionMet = true;
    } else if (achievement.category === 'hazaña' && achievement.condition_field === 'win_percentage' && playerStats.total_games_played >= 20 && playerStats.win_percentage >= achievement.condition_value) {
      conditionMet = true;
    }

    if (conditionMet) {
      // Si se cumple, insertar el nuevo logro en la tabla del jugador
      const insertQuery = 'INSERT INTO player_achievements (player_id, achievement_id) VALUES ($1, $2) ON CONFLICT (player_id, achievement_id) DO NOTHING';
      await client.query(insertQuery, [playerId, achievement.id]);
      console.log(`¡Jugador ${playerId} desbloqueó el logro "${achievement.name}"!`);
    }
  }
}

/**
 * Procesa las misiones para un jugador. (Versión simplificada)
 * Por ahora, solo completaremos misiones diarias.
 */
async function processMissions(client, playerId, dailyData) {
    const missionsQuery = `SELECT * FROM missions WHERE type = 'diaria'`;
    const missionsResult = await client.query(missionsQuery);
    const dailyMissions = missionsResult.rows;

    for (const mission of dailyMissions) {
        let missionCompleted = false;
        if (mission.objective_field === 'wins' && dailyData.wins > dailyData.losses) {
            missionCompleted = true;
        } else if (dailyData[mission.objective_field] >= mission.objective_value) {
            missionCompleted = true;
        }
        
        if (missionCompleted) {
            // Insertar o actualizar la misión del jugador para ese día como 'completada'
            const upsertQuery = `
                INSERT INTO player_missions (player_id, mission_id, assigned_date, progress, status)
                VALUES ($1, $2, $3, $4, 'completada')
                ON CONFLICT (player_id, mission_id, assigned_date)
                DO UPDATE SET status = 'completada';
            `;
            await client.query(upsertQuery, [playerId, mission.id, dailyData.date, mission.objective_value]);
            console.log(`¡Jugador ${playerId} completó la misión diaria "${mission.name}"!`);
        }
    }
}


module.exports = {
  processAchievements,
  processMissions,
};