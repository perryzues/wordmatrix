// backend/server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { Pool } = require('pg');
const crypto = require('crypto');
const { calculateScore, validateWord } = require('./scoring');
const { loadDictionary } = require('./dictionary');

const app = express();
const httpServer = createServer(app);

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Initialize PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Load dictionary on startup
let dictionary;
(async () => {
  dictionary = await loadDictionary();
  console.log(`Dictionary loaded with ${dictionary.size} words`);
})();

// Helper functions
const generateRoomId = () => crypto.randomBytes(3).toString('hex').toUpperCase();
const generateHostCode = () => crypto.randomBytes(6).toString('hex').toUpperCase();
const sanitizeUsername = (username) => username.trim().substring(0, 50).replace(/[<>]/g, '');
const generateLetters = (count = 4) => {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const letters = [];
  
  // Ensure at least one vowel
  letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  
  for (let i = 1; i < count; i++) {
    const useVowel = Math.random() > 0.6;
    const pool = useVowel ? vowels : consonants;
    letters.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  
  return letters.sort(() => Math.random() - 0.5);
};

// REST Endpoints
app.get('/', (req, res) => {
  res.json({ status: 'Word Matrix Server Running', version: '1.0.0' });
});

app.post('/api/createRoom', async (req, res) => {
  try {
    const roomId = generateRoomId();
    const hostCode = generateHostCode();
    
    await pool.query(
      'INSERT INTO rooms (id, host_code, rounds, round_duration) VALUES ($1, $2, $3, $4)',
      [roomId, hostCode, 10, 15]
    );
    
    await redis.hset(`room:${roomId}`, 'hostCode', hostCode, 'rounds', 10, 'roundDuration', 15, 'currentRound', 0);
    
    res.json({ roomId, hostCode });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/room/:id', async (req, res) => {
  try {
    const roomData = await redis.hgetall(`room:${req.params.id}`);
    if (!roomData || !roomData.hostCode) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ exists: true, rounds: roomData.rounds, roundDuration: roomData.roundDuration });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  let currentRoom = null;
  let username = null;
  
  socket.on('joinRoom', async ({ roomId, username: rawUsername }) => {
    try {
      username = sanitizeUsername(rawUsername);
      if (!username) {
        return socket.emit('error', { code: 'INVALID_USERNAME', message: 'Invalid username' });
      }
      
      const roomExists = await redis.exists(`room:${roomId}`);
      if (!roomExists) {
        return socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room does not exist' });
      }
      
      currentRoom = roomId;
      socket.join(roomId);
      
      await redis.hset(`room:${roomId}:players`, socket.id, JSON.stringify({
        username,
        totalPoints: 0,
        lastWord: '',
        lastRoundPoints: 0,
        joinedAt: Date.now()
      }));
      
      const playersData = await redis.hgetall(`room:${roomId}:players`);
      const players = Object.values(playersData).map(p => JSON.parse(p));
      
      io.to(roomId).emit('roomJoined', { players, socketId: socket.id });
      console.log(`${username} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join room' });
    }
  });
  
  socket.on('hostSettings', async ({ rounds, roundDuration, hostCode }) => {
    try {
      if (!currentRoom) return;
      
      const storedHostCode = await redis.hget(`room:${currentRoom}`, 'hostCode');
      if (storedHostCode !== hostCode) {
        return socket.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid host code' });
      }
      
      await redis.hset(`room:${currentRoom}`, 'rounds', rounds, 'roundDuration', roundDuration);
      io.to(currentRoom).emit('settingsUpdated', { rounds, roundDuration });
      
    } catch (error) {
      console.error('Settings error:', error);
    }
  });
  
  socket.on('startGame', async ({ hostCode }) => {
    try {
      if (!currentRoom) return;
      
      const storedHostCode = await redis.hget(`room:${currentRoom}`, 'hostCode');
      if (storedHostCode !== hostCode) {
        return socket.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid host code' });
      }
      
      await redis.hset(`room:${currentRoom}`, 'currentRound', 1, 'gameStarted', Date.now());
      startRound(currentRoom, 1);
      
    } catch (error) {
      console.error('Start game error:', error);
    }
  });
  
  socket.on('submitWord', async ({ word }) => {
    try {
      if (!currentRoom || !username) return;
      
      const submissionTime = Date.now();
      const currentRound = await redis.hget(`room:${currentRoom}`, 'currentRound');
      const roundStartTime = await redis.hget(`room:${currentRoom}`, `round:${currentRound}:startTime`);
      
      if (!roundStartTime) return;
      
      const alreadySubmitted = await redis.hexists(`room:${currentRoom}:round:${currentRound}:submissions`, socket.id);
      if (alreadySubmitted) {
        return socket.emit('error', { code: 'ALREADY_SUBMITTED', message: 'Already submitted for this round' });
      }
      
      await redis.hset(`room:${currentRoom}:round:${currentRound}:submissions`, socket.id, JSON.stringify({
        word: word.toLowerCase().trim(),
        submissionTime,
        username
      }));
      
      socket.emit('submissionReceived', { word });
      
    } catch (error) {
      console.error('Submit error:', error);
    }
  });
  
  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (currentRoom) {
      await redis.hdel(`room:${currentRoom}:players`, socket.id);
      const playersData = await redis.hgetall(`room:${currentRoom}:players`);
      const players = Object.values(playersData).map(p => JSON.parse(p));
      io.to(currentRoom).emit('playerLeft', { socketId: socket.id, players });
    }
  });
});

// Game round logic
async function startRound(roomId, roundNumber) {
  try {
    const roomData = await redis.hgetall(`room:${roomId}`);
    const roundDuration = parseInt(roomData.roundDuration) || 15;
    const totalRounds = parseInt(roomData.rounds) || 10;
    
    const letters = generateLetters(4);
    const startTime = Date.now();
    
    await redis.hset(`room:${roomId}`, `round:${roundNumber}:startTime`, startTime);
    await redis.hset(`room:${roomId}`, `round:${roundNumber}:letters`, JSON.stringify(letters));
    await redis.del(`room:${roomId}:round:${roundNumber}:submissions`);
    
    io.to(roomId).emit('newRound', {
      letters,
      roundNumber,
      totalRounds,
      roundDuration,
      serverStartTime: startTime
    });
    
    setTimeout(() => endRound(roomId, roundNumber, letters, roundDuration, totalRounds), roundDuration * 1000 + 2000);
    
  } catch (error) {
    console.error('Start round error:', error);
  }
}

async function endRound(roomId, roundNumber, letters, roundDuration, totalRounds) {
  try {
    io.to(roomId).emit('scoringInProgress');
    
    const submissions = await redis.hgetall(`room:${roomId}:round:${roundNumber}:submissions`);
    const playersData = await redis.hgetall(`room:${roomId}:players`);
    
    const results = [];
    const wordCounts = {};
    const wordFirstSubmitters = {};
    
    // Count duplicates and find first submitters
    for (const [socketId, dataStr] of Object.entries(submissions)) {
      const data = JSON.parse(dataStr);
      const normalizedWord = data.word.toLowerCase().trim();
      
      if (!wordCounts[normalizedWord]) {
        wordCounts[normalizedWord] = 0;
        wordFirstSubmitters[normalizedWord] = { socketId, submissionTime: data.submissionTime };
      } else {
        if (data.submissionTime < wordFirstSubmitters[normalizedWord].submissionTime) {
          wordFirstSubmitters[normalizedWord] = { socketId, submissionTime: data.submissionTime };
        }
      }
      wordCounts[normalizedWord]++;
    }
    
    let bestWord = null;
    let bestPoints = 0;
    
    for (const [socketId, dataStr] of Object.entries(submissions)) {
      const data = JSON.parse(dataStr);
      const player = JSON.parse(playersData[socketId]);
      
      const isDuplicate = wordCounts[data.word] > 1;
      const isFirstDuplicate = isDuplicate && wordFirstSubmitters[data.word].socketId === socketId;
      
      const roundStartTime = await redis.hget(`room:${roomId}`, `round:${roundNumber}:startTime`);
      const timeElapsed = (data.submissionTime - parseInt(roundStartTime)) / 1000;
      
      const scoreResult = calculateScore({
        word: data.word,
        letters,
        dictionary,
        timeElapsed,
        totalTime: roundDuration,
        isDuplicate,
        isFirstDuplicate
      });
      
      player.totalPoints += scoreResult.roundPoints;
      player.lastWord = data.word;
      player.lastRoundPoints = scoreResult.roundPoints;
      
      await redis.hset(`room:${roomId}:players`, socketId, JSON.stringify(player));
      
      results.push({
        socketId,
        username: player.username,
        submittedWord: data.word,
        roundPoints: scoreResult.roundPoints,
        isValid: scoreResult.isValid,
        isDuplicate,
        isFirstDuplicate
      });
      
      if (scoreResult.roundPoints > bestPoints) {
        bestPoints = scoreResult.roundPoints;
        bestWord = { word: data.word, username: player.username, roundPoints: scoreResult.roundPoints };
      }
    }
    
    // Get top 10 leaderboard
    const allPlayers = Object.entries(playersData).map(([socketId, dataStr]) => {
      const p = JSON.parse(dataStr);
      return { socketId, ...p };
    });
    
    allPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
    const top10 = allPlayers.slice(0, 10).map((p, idx) => ({
      rank: idx + 1,
      username: p.username,
      totalPoints: p.totalPoints,
      lastWord: p.lastWord,
      lastRoundPoints: p.lastRoundPoints
    }));
    
    io.to(roomId).emit('roundResults', { results, bestWord });
    io.to(roomId).emit('leaderboardUpdate', { top10, bestWord });
    
    // Start next round or end game
    if (roundNumber < totalRounds) {
      await redis.hset(`room:${roomId}`, 'currentRound', roundNumber + 1);
      setTimeout(() => startRound(roomId, roundNumber + 1), 3000);
    } else {
      io.to(roomId).emit('gameOver', { finalTop10: top10 });
      
      // Save to database
      for (const player of allPlayers) {
        await pool.query(
          'INSERT INTO game_results (room_id, username, total_points, rounds_played) VALUES ($1, $2, $3, $4)',
          [roomId, player.username, player.totalPoints, totalRounds]
        );
      }
    }
    
  } catch (error) {
    console.error('End round error:', error);
  }
}

// Start server
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`Word Matrix server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});