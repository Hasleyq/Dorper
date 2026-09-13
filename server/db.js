const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prisma;

function getDatabase() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('⚠️ DATABASE_URL not set, using default connection string');
    }
    const pool = new Pool({
      connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/dorper',
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    console.log('✅ PrismaClient connected via PrismaPg PostgreSQL adapter');
  }
  return prisma;
}

module.exports = { getDatabase };
