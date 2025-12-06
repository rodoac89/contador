const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('Conectando a PostgreSQL...');

// Crear tablas si no existen
const initDatabase = async () => {
  try {
    // Tabla de jugadores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de partidas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de puntuaciones por partida
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_scores (
        match_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        kills INTEGER DEFAULT 0,
        placement TEXT DEFAULT 'none',
        PRIMARY KEY (match_id, player_id),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
      )
    `);

    console.log('Tablas de PostgreSQL creadas/verificadas correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos PostgreSQL:', error);
  }
};

// Ejecutar inicialización
initDatabase();

const database = {
  // Obtener todos los jugadores
  getAllPlayers: () => {
    return pool.query('SELECT * FROM players ORDER BY created_at').then(result => result.rows);
  },

  // Agregar jugador
  addPlayer: (id, name) => {
    return pool.query('INSERT INTO players (id, name) VALUES ($1, $2) RETURNING *', [id, name])
      .then(result => result.rows[0]);
  },

  // Eliminar jugador
  deletePlayer: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Eliminar scores del jugador
      await client.query('DELETE FROM match_scores WHERE player_id = $1', [id]);
      // Eliminar jugador
      const result = await client.query('DELETE FROM players WHERE id = $1', [id]);
      await client.query('COMMIT');
      return { deleted: result.rowCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Agregar partida
  addMatch: (id) => {
    return pool.query('INSERT INTO matches (id) VALUES ($1) RETURNING *', [id])
      .then(result => result.rows[0]);
  },

  // Eliminar partida
  deleteMatch: (id) => {
    return pool.query('DELETE FROM matches WHERE id = $1', [id])
      .then(result => ({ deleted: result.rowCount }));
  },

  // Obtener todas las partidas
  getAllMatches: () => {
    return pool.query('SELECT * FROM matches ORDER BY created_at').then(result => result.rows);
  },

  // Obtener todas las puntuaciones
  getAllMatchScores: () => {
    return pool.query('SELECT * FROM match_scores').then(result => result.rows);
  },

  // Actualizar puntuación de partida
  upsertMatchScore: (matchId, playerId, kills, placement) => {
    return pool.query(`
      INSERT INTO match_scores (match_id, player_id, kills, placement)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (match_id, player_id)
      DO UPDATE SET kills = $3, placement = $4
      RETURNING *
    `, [matchId, playerId, kills, placement])
      .then(result => result.rows[0]);
  },

  // Agregar puntuaciones para un nuevo jugador en todas las partidas existentes
  addMatchScoresForPlayer: async (playerId, matchIds) => {
    const client = await pool.connect();
    try {
      for (const matchId of matchIds) {
        await client.query(
          'INSERT INTO match_scores (match_id, player_id, kills, placement) VALUES ($1, $2, 0, $3) ON CONFLICT DO NOTHING',
          [matchId, playerId, 'none']
        );
      }
    } finally {
      client.release();
    }
  },

  // Agregar puntuaciones para todos los jugadores en una nueva partida
  addMatchScoresForMatch: async (matchId) => {
    const players = await database.getAllPlayers();
    const client = await pool.connect();
    try {
      for (const player of players) {
        await client.query(
          'INSERT INTO match_scores (match_id, player_id, kills, placement) VALUES ($1, $2, 0, $3) ON CONFLICT DO NOTHING',
          [matchId, player.id, 'none']
        );
      }
    } finally {
      client.release();
    }
  }
};

module.exports = database;