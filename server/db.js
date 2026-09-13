const { PrismaClient } = require('@prisma/client');

let prisma;

function getDatabase() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

module.exports = { getDatabase };
