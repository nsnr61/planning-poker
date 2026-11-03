const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createJsonFileAdapter } = require('./jsonFileAdapter');
const { createGameEngine } = require('../gameEngine');

test('Slice 4: createJsonFileAdapter persists and reloads games via GameEngine using temp directory', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planning-poker-test-'));

  try {
    const adapter1 = createJsonFileAdapter({ dataDir: tempDir, debounceMs: 20 });
    const engine1 = createGameEngine({
      persistence: adapter1,
      idGenerator: () => 'persisted-1'
    });

    engine1.createGame({
      deckType: 'tshirt',
      playerId: 'sock-a',
      playerName: 'Ada',
      isWatcher: false
    });
    engine1.castVote({ gameId: 'persisted-1', playerId: 'sock-a', card: 'L' });
    engine1.flushPersistence();

    const gamesFilePath = path.join(tempDir, 'games.json');
    assert.equal(fs.existsSync(gamesFilePath), true);

    // Reload in a second engine instance from the same temp directory
    const adapter2 = createJsonFileAdapter({ dataDir: tempDir, debounceMs: 20 });
    const engine2 = createGameEngine({ persistence: adapter2 });

    assert.equal(engine2.getActiveGameCount(), 1);
    const loadedState = engine2.getGameState('persisted-1');
    assert.equal(loadedState.deckType, 'tshirt');
    assert.equal(loadedState.players[0].name, 'Ada');
    assert.equal(loadedState.players[0].hasVoted, true);

    const revealed = engine2.revealVotes({ gameId: 'persisted-1' });
    assert.deepEqual(revealed.state.votes, { 'sock-a': 'L' });
    adapter2.cancelPending();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Slice 4: createJsonFileAdapter gracefully returns empty array when file is missing or corrupted', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planning-poker-corrupt-'));

  try {
    const adapter = createJsonFileAdapter({ dataDir: tempDir, debounceMs: 10 });
    assert.deepEqual(adapter.load(), []);

    fs.writeFileSync(path.join(tempDir, 'games.json'), '{not-valid-json');
    assert.deepEqual(adapter.load(), []);

    // Array with one invalid item (null / missing id) and one valid item
    fs.writeFileSync(
      path.join(tempDir, 'games.json'),
      JSON.stringify([
        null,
        { id: 'valid-1', deckType: 'fibonacci', players: [], votes: [], revealed: false }
      ])
    );
    const engine = createGameEngine({ persistence: adapter });
    assert.equal(engine.getActiveGameCount(), 1);
    assert.equal(engine.getGameState('valid-1').id, 'valid-1');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
