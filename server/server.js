const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./database-postgres');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos de Angular en producción
if (isProduction) {
  const distPath = path.join(__dirname, '../dist/contador/browser');
  app.use(express.static(distPath));
}

// Rutas de Jugadores
app.get('/api/players', async (req, res) => {
  try {
    const players = await database.getAllPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { id, name } = req.body;
    const player = await database.addPlayer(id, name);
    
    // Agregar puntuaciones para el nuevo jugador en todas las partidas existentes
    const matches = await database.getAllMatches();
    if (matches.length > 0) {
      await database.addMatchScoresForPlayer(id, matches.map(m => m.id));
    }
    
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const result = await database.deletePlayer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas de Partidas
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await database.getAllMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const { id } = req.body;
    const match = await database.addMatch(id);
    
    // Crear puntuaciones iniciales para todos los jugadores
    await database.addMatchScoresForAllPlayers(id);
    
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  try {
    const result = await database.deleteMatch(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas de Puntuaciones
app.get('/api/match-scores', async (req, res) => {
  try {
    const scores = await database.getAllMatchScores();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/match-scores/:matchId', async (req, res) => {
  try {
    const scores = await database.getMatchScores(req.params.matchId);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/match-scores', async (req, res) => {
  try {
    const { matchId, playerId, kills, placement } = req.body;
    const score = await database.upsertMatchScore(matchId, playerId, kills, placement);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de estado
app.get('/api/state', async (req, res) => {
  try {
    const players = await database.getAllPlayers();
    const matches = await database.getAllMatches();
    const scores = await database.getAllMatchScores();
    
    res.json({ players, matches, scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// En producción, servir el index.html de Angular para todas las rutas no API
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/contador/browser/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Modo: ${isProduction ? 'Producción' : 'Desarrollo'}`);
});
