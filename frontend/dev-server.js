const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'dev-database.db');
const db = new Database(dbPath);

// Create tables if they don't exist
const initializeTables = () => {
  // Players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      totalPoints INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Match scores table
  db.exec(`
    CREATE TABLE IF NOT EXISTS match_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      kills INTEGER DEFAULT 0,
      placement TEXT DEFAULT 'none',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      UNIQUE(match_id, player_id)
    )
  `);

  console.log('Database tables initialized successfully');
};

initializeTables();

// API Routes

// Get all players
app.get('/api/players', (req, res) => {
  try {
    const players = db.prepare('SELECT * FROM players ORDER BY totalPoints DESC').all();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new player
app.post('/api/players', (req, res) => {
  try {
    const { id, name } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }

    const stmt = db.prepare('INSERT INTO players (id, name) VALUES (?, ?)');
    const result = stmt.run(id, name);
    
    const newPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('Error creating player:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Player with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update a player
app.put('/api/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, totalPoints } = req.body;
    
    const stmt = db.prepare(`
      UPDATE players 
      SET name = COALESCE(?, name), 
          totalPoints = COALESCE(?, totalPoints),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(name, totalPoints, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a player
app.delete('/api/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Start transaction
    const deleteTransaction = db.transaction(() => {
      // Delete related match scores first
      db.prepare('DELETE FROM match_scores WHERE player_id = ?').run(id);
      // Then delete the player
      const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);
      return result;
    });
    
    const result = deleteTransaction();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all matches
app.get('/api/matches', (req, res) => {
  try {
    // Get matches first
    const matches = db.prepare(`
      SELECT id, created_at, updated_at
      FROM matches
      ORDER BY created_at DESC
    `).all();
    
    // Get match scores separately
    const matchScores = db.prepare(`
      SELECT match_id, player_id, kills, placement
      FROM match_scores
    `).all();
    
    // Group scores by match_id
    const scoresByMatch = matchScores.reduce((acc, score) => {
      if (!acc[score.match_id]) {
        acc[score.match_id] = {};
      }
      acc[score.match_id][score.player_id] = {
        kills: score.kills,
        placement: score.placement
      };
      return acc;
    }, {});
    
    // Combine matches with their scores
    const parsedMatches = matches.map(match => ({
      id: match.id,
      created_at: match.created_at,
      updated_at: match.updated_at,
      playerScores: scoresByMatch[match.id] || {}
    }));
    
    res.json(parsedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new match
app.post('/api/matches', (req, res) => {
  try {
    const { id, playerScores } = req.body;
    
    if (!id || !playerScores) {
      return res.status(400).json({ error: 'ID and playerScores are required' });
    }

    const createMatchTransaction = db.transaction(() => {
      // Create match
      const matchStmt = db.prepare('INSERT INTO matches (id) VALUES (?)');
      matchStmt.run(id);
      
      // Create match scores
      const scoreStmt = db.prepare(`
        INSERT INTO match_scores (match_id, player_id, kills, placement) 
        VALUES (?, ?, ?, ?)
      `);
      
      for (const [playerId, score] of Object.entries(playerScores)) {
        scoreStmt.run(id, playerId, score.kills, score.placement);
      }
      
      // Update player total points
      const updatePlayerStmt = db.prepare(`
        UPDATE players 
        SET totalPoints = (
          SELECT COALESCE(SUM(
            kills + 
            CASE placement
              WHEN 'winner' THEN 3
              WHEN 'second' THEN 1
              ELSE 0
            END
          ), 0)
          FROM match_scores 
          WHERE player_id = players.id
        ),
        updated_at = CURRENT_TIMESTAMP
      `);
      
      updatePlayerStmt.run();
    });
    
    createMatchTransaction();
    
    // Fetch the created match
    const newMatch = db.prepare(`
      SELECT id, created_at, updated_at
      FROM matches
      WHERE id = ?
    `).get(id);
    
    // Get match scores for this match
    const matchScores = db.prepare(`
      SELECT player_id, kills, placement
      FROM match_scores
      WHERE match_id = ?
    `).all(id);
    
    const parsedMatch = {
      id: newMatch.id,
      created_at: newMatch.created_at,
      updated_at: newMatch.updated_at,
      playerScores: matchScores.reduce((acc, score) => {
        acc[score.player_id] = {
          kills: score.kills,
          placement: score.placement
        };
        return acc;
      }, {})
    };
    
    res.status(201).json(parsedMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Match with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete a match
app.delete('/api/matches/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteMatchTransaction = db.transaction(() => {
      // Delete match scores first
      db.prepare('DELETE FROM match_scores WHERE match_id = ?').run(id);
      // Delete the match
      const result = db.prepare('DELETE FROM matches WHERE id = ?').run(id);
      
      // Recalculate player points
      const updatePlayerStmt = db.prepare(`
        UPDATE players 
        SET totalPoints = (
          SELECT COALESCE(SUM(
            kills + 
            CASE placement
              WHEN 'winner' THEN 3
              WHEN 'second' THEN 1
              ELSE 0
            END
          ), 0)
          FROM match_scores 
          WHERE player_id = players.id
        ),
        updated_at = CURRENT_TIMESTAMP
      `);
      
      updatePlayerStmt.run();
      
      return result;
    });
    
    const result = deleteMatchTransaction();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected' 
  });
});

// Graceful shutdown - Comentado temporalmente para debugging
// process.on('SIGINT', () => {
//   console.log('\nShutting down gracefully...');
//   db.close();
//   process.exit(0);
// });

app.listen(PORT, () => {
  console.log(`SQLite Development Server running on http://localhost:${PORT}`);
  console.log(`Database file: ${dbPath}`);
});