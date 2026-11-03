const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function createJsonFileAdapter({
  dataDir = path.join(process.cwd(), 'data'),
  fileName = 'games.json',
  debounceMs = 1000
} = {}) {
  const gamesFile = path.join(dataDir, fileName);
  let saveTimeout = null;

  function ensureDataDir() {
    try {
      if (!fs.existsSync(dataDir)) {
        logger.info(`Creating data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info('Data directory created successfully');
      }
      const testFile = path.join(dataDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      logger.debug(`Data directory is writable: ${dataDir}`);
    } catch (error) {
      logger.error(`Failed to set up writable data directory (${dataDir}):`, error.message);
    }
  }

  ensureDataDir();

  function saveImmediate(gamesDataOrProducer) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    try {
      if (!fs.existsSync(dataDir)) {
        logger.error(`Data directory no longer exists: ${dataDir}`);
        return;
      }
      const gamesData = typeof gamesDataOrProducer === 'function'
        ? gamesDataOrProducer()
        : gamesDataOrProducer;
      const jsonData = JSON.stringify(gamesData, null, 2);
      fs.writeFileSync(gamesFile, jsonData);
      logger.debug(`Saved ${gamesData.length} games to disk (${gamesFile})`);
    } catch (error) {
      logger.error('Error saving games to disk:', error.message);
    }
  }

  function scheduleSave(gamesDataOrProducer) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveImmediate(gamesDataOrProducer);
    }, debounceMs);
  }

  function load() {
    try {
      if (!fs.existsSync(gamesFile)) {
        logger.info('No games file found, starting with empty game list');
        return [];
      }
      const raw = fs.readFileSync(gamesFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        logger.warn('Games file did not contain an array, starting with empty game list');
        return [];
      }
      logger.info(`Loaded ${parsed.length} serialized games from disk`);
      return parsed;
    } catch (error) {
      logger.error('Error loading games from disk, continuing with empty list:', error.message);
      return [];
    }
  }

  function cancelPending() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  }

  return {
    dataDir,
    gamesFile,
    load,
    scheduleSave,
    saveImmediate,
    cancelPending
  };
}

module.exports = {
  createJsonFileAdapter
};
