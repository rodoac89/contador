const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usar variable de entorno o ruta por defecto
const dbPath = process.env.DB_PATH || path.join(__dirname, 'pubg-contador.db');
const db = new sqlite3.Database(dbPath);

console.log(`Base de datos SQLite en: ${dbPath}`);

// Crear tablas si no existen
db.serialize(() => {
  // Tabla de jugadores
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de partidas
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de puntuaciones por partida
  db.run(`
    CREATE TABLE IF NOT EXISTS match_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      kills INTEGER DEFAULT 0,
      placement TEXT DEFAULT 'none',
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(match_id, player_id)
    )
  `);
});

// Funciones de base de datos
const database = {
  // Jugadores
  getAllPlayers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM players ORDER BY created_at', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  addPlayer: (id, name) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO players (id, name) VALUES (?, ?)', [id, name], function(err) {
        if (err) reject(err);
        else resolve({ id, name });
      });
    });
  },

  deletePlayer: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  },

  // Partidas
  getAllMatches: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM matches ORDER BY created_at', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  deletePlayer: (id) => {
    return new Promise((resolve, reject) => {
      // Primero eliminar los scores del jugador
      db.run('DELETE FROM match_scores WHERE player_id = ?', [id], (err) => {
        if (err) {
          reject(err);
        } else {
          // Luego eliminar el jugador
          db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes });
          });
        }
      });
    });
  },

  addMatch: (id) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO matches (id) VALUES (?)', [id], function(err) {
        if (err) reject(err);
        else resolve({ id });
      });
    });
  },

  deleteMatch: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM matches WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  },

  // Puntuaciones
  getMatchScores: (matchId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM match_scores WHERE match_id = ?',
        [matchId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getAllMatchScores: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM match_scores', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  upsertMatchScore: (matchId, playerId, kills, placement) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO match_scores (match_id, player_id, kills, placement)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(match_id, player_id)
         DO UPDATE SET kills = ?, placement = ?`,
        [matchId, playerId, kills, placement, kills, placement],
        function(err) {
          if (err) reject(err);
          else resolve({ matchId, playerId, kills, placement });
        }
      );
    });
  },

  addMatchScoresForPlayer: (playerId, matchIds) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO match_scores (match_id, player_id, kills, placement) VALUES (?, ?, 0, "none")'
      );

      matchIds.forEach(matchId => {
        stmt.run(matchId, playerId);
      });

      stmt.finalize(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  addMatchScoresForAllPlayers: (matchId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const players = await database.getAllPlayers();
        const stmt = db.prepare(
          'INSERT OR IGNORE INTO match_scores (match_id, player_id, kills, placement) VALUES (?, ?, 0, "none")'
        );

        players.forEach(player => {
          stmt.run(matchId, player.id);
        });

        stmt.finalize(err => {
          if (err) reject(err);
          else resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = database;
