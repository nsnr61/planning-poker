const test = require('node:test');
const assert = require('node:assert/strict');
const { createGameEngine } = require('./gameEngine');

function createInMemoryPersistence(initialGames = []) {
  const saves = [];
  let stored = initialGames;
  return {
    saves,
    load() {
      return stored;
    },
    scheduleSave(gamesDataOrProducer) {
      const data = typeof gamesDataOrProducer === 'function'
        ? gamesDataOrProducer()
        : gamesDataOrProducer;
      stored = data;
      saves.push({ type: 'debounced', data });
    },
    saveImmediate(gamesDataOrProducer) {
      const data = typeof gamesDataOrProducer === 'function'
        ? gamesDataOrProducer()
        : gamesDataOrProducer;
      stored = data;
      saves.push({ type: 'immediate', data });
    }
  };
}

test('Slice 1: createGame creates a game with default fibonacci deck, adds creator, and schedules save', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  const result = engine.createGame({
    deckType: 'fibonacci',
    playerId: 'sock-1',
    playerName: 'Alice',
    isWatcher: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.gameId, 'game-123');
  assert.equal(result.state.id, 'game-123');
  assert.equal(result.state.deckType, 'fibonacci');
  assert.equal(result.state.revealed, false);
  assert.deepEqual(result.state.votes, {});
  assert.equal(result.state.players.length, 1);
  assert.equal(result.state.players[0].id, 'sock-1');
  assert.equal(result.state.players[0].name, 'Alice');
  assert.equal(result.state.players[0].isWatcher, false);
  assert.equal(result.state.players[0].hasVoted, false);
  assert.equal(persistence.saves.length, 1);
});

test('Slice 1: joinGame adds a new player or returns error when game does not exist', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  const missing = engine.joinGame({
    gameId: 'unknown',
    playerId: 'sock-2',
    playerName: 'Bob',
    isWatcher: false
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.code, 'GAME_NOT_FOUND');

  engine.createGame({
    deckType: 'tshirt',
    playerId: 'sock-1',
    playerName: 'Alice',
    isWatcher: false
  });

  const joined = engine.joinGame({
    gameId: 'game-123',
    playerId: 'sock-2',
    playerName: 'Bob',
    isWatcher: true
  });

  assert.equal(joined.ok, true);
  assert.equal(joined.meta.reconnected, false);
  assert.equal(joined.state.players.length, 2);
  assert.equal(joined.state.players[1].name, 'Bob');
  assert.equal(joined.state.players[1].isWatcher, true);
  assert.equal(persistence.saves.length, 2);
});

test('Slice 2: castVote validates card against active deck, hides unrevealed votes, and tracks allVoted ignoring watchers', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  engine.createGame({
    deckType: 'fibonacci',
    playerId: 'p1',
    playerName: 'Alice',
    isWatcher: false
  });
  engine.joinGame({
    gameId: 'game-123',
    playerId: 'p2',
    playerName: 'Bob',
    isWatcher: false
  });
  engine.joinGame({
    gameId: 'game-123',
    playerId: 'w1',
    playerName: 'Observer',
    isWatcher: true
  });

  // Invalid card not in Fibonacci deck
  const badCard = engine.castVote({ gameId: 'game-123', playerId: 'p1', card: 'XXL' });
  assert.equal(badCard.ok, false);
  assert.equal(badCard.code, 'INVALID_VOTE');

  // Watcher cannot vote
  const watcherVote = engine.castVote({ gameId: 'game-123', playerId: 'w1', card: '5' });
  assert.equal(watcherVote.ok, false);
  assert.equal(watcherVote.code, 'INVALID_VOTE');

  // First valid vote
  const vote1 = engine.castVote({ gameId: 'game-123', playerId: 'p1', card: '5' });
  assert.equal(vote1.ok, true);
  assert.deepEqual(vote1.state.votes, {});
  assert.equal(vote1.state.allVoted, false);
  assert.equal(vote1.state.canReveal, true);
  assert.equal(vote1.state.players.find(p => p.id === 'p1').hasVoted, true);

  // Reconnect p1 preserves hasVoted
  const reconnectP1 = engine.joinGame({
    gameId: 'game-123',
    playerId: 'p1',
    playerName: 'Alice',
    isWatcher: false
  });
  assert.equal(reconnectP1.meta.reconnected, true);
  assert.equal(reconnectP1.meta.preservedVote, true);
  assert.equal(reconnectP1.state.players.find(p => p.id === 'p1').hasVoted, true);

  // Second valid vote -> all non-watchers voted
  const vote2 = engine.castVote({ gameId: 'game-123', playerId: 'p2', card: '5' });
  assert.equal(vote2.ok, true);
  assert.equal(vote2.state.allVoted, true);
});

test('Slice 2: revealVotes exposes votes, detects consensus, blocks further votes, and resetGame clears round', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  engine.createGame({ deckType: 'fibonacci', playerId: 'p1', playerName: 'Alice', isWatcher: false });
  engine.joinGame({ gameId: 'game-123', playerId: 'p2', playerName: 'Bob', isWatcher: false });

  engine.castVote({ gameId: 'game-123', playerId: 'p1', card: '8' });
  engine.castVote({ gameId: 'game-123', playerId: 'p2', card: '8' });

  const revealed = engine.revealVotes({ gameId: 'game-123' });
  assert.equal(revealed.ok, true);
  assert.equal(revealed.state.revealed, true);
  assert.deepEqual(revealed.state.votes, { p1: '8', p2: '8' });
  assert.deepEqual(revealed.meta.consensus, { reached: true, card: '8', count: 2 });

  // Voting while revealed is rejected
  const lateVote = engine.castVote({ gameId: 'game-123', playerId: 'p1', card: '13' });
  assert.equal(lateVote.ok, false);

  // Reset clears votes and revealed flag
  const reset = engine.resetGame({ gameId: 'game-123' });
  assert.equal(reset.ok, true);
  assert.equal(reset.state.revealed, false);
  assert.deepEqual(reset.state.votes, {});
  assert.equal(reset.state.players.every(p => p.hasVoted === false), true);
});

test('Slice 3: toggleRole revokes existing vote when becoming watcher, and changePlayerName enforces 1-20 char rule', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  engine.createGame({ deckType: 'fibonacci', playerId: 'p1', playerName: 'Alice', isWatcher: false });
  engine.castVote({ gameId: 'game-123', playerId: 'p1', card: '5' });

  // Toggle to watcher -> vote is removed and watcher-only game has allVoted === false
  const toggled = engine.toggleRole({ gameId: 'game-123', playerId: 'p1' });
  assert.equal(toggled.ok, true);
  assert.equal(toggled.state.players[0].isWatcher, true);
  assert.equal(toggled.state.players[0].hasVoted, false);
  assert.equal(toggled.state.canReveal, false);
  assert.equal(toggled.state.allVoted, false);

  // Reconnect with role change back to voter persists the change
  const savesBeforeReconnect = persistence.saves.length;
  const reconnectedVoter = engine.joinGame({
    gameId: 'game-123',
    playerId: 'p1',
    playerName: 'Alice',
    isWatcher: false
  });
  assert.equal(reconnectedVoter.meta.reconnected, true);
  assert.equal(reconnectedVoter.meta.roleChanged, true);
  assert.equal(persistence.saves.length, savesBeforeReconnect + 1);

  // Name validation
  const emptyName = engine.changePlayerName({ gameId: 'game-123', playerId: 'p1', newName: '   ' });
  assert.equal(emptyName.ok, false);
  assert.equal(emptyName.message, 'Name must be between 1 and 20 characters.');

  const tooLong = engine.changePlayerName({
    gameId: 'game-123',
    playerId: 'p1',
    newName: '123456789012345678901'
  });
  assert.equal(tooLong.ok, false);
  assert.equal(tooLong.message, 'Name must be between 1 and 20 characters.');

  const renamed = engine.changePlayerName({
    gameId: 'game-123',
    playerId: 'p1',
    newName: '  Alice Cooper  '
  });
  assert.equal(renamed.ok, true);
  assert.equal(renamed.state.players[0].name, 'Alice Cooper');
  assert.equal(renamed.meta.oldName, 'Alice');
  assert.equal(renamed.meta.newName, 'Alice Cooper');
});

test('Slice 3: createCustomDeck, editCustomDeck, and changeDeck filter blank cards and reset active votes', () => {
  const persistence = createInMemoryPersistence();
  const engine = createGameEngine({
    persistence,
    idGenerator: () => 'game-123'
  });

  engine.createGame({ deckType: 'fibonacci', playerId: 'p1', playerName: 'Alice', isWatcher: false });
  engine.castVote({ gameId: 'game-123', playerId: 'p1', card: '3' });

  // Editing before a custom deck exists is rejected
  const prematureEdit = engine.editCustomDeck({
    gameId: 'game-123',
    name: 'No Deck Yet',
    cards: ['1', '2']
  });
  assert.equal(prematureEdit.ok, false);
  assert.equal(prematureEdit.code, 'INVALID_CUSTOM_DECK');

  // Empty custom deck is rejected
  const emptyDeck = engine.createCustomDeck({
    gameId: 'game-123',
    name: 'Empty Deck',
    cards: ['  ', '']
  });
  assert.equal(emptyDeck.ok, false);
  assert.equal(emptyDeck.code, 'INVALID_CUSTOM_DECK');

  const customCreated = engine.createCustomDeck({
    gameId: 'game-123',
    name: '  Sprint Deck ',
    cards: ['S', ' ', 'M', '', 'L']
  });
  assert.equal(customCreated.ok, true);
  assert.equal(customCreated.state.deckType, 'custom');
  assert.equal(customCreated.state.deck.name, 'Sprint Deck');
  assert.deepEqual(customCreated.state.deck.cards, ['S', 'M', 'L']);
  assert.equal(customCreated.state.players[0].hasVoted, false);

  // Vote with new custom card
  const customVote = engine.castVote({ gameId: 'game-123', playerId: 'p1', card: 'M' });
  assert.equal(customVote.ok, true);

  // Edit custom deck resets vote
  const customEdited = engine.editCustomDeck({
    gameId: 'game-123',
    name: 'Updated Deck',
    cards: ['10', '20']
  });
  assert.equal(customEdited.ok, true);
  assert.deepEqual(customEdited.state.deck.cards, ['10', '20']);
  assert.equal(customEdited.state.players[0].hasVoted, false);

  // Switch to standard deck and back to custom
  const toTshirt = engine.changeDeck({ gameId: 'game-123', deckType: 'tshirt' });
  assert.equal(toTshirt.state.deckType, 'tshirt');
  const backToCustom = engine.changeDeck({ gameId: 'game-123', deckType: 'custom' });
  assert.equal(backToCustom.state.deckType, 'custom');
  assert.deepEqual(backToCustom.state.deck.cards, ['10', '20']);
});

test('Slice 3: removePlayerFromAllGames and expireGames clean up players and 24h+ inactive games', () => {
  let clock = new Date('2026-11-03T12:00:00Z');
  const persistence = createInMemoryPersistence();
  let seq = 0;
  const engine = createGameEngine({
    persistence,
    idGenerator: () => `game-${++seq}`,
    now: () => new Date(clock)
  });

  engine.createGame({ deckType: 'fibonacci', playerId: 'p1', playerName: 'Alice', isWatcher: false });
  engine.joinGame({ gameId: 'game-1', playerId: 'p2', playerName: 'Bob', isWatcher: false });
  engine.castVote({ gameId: 'game-1', playerId: 'p2', card: '5' });

  const removed = engine.removePlayerFromAllGames({ playerId: 'p2' });
  assert.equal(removed.length, 1);
  assert.equal(removed[0].gameId, 'game-1');
  assert.equal(removed[0].state.players.length, 1);
  assert.equal(removed[0].state.canReveal, false);

  // Advance clock by 25 hours for game-1, create game-2 at 25h mark
  clock = new Date('2026-11-04T13:00:00Z');
  engine.createGame({ deckType: 'fibonacci', playerId: 'p3', playerName: 'Charlie', isWatcher: false });

  const expired = engine.expireGames({ maxAgeMs: 24 * 60 * 60 * 1000 });
  assert.deepEqual(expired.expiredGameIds, ['game-1']);
  assert.equal(engine.getActiveGameCount(), 1);
  assert.equal(engine.getGameState('game-1'), null);
  assert.notEqual(engine.getGameState('game-2'), null);
  assert.equal(persistence.saves.at(-1).type, 'immediate');
});


