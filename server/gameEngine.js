const { randomUUID } = require('node:crypto');

const CARD_DECKS = {
  fibonacci: {
    name: 'Fibonacci',
    cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '∞', '?', '☕']
  },
  tshirt: {
    name: 'T-Shirt Sizing',
    cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕']
  },
  powersOf2: {
    name: 'Powers of 2',
    cards: ['0', '1', '2', '4', '8', '16', '32', '?', '☕']
  },
  linear: {
    name: 'Linear (1-10)',
    cards: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕']
  }
};

class Game {
  constructor(id, deckType = 'fibonacci', now = () => new Date()) {
    this.id = id;
    this.deckType = CARD_DECKS[deckType] ? deckType : 'fibonacci';
    this.players = new Map();
    this.votes = new Map();
    this.revealed = false;
    this.deck = CARD_DECKS[this.deckType];
    this.customDeck = null;
    this.createdAt = now();
    this.lastActivity = now();
  }

  addPlayer(playerId, name, isWatcher = false, now = () => new Date()) {
    this.players.set(playerId, {
      id: playerId,
      name: name || `Player ${this.players.size + 1}`,
      isWatcher: Boolean(isWatcher),
      hasVoted: false,
      lastSeen: now()
    });
    return this.players.get(playerId);
  }

  castVote(playerId, card) {
    if (this.revealed) return false;
    const player = this.players.get(playerId);
    if (!player || player.isWatcher) return false;
    if (!this.deck || !Array.isArray(this.deck.cards) || !this.deck.cards.includes(card)) {
      return false;
    }
    this.votes.set(playerId, card);
    player.hasVoted = true;
    return true;
  }

  revealVotes() {
    this.revealed = true;
    return true;
  }

  resetGame() {
    this.votes.clear();
    this.revealed = false;
    this.players.forEach(player => {
      player.hasVoted = false;
    });
  }

  removePlayer(playerId) {
    const existed = this.players.delete(playerId);
    this.votes.delete(playerId);
    return existed;
  }

  createCustomDeck(name, cards) {
    const cleanCards = Array.isArray(cards)
      ? cards.map(c => String(c).trim()).filter(c => c !== '')
      : [];
    this.customDeck = {
      name: String(name || 'Custom').trim(),
      cards: cleanCards
    };
    this.deckType = 'custom';
    this.deck = this.customDeck;
    this.resetGame();
  }

  editCustomDeck(name, cards) {
    if (this.customDeck) {
      const cleanCards = Array.isArray(cards)
        ? cards.map(c => String(c).trim()).filter(c => c !== '')
        : [];
      this.customDeck.name = String(name || this.customDeck.name).trim();
      this.customDeck.cards = cleanCards;
      this.deck = this.customDeck;
      this.resetGame();
    }
  }

  getGameState() {
    const hasAnyVotes = this.votes.size > 0;
    const playersArray = Array.from(this.players.values());
    const voters = playersArray.filter(p => !p.isWatcher);

    return {
      id: this.id,
      deckType: this.deckType,
      deck: this.deck,
      customDeck: this.customDeck,
      players: playersArray,
      votes: this.revealed ? Object.fromEntries(this.votes) : {},
      revealed: this.revealed,
      allVoted: voters.length > 0 && voters.every(p => p.hasVoted),
      canReveal: hasAnyVotes && !this.revealed
    };
  }

  serialize() {
    return {
      id: this.id,
      deckType: this.deckType,
      deck: this.deck,
      customDeck: this.customDeck,
      players: Array.from(this.players.entries()),
      votes: Array.from(this.votes.entries()),
      revealed: this.revealed,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity || this.createdAt
    };
  }

  static deserialize(data, now = () => new Date()) {
    if (!data || typeof data !== 'object' || typeof data.id !== 'string') {
      throw new Error('Invalid serialized game data');
    }
    const game = new Game(data.id, data.deckType, now);
    game.deck = data.deck || CARD_DECKS[game.deckType];
    game.customDeck = data.customDeck || null;
    game.players = new Map(data.players || []);
    game.votes = new Map(data.votes || []);
    game.revealed = Boolean(data.revealed);
    game.createdAt = data.createdAt ? new Date(data.createdAt) : now();
    game.lastActivity = data.lastActivity ? new Date(data.lastActivity) : game.createdAt;
    return game;
  }
}

function createGameEngine({
  persistence = null,
  idGenerator = () => randomUUID().substring(0, 8),
  now = () => new Date()
} = {}) {
  const games = new Map();

  function serializeAll() {
    return Array.from(games.values()).map(g => g.serialize());
  }

  function triggerSave(immediate = false) {
    if (!persistence) return;
    if (immediate && typeof persistence.saveImmediate === 'function') {
      persistence.saveImmediate(serializeAll());
    } else if (typeof persistence.scheduleSave === 'function') {
      persistence.scheduleSave(() => serializeAll());
    }
  }

  if (persistence && typeof persistence.load === 'function') {
    const initial = persistence.load() || [];
    for (const item of initial) {
      try {
        const game = Game.deserialize(item, now);
        games.set(game.id, game);
      } catch {
        // Skip corrupted individual game entries
      }
    }
  }

  return {
    createGame({ deckType = 'fibonacci', playerId, playerName, isWatcher = false }) {
      const gameId = idGenerator();
      const game = new Game(gameId, deckType, now);
      game.addPlayer(playerId, playerName, isWatcher, now);
      game.lastActivity = now();
      games.set(gameId, game);
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: { totalGames: games.size }
      };
    },

    joinGame({ gameId, playerId, playerName, isWatcher }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      game.lastActivity = now();
      const existingPlayer = game.players.get(playerId);

      if (existingPlayer) {
        existingPlayer.name = playerName || existingPlayer.name;
        let roleChanged = false;
        if (isWatcher !== undefined && Boolean(isWatcher) !== existingPlayer.isWatcher) {
          existingPlayer.isWatcher = Boolean(isWatcher);
          roleChanged = true;
          if (existingPlayer.isWatcher) {
            game.votes.delete(playerId);
          }
        }
        existingPlayer.lastSeen = now();
        existingPlayer.hasVoted = game.votes.has(playerId);

        if (roleChanged) {
          triggerSave(false);
        }

        return {
          ok: true,
          gameId,
          state: game.getGameState(),
          meta: {
            reconnected: true,
            roleChanged,
            preservedVote: existingPlayer.hasVoted
          }
        };
      }

      game.addPlayer(playerId, playerName, Boolean(isWatcher), now);
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          reconnected: false,
          playerCount: game.players.size
        }
      };
    },

    castVote({ gameId, playerId, card }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      const player = game.players.get(playerId);
      const playerName = player ? player.name : 'Unknown';
      const success = game.castVote(playerId, card);

      if (!success) {
        return {
          ok: false,
          code: 'INVALID_VOTE',
          message: 'Invalid vote attempt.',
          meta: { playerName }
        };
      }

      game.lastActivity = now();
      triggerSave(false);
      const state = game.getGameState();

      return {
        ok: true,
        gameId,
        state,
        meta: {
          playerName,
          allVoted: state.allVoted,
          voteCount: game.votes.size
        }
      };
    },

    revealVotes({ gameId }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      game.revealVotes();
      game.lastActivity = now();
      triggerSave(false);

      const votes = Array.from(game.votes.values());
      const reached = votes.length > 1 && votes.every(v => v === votes[0]);
      const consensus = {
        reached,
        card: reached ? votes[0] : null,
        count: votes.length
      };

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          voteCount: votes.length,
          consensus
        }
      };
    },

    resetGame({ gameId }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      game.resetGame();
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {}
      };
    },

    changeDeck({ gameId, deckType }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      if (deckType === 'custom' && game.customDeck) {
        game.deckType = 'custom';
        game.deck = game.customDeck;
      } else {
        game.deckType = CARD_DECKS[deckType] ? deckType : 'fibonacci';
        game.deck = CARD_DECKS[game.deckType];
      }

      game.resetGame();
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: { deckType: game.deckType }
      };
    },

    createCustomDeck({ gameId, name, cards }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      const cleanName = typeof name === 'string' ? name.trim() : '';
      const cleanCards = Array.isArray(cards)
        ? cards.map(c => String(c).trim()).filter(c => c !== '')
        : [];

      if (!cleanName || cleanCards.length === 0) {
        return {
          ok: false,
          code: 'INVALID_CUSTOM_DECK',
          message: 'Custom deck requires a name and at least one card.'
        };
      }

      game.createCustomDeck(cleanName, cleanCards);
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          deckName: game.customDeck.name,
          cardCount: game.customDeck.cards.length
        }
      };
    },

    editCustomDeck({ gameId, name, cards }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      if (!game.customDeck) {
        return {
          ok: false,
          code: 'INVALID_CUSTOM_DECK',
          message: 'No custom deck exists for this game.'
        };
      }

      const cleanName = typeof name === 'string' ? name.trim() : '';
      const cleanCards = Array.isArray(cards)
        ? cards.map(c => String(c).trim()).filter(c => c !== '')
        : [];

      if (!cleanName || cleanCards.length === 0) {
        return {
          ok: false,
          code: 'INVALID_CUSTOM_DECK',
          message: 'Custom deck requires a name and at least one card.'
        };
      }

      game.editCustomDeck(cleanName, cleanCards);
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          deckName: game.customDeck.name,
          cardCount: game.customDeck.cards.length
        }
      };
    },

    changePlayerName({ gameId, playerId, newName }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      const player = game.players.get(playerId);
      if (!player) {
        return {
          ok: false,
          code: 'PLAYER_NOT_FOUND',
          message: 'You are not in this game.'
        };
      }

      if (!newName || typeof newName !== 'string') {
        return {
          ok: false,
          code: 'INVALID_NAME',
          message: 'Invalid name provided.'
        };
      }

      const trimmedName = newName.trim();
      if (trimmedName.length === 0 || trimmedName.length > 20) {
        return {
          ok: false,
          code: 'INVALID_NAME',
          message: 'Name must be between 1 and 20 characters.'
        };
      }

      const oldName = player.name;
      player.name = trimmedName;
      player.lastSeen = now();
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          oldName,
          newName: trimmedName
        }
      };
    },

    toggleRole({ gameId, playerId }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      const player = game.players.get(playerId);
      if (!player) {
        return {
          ok: false,
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found in game.'
        };
      }

      const previousRole = player.isWatcher ? 'Watcher' : 'Player';
      player.isWatcher = !player.isWatcher;
      if (player.isWatcher) {
        game.votes.delete(playerId);
        player.hasVoted = false;
      }

      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          playerName: player.name,
          previousRole,
          newRole: player.isWatcher ? 'Watcher' : 'Player',
          isWatcher: player.isWatcher
        }
      };
    },

    removePlayer({ gameId, playerId }) {
      const game = games.get(gameId);
      if (!game) {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'Game not found.'
        };
      }

      const player = game.players.get(playerId);
      const playerName = player ? player.name : 'Unknown';
      game.removePlayer(playerId);
      game.lastActivity = now();
      triggerSave(false);

      return {
        ok: true,
        gameId,
        state: game.getGameState(),
        meta: {
          playerName,
          remainingPlayers: game.players.size
        }
      };
    },

    removePlayerFromAllGames({ playerId }) {
      const affected = [];
      games.forEach((game, currentGameId) => {
        if (game.players.has(playerId)) {
          const player = game.players.get(playerId);
          game.removePlayer(playerId);
          game.lastActivity = now();
          affected.push({
            gameId: currentGameId,
            playerName: player ? player.name : 'Unknown',
            remainingPlayers: game.players.size,
            state: game.getGameState()
          });
        }
      });

      if (affected.length > 0) {
        triggerSave(false);
      }

      return affected;
    },

    expireGames({ maxAgeMs = 24 * 60 * 60 * 1000 } = {}) {
      const currentTime = now();
      const expiredGameIds = [];

      games.forEach((game, gameId) => {
        if (currentTime - game.lastActivity > maxAgeMs) {
          expiredGameIds.push(gameId);
        }
      });

      expiredGameIds.forEach(gameId => {
        games.delete(gameId);
      });

      if (expiredGameIds.length > 0) {
        triggerSave(true);
      }

      return { expiredGameIds };
    },

    flushPersistence() {
      triggerSave(true);
    },

    getGameState(gameId) {
      const game = games.get(gameId);
      return game ? game.getGameState() : null;
    },

    getActiveGameCount() {
      return games.size;
    },

    getGameStats() {
      let active = 0;
      games.forEach(game => {
        if (game.players.size > 0) active++;
      });
      return {
        total: games.size,
        active
      };
    },

    getCardDecks() {
      return CARD_DECKS;
    }
  };
}

module.exports = {
  CARD_DECKS,
  Game,
  createGameEngine
};
