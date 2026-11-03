const logger = require('./server/utils/logger');

logger.info('Starting Planning Poker server...');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { createGameEngine } = require('./server/gameEngine');
const { createJsonFileAdapter } = require('./server/persistence/jsonFileAdapter');

logger.info('Dependencies loaded successfully');

logger.info('Creating Express app and HTTP server...');
const app = express();
const server = http.createServer(app);

logger.info('Configuring Socket.IO...');
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 15000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 10 * 60 * 1000,
    skipMiddlewares: true
  },
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  serveClient: true,
  allowEIO3: true
});
logger.info('Socket.IO configured successfully');

logger.info('Configuring Express middleware...');
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
const staticPath = path.join(__dirname, 'client/build');
logger.info(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));
logger.info('Express middleware configured successfully');

// Initialize Persistence Adapter and Deep Game Engine
logger.info('Setting up file persistence and Game Engine...');
const persistenceAdapter = createJsonFileAdapter({
  dataDir: path.join(__dirname, 'data'),
  fileName: 'games.json',
  debounceMs: 1000
});
const gameEngine = createGameEngine({
  persistence: persistenceAdapter
});
logger.info(`Initialized Game Engine with ${gameEngine.getActiveGameCount()} games`);

// Track active connections and their game associations
const activeConnections = new Map(); // socketId -> { gameId, playerName, isWatcher, lastSeen, connectedAt, transport }
const connectionHealth = new Map(); // socketId -> { status, lastPing, latency, disconnectCount, reconnectCount, transport }
const connectionMetrics = {
  totalConnections: 0,
  totalDisconnections: 0,
  totalReconnections: 0,
  disconnectReasons: new Map(),
  startTime: new Date()
};

// Save games every 5 minutes
setInterval(() => {
  gameEngine.flushPersistence();
}, 5 * 60 * 1000);

// Performance monitoring every 5 minutes
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  const now = Date.now();
  let unhealthyConnections = 0;
  let highLatencyConnections = 0;
  connectionHealth.forEach((health) => {
    if (now - health.lastPing > 60000) {
      health.status = 'unhealthy';
      unhealthyConnections++;
    }
    if (health.latency > 1000) {
      highLatencyConnections++;
    }
  });

  const uptime = Math.round((Date.now() - connectionMetrics.startTime.getTime()) / 1000 / 60);
  const disconnectReasonsSummary = Array.from(connectionMetrics.disconnectReasons.entries())
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(', ');

  logger.info(`[METRICS] Performance stats: Active games: ${gameEngine.getActiveGameCount()}, Active connections: ${activeConnections.size}, Unhealthy: ${unhealthyConnections}, High latency: ${highLatencyConnections}, Memory: ${memUsageMB.heapUsed}MB/${memUsageMB.heapTotal}MB heap, ${memUsageMB.rss}MB RSS, Uptime: ${uptime}min`);
  logger.info(`[METRICS] Connection stats: Total connections: ${connectionMetrics.totalConnections}, Total disconnections: ${connectionMetrics.totalDisconnections}, Total reconnections: ${connectionMetrics.totalReconnections}`);
  logger.info(`[METRICS] Disconnect reasons: ${disconnectReasonsSummary}`);
}, 5 * 60 * 1000);

// Save games on server shutdown
function handleShutdown() {
  logger.info('Server shutting down, saving games...');
  gameEngine.flushPersistence();
  process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Cleanup stale connections periodically
setInterval(() => {
  const now = new Date();
  const staleThreshold = 3 * 60 * 1000;
  let staleCount = 0;

  activeConnections.forEach((connection, socketId) => {
    if (now - connection.lastSeen > staleThreshold) {
      staleCount++;
      logger.debug(`[CLEANUP] Cleaning up stale connection: ${socketId}, Last seen: ${connection.lastSeen.toISOString()}, Player: ${connection.playerName}, Game: ${connection.gameId}`);
      if (connection.gameId) {
        const result = gameEngine.removePlayer({
          gameId: connection.gameId,
          playerId: socketId
        });
        if (result.ok) {
          if (result.meta.remainingPlayers === 0) {
            logger.debug(`[CLEANUP] Game ${connection.gameId} is now empty, will expire in 24 hours (stale cleanup)`);
          } else {
            io.to(connection.gameId).emit('player-left', result.state);
          }
        }
      }
      activeConnections.delete(socketId);
      connectionHealth.delete(socketId);
    }
  });

  if (staleCount > 0) {
    logger.info(`[CLEANUP] Removed ${staleCount} stale connections, Active connections: ${activeConnections.size}`);
  }
}, 30000);

// Cleanup expired games (24 hours) every hour
setInterval(() => {
  const { expiredGameIds } = gameEngine.expireGames({ maxAgeMs: 24 * 60 * 60 * 1000 });
  expiredGameIds.forEach(gameId => {
    logger.info(`Game ${gameId} expired and deleted (24+ hours old)`);
  });
}, 60 * 60 * 1000);

// Socket.io connection handling
logger.info('Setting up Socket.IO event handlers...');
io.on('connection', (socket) => {
  connectionMetrics.totalConnections++;
  logger.info(`[CONNECT] User connected: ${socket.id}, Total connections: ${connectionMetrics.totalConnections}, Active connections: ${activeConnections.size + 1}`);

  activeConnections.set(socket.id, {
    gameId: null,
    playerName: null,
    isWatcher: false,
    lastSeen: new Date(),
    connectedAt: new Date(),
    transport: socket.conn.transport.name
  });

  connectionHealth.set(socket.id, {
    status: 'healthy',
    lastPing: Date.now(),
    latency: 0,
    disconnectCount: 0,
    reconnectCount: 0,
    transport: socket.conn.transport.name
  });

  logger.debug(`[CONNECT] Connection details: ${socket.id}, Transport: ${socket.conn.transport.name}`);

  socket.on('create-game', (data = {}) => {
    const result = gameEngine.createGame({
      deckType: data.deckType || 'fibonacci',
      playerId: socket.id,
      playerName: data.playerName,
      isWatcher: data.isWatcher
    });

    socket.join(result.gameId);

    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.gameId = result.gameId;
      connection.playerName = data.playerName;
      connection.isWatcher = data.isWatcher;
      connection.lastSeen = new Date();
    }

    logger.info(`Game created and saved to disk: ${result.gameId}, Total games: ${result.meta.totalGames}`);
    socket.emit('game-created', { gameId: result.gameId, game: result.state });
  });

  socket.on('join-game', (data = {}) => {
    const result = gameEngine.joinGame({
      gameId: data.gameId,
      playerId: socket.id,
      playerName: data.playerName,
      isWatcher: data.isWatcher
    });

    if (!result.ok) {
      logger.error(`[ERROR] Join game failed: ${socket.id}, Game not found: ${data.gameId}`);
      socket.emit('error', { message: result.message });
      return;
    }

    socket.join(data.gameId);

    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.gameId = data.gameId;
      connection.playerName = data.playerName;
      connection.isWatcher = data.isWatcher;
      connection.lastSeen = new Date();
    }

    if (result.meta.reconnected) {
      logger.info(`Player reconnected (${result.meta.preservedVote ? 'with preserved vote' : 'without vote'}): ${socket.id}, Game: ${data.gameId}`);
      socket.emit('game-state', result.state);
    } else {
      logger.info(`Player joined and game saved to disk: ${data.gameId}: ${data.playerName}, Players in game: ${result.meta.playerCount}`);
      io.to(data.gameId).emit('player-joined', result.state);
    }
  });

  socket.on('ping', () => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastSeen = new Date();
    }

    const now = Date.now();
    const health = connectionHealth.get(socket.id) || {
      status: 'healthy',
      lastPing: now,
      latency: 0,
      disconnectCount: 0,
      reconnectCount: 0
    };
    const previousPing = health.lastPing;
    health.lastPing = now;
    health.status = 'healthy';

    if (previousPing && previousPing !== now) {
      health.latency = now - previousPing;
    }

    connectionHealth.set(socket.id, health);

    if (health.latency > 2000) {
      logger.warn(`[HEARTBEAT] High latency detected: ${socket.id}, Latency: ${health.latency}ms, Player: ${connection?.playerName || 'Unknown'}, Game: ${connection?.gameId || 'None'}`);
    }

    socket.emit('pong');
  });

  socket.on('error', (error) => {
    logger.error(`[ERROR] Socket error: ${socket.id}, Error: ${error.message}`);
  });

  socket.on('cast-vote', (data = {}) => {
    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.lastSeen = new Date();
    }

    const result = gameEngine.castVote({
      gameId: data.gameId,
      playerId: socket.id,
      card: data.card
    });

    if (!result.ok) {
      if (result.code === 'GAME_NOT_FOUND') {
        logger.error(`[ERROR] Vote cast failed: ${socket.id}, Game not found: ${data.gameId}`);
      } else {
        logger.warn(`[WARN] Invalid vote attempt: ${socket.id}, Player: ${result.meta?.playerName || 'Unknown'}, Card: ${data.card}, Game: ${data.gameId}`);
      }
      return;
    }

    logger.info(`Vote cast: ${socket.id}, Player: ${result.meta.playerName}, Card: ${data.card}, Game: ${data.gameId}`);
    if (result.meta.allVoted) {
      logger.info(`All players voted: Game ${data.gameId}, ${result.meta.voteCount} votes`);
    }

    io.to(data.gameId).emit('vote-cast', result.state);
  });

  socket.on('reveal-votes', (data = {}) => {
    const result = gameEngine.revealVotes({ gameId: data.gameId });
    if (!result.ok) {
      logger.error(`[ERROR] Reveal votes failed: ${socket.id}, Game not found: ${data.gameId}`);
      return;
    }

    logger.info(`Votes revealed: Game ${data.gameId}, ${result.meta.voteCount} votes`);
    if (result.meta.consensus.reached) {
      logger.info(`Consensus reached: Game ${data.gameId}, Card: ${result.meta.consensus.card}, Players: ${result.meta.consensus.count}`);
    }

    io.to(data.gameId).emit('votes-revealed', result.state);
  });

  socket.on('reset-game', (data = {}) => {
    const result = gameEngine.resetGame({ gameId: data.gameId });
    if (!result.ok) {
      logger.error(`[ERROR] Game reset failed: ${socket.id}, Game not found: ${data.gameId}`);
      return;
    }

    logger.info(`Game reset: Game ${data.gameId}`);
    io.to(data.gameId).emit('game-reset', result.state);
  });

  socket.on('change-deck', (data = {}) => {
    const result = gameEngine.changeDeck({
      gameId: data.gameId,
      deckType: data.deckType
    });
    if (!result.ok) {
      logger.error(`[ERROR] Deck change failed: ${socket.id}, Game not found: ${data.gameId}`);
      return;
    }

    logger.info(`Deck changed: Game ${data.gameId}, New deck: ${result.meta.deckType}`);
    io.to(data.gameId).emit('deck-changed', result.state);
  });

  socket.on('create-custom-deck', (data = {}) => {
    const result = gameEngine.createCustomDeck({
      gameId: data.gameId,
      name: data.name,
      cards: data.cards
    });
    if (!result.ok) {
      logger.error(`[ERROR] Custom deck creation failed (${result.code}): ${socket.id}, Game: ${data.gameId}`);
      socket.emit('error', { message: result.message });
      return;
    }

    logger.info(`Custom deck created: Game ${data.gameId}, Deck: ${result.meta.deckName}, Cards: ${result.meta.cardCount}`);
    io.to(data.gameId).emit('custom-deck-created', result.state);
  });

  socket.on('edit-custom-deck', (data = {}) => {
    const result = gameEngine.editCustomDeck({
      gameId: data.gameId,
      name: data.name,
      cards: data.cards
    });
    if (!result.ok) {
      logger.error(`[ERROR] Custom deck edit failed (${result.code}): ${socket.id}, Game: ${data.gameId}`);
      socket.emit('error', { message: result.message });
      return;
    }

    logger.info(`Custom deck edited: Game ${data.gameId}, Deck: ${result.meta.deckName}, Cards: ${result.meta.cardCount}`);
    io.to(data.gameId).emit('custom-deck-edited', result.state);
  });

  socket.on('change-player-name', (data = {}) => {
    logger.debug('[SERVER] Received change-player-name event:', data);
    const result = gameEngine.changePlayerName({
      gameId: data.gameId,
      playerId: socket.id,
      newName: data.newName
    });

    if (!result.ok) {
      logger.error(`[ERROR] Player name change failed (${result.code}): ${socket.id}, Game: ${data.gameId}`);
      socket.emit('error', { message: result.message });
      return;
    }

    const connection = activeConnections.get(socket.id);
    if (connection) {
      connection.playerName = result.meta.newName;
      connection.lastSeen = new Date();
    }

    logger.info(`Player name changed: ${socket.id}, Old name: ${result.meta.oldName}, New name: ${result.meta.newName}, Game: ${data.gameId}`);
    io.to(data.gameId).emit('player-name-changed', result.state);
  });

  socket.on('toggle-role', (data = {}) => {
    const result = gameEngine.toggleRole({
      gameId: data.gameId,
      playerId: socket.id
    });

    if (!result.ok) {
      logger.error(`[ERROR] Role toggle failed (${result.code}): ${socket.id}, Game: ${data.gameId}`);
      return;
    }

    logger.info(`Role toggled: ${socket.id}, Player: ${result.meta.playerName}, ${result.meta.previousRole} -> ${result.meta.newRole}, Game: ${data.gameId}`);
    io.to(data.gameId).emit('role-toggled', result.state);
  });

  socket.on('leave-game', (data = {}) => {
    const result = gameEngine.removePlayer({
      gameId: data.gameId,
      playerId: socket.id
    });

    if (!result.ok) {
      logger.error(`[ERROR] Leave game failed: ${socket.id}, Game not found: ${data.gameId}`);
      return;
    }

    socket.leave(data.gameId);

    if (result.meta.remainingPlayers === 0) {
      logger.info(`Game ${data.gameId} is now empty, will expire in 24 hours`);
    } else {
      logger.info(`Player left: ${socket.id}, Player: ${result.meta.playerName}, Game: ${data.gameId}`);
      io.to(data.gameId).emit('player-left', result.state);
    }
  });

  socket.on('disconnect', (reason) => {
    connectionMetrics.totalDisconnections++;

    const currentCount = connectionMetrics.disconnectReasons.get(reason) || 0;
    connectionMetrics.disconnectReasons.set(reason, currentCount + 1);

    const connection = activeConnections.get(socket.id);
    const health = connectionHealth.get(socket.id);
    const playerInfo = connection
      ? `Player: ${connection.playerName}, Game: ${connection.gameId}`
      : 'Unknown player';

    const connectionDuration = connection
      ? Math.round((Date.now() - connection.connectedAt.getTime()) / 1000)
      : 0;

    logger.info(`[DISCONNECT] User disconnected: ${socket.id}, Reason: ${reason}, ${playerInfo}, Connection duration: ${connectionDuration}s, Transport: ${health?.transport || 'unknown'}`);

    if (reason === 'ping timeout' || reason === 'transport close') {
      logger.warn(`[DISCONNECT] Problematic disconnect detected: ${socket.id}, Reason: ${reason}, Last ping: ${health?.lastPing ? new Date(health.lastPing).toISOString() : 'never'}, Latency: ${health?.latency || 0}ms`);
    }

    activeConnections.delete(socket.id);
    connectionHealth.delete(socket.id);

    const affectedGames = gameEngine.removePlayerFromAllGames({ playerId: socket.id });
    affectedGames.forEach(({ gameId, remainingPlayers, state }) => {
      if (remainingPlayers === 0) {
        logger.info(`[DISCONNECT] Game ${gameId} is now empty, will expire in 24 hours`);
      } else {
        logger.info(`[DISCONNECT] Notifying remaining players in game ${gameId}, Players remaining: ${remainingPlayers}`);
        io.to(gameId).emit('player-left', state);
      }
    });
  });
});

// API routes
app.get('/api/decks', (req, res) => {
  res.json(gameEngine.getCardDecks());
});

const APP_VERSION = require('./package.json').version;

app.get('/api/version', (req, res) => {
  res.json({ version: APP_VERSION });
});

app.get('/api/game/:gameId', (req, res) => {
  const state = gameEngine.getGameState(req.params.gameId);
  if (!state) {
    return res.status(404).json({ error: 'Game not found.' });
  }
  res.json(state);
});

app.get('/api/health', (req, res) => {
  const now = Date.now();
  let healthyConnections = 0;
  let unhealthyConnections = 0;
  let highLatencyConnections = 0;
  let totalLatency = 0;
  let latencyCount = 0;

  connectionHealth.forEach((health) => {
    if (now - health.lastPing > 60000) {
      unhealthyConnections++;
    } else {
      healthyConnections++;
    }

    if (health.latency > 1000) {
      highLatencyConnections++;
    }

    if (health.latency > 0) {
      totalLatency += health.latency;
      latencyCount++;
    }
  });

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
  const uptime = Math.round((Date.now() - connectionMetrics.startTime.getTime()) / 1000);

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
    connections: {
      total: activeConnections.size,
      healthy: healthyConnections,
      unhealthy: unhealthyConnections,
      highLatency: highLatencyConnections
    },
    games: gameEngine.getGameStats(),
    metrics: {
      totalConnections: connectionMetrics.totalConnections,
      totalDisconnections: connectionMetrics.totalDisconnections,
      totalReconnections: connectionMetrics.totalReconnections,
      avgLatency,
      disconnectReasons: Object.fromEntries(connectionMetrics.disconnectReasons)
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
logger.info(`Starting server on port ${PORT}...`);

server.on('error', (error) => {
  logger.error('Server error:', error);
});

server.listen(PORT, () => {
  logger.info(`Server successfully started and running on port ${PORT}`);
  logger.info('Planning Poker server is ready to accept connections');
});
