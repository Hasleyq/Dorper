const path = require('path');

// Safe database getter
const { getDatabase, getDatabasePath } = require('../electron/database.cjs');

// Import handlers
const { registerSheepHandlers } = require('../electron/handlers/sheep.cjs');
const { registerBreedingHandlers } = require('../electron/handlers/breeding.cjs');
const { registerWeightHandlers } = require('../electron/handlers/weights.cjs');
const { registerHealthHandlers } = require('../electron/handlers/health.cjs');
const { registerLitterHandlers } = require('../electron/handlers/litters.cjs');
const { registerTransactionHandlers } = require('../electron/handlers/transactions.cjs');
const { registerPhotoHandlers } = require('../electron/handlers/photos.cjs');
const { registerCalendarHandlers } = require('../electron/handlers/calendar.cjs');
const { registerPenHandlers } = require('../electron/handlers/pens.cjs');

const channels = new Map();

const mockIpc = {
  handle: (name, fn) => {
    channels.set(name, fn);
  },
};

// Register all standard handlers
registerSheepHandlers(mockIpc);
registerBreedingHandlers(mockIpc);
registerWeightHandlers(mockIpc);
registerHealthHandlers(mockIpc);
registerLitterHandlers(mockIpc);
registerTransactionHandlers(mockIpc);
registerPhotoHandlers(mockIpc);
registerCalendarHandlers(mockIpc);
registerPenHandlers(mockIpc);

// Web-safe database info
channels.set('database:info', async () => {
  const fs = require('fs');
  const dbPath = getDatabasePath();
  let sizeKb = 0;
  let exists = false;
  try {
    const stats = fs.statSync(dbPath);
    exists = true;
    sizeKb = Math.round(stats.size / 1024);
  } catch {}
  return { path: dbPath, exists, sizeKb };
});

channels.set('database:backup', async () => {
  return { success: true, message: 'Web backup available via download' };
});

async function handleRpc(channel, args = []) {
  const fn = channels.get(channel);
  if (!fn) {
    throw new Error(`Unknown RPC channel: ${channel}`);
  }
  return await fn(null, ...args);
}

module.exports = { handleRpc, channels };
