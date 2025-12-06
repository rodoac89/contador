const { Pool } = require('pg');
const cors = require('cors');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar base de datos
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

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
};

const database = {
  getAllPlayers: () => pool.query('SELECT * FROM players ORDER BY created_at').then(result => result.rows),
  addPlayer: (id, name) => pool.query('INSERT INTO players (id, name) VALUES ($1, $2) RETURNING *', [id, name]).then(result => result.rows[0]),
  deletePlayer: async (id) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM match_scores WHERE player_id = $1', [id]);
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
  addMatch: (id) => pool.query('INSERT INTO matches (id) VALUES ($1) RETURNING *', [id]).then(result => result.rows[0]),
  deleteMatch: (id) => pool.query('DELETE FROM matches WHERE id = $1', [id]).then(result => ({ deleted: result.rowCount })),
  getAllMatches: () => pool.query('SELECT * FROM matches ORDER BY created_at').then(result => result.rows),
  getAllMatchScores: () => pool.query('SELECT * FROM match_scores').then(result => result.rows),
  upsertMatchScore: (matchId, playerId, kills, placement) => {
    return pool.query(`
      INSERT INTO match_scores (match_id, player_id, kills, placement)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (match_id, player_id)
      DO UPDATE SET kills = $3, placement = $4
      RETURNING *
    `, [matchId, playerId, kills, placement]).then(result => result.rows[0]);
  },
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

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    await initDatabase();

    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    
    // Rutas del estado general
    if (path === '/state' && method === 'GET') {
      const [players, matches, scores] = await Promise.all([
        database.getAllPlayers(),
        database.getAllMatches(),
        database.getAllMatchScores()
      ]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ players, matches, scores })
      };
    }

    // Rutas de jugadores
    if (path === '/players' && method === 'POST') {
      const { id, name } = JSON.parse(event.body);
      const player = await database.addPlayer(id, name);
      
      const matches = await database.getAllMatches();
      if (matches.length > 0) {
        await database.addMatchScoresForPlayer(id, matches.map(m => m.id));
      }
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(player)
      };
    }

    if (path.startsWith('/players/') && method === 'DELETE') {
      const playerId = path.split('/')[2];
      const result = await database.deletePlayer(playerId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Rutas de partidas
    if (path === '/matches' && method === 'POST') {
      const { id } = JSON.parse(event.body);
      const match = await database.addMatch(id);
      await database.addMatchScoresForMatch(id);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(match)
      };
    }

    if (path.startsWith('/matches/') && method === 'DELETE') {
      const matchId = path.split('/')[2];
      const result = await database.deleteMatch(matchId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // Ruta de puntuaciones
    if (path === '/match-scores' && method === 'PUT') {
      const { matchId, playerId, kills, placement } = JSON.parse(event.body);
      const result = await database.upsertMatchScore(matchId, playerId, kills, placement);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Ruta no encontrada' })
    };

  } catch (error) {
    console.error('Error en función:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};