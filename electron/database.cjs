const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const fs = require('fs');

let prisma;

/**
 * Resolve the database file path.
 * - In development: use prisma/dev.db in the project root
 * - In production (packaged): use userData directory (e.g. %APPDATA%/dorper-app/)
 *   so the database persists across updates and is writable.
 */
function resolveDatabasePath() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    return path.join(__dirname, '..', 'prisma', 'dev.db');
  }

  // Production: store in user data directory
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dorper.db');

  // If the DB doesn't exist yet, copy the schema-initialized blank DB from resources
  if (!fs.existsSync(dbPath)) {
    // Try to copy the seed DB from extraResources
    const resourceDb = path.join(process.resourcesPath, 'prisma', 'dev.db');
    if (fs.existsSync(resourceDb)) {
      fs.copyFileSync(resourceDb, dbPath);
      console.log(`📦 Database copied to: ${dbPath}`);
    } else {
      // Create directory if needed — Prisma adapter will create the file
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      console.log(`📦 New database will be created at: ${dbPath}`);
    }
  }

  return dbPath;
}

function getDatabase() {
  if (!prisma) {
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const { PrismaPg } = require('@prisma/adapter-pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      prisma = new PrismaClient({ adapter });
      console.log('✅ PostgreSQL connected via PrismaPg adapter');
    } else {
      try {
        const dbPath = resolveDatabasePath();
        const dbUrl = `file:${dbPath}`;
        const adapter = new PrismaBetterSqlite3({ url: dbUrl });
        prisma = new PrismaClient({ adapter });
        console.log(`✅ SQLite connected: ${dbPath}`);
      } catch (err) {
        prisma = new PrismaClient();
        console.log('✅ Fallback PrismaClient initialized');
      }
    }
  }
  return prisma;
}

/**
 * Get the database file path (for backup/info features)
 */
function getDatabasePath() {
  return resolveDatabasePath();
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = { getDatabase, getDatabasePath, disconnectDatabase };
