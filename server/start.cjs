const { execSync } = require('child_process');

console.log('🚀 Starting Dorper Web Application...');

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_PRIVATE_URL;

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  console.log('📦 Database URL detected. Synchronizing PostgreSQL schema with Prisma...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Database schema synchronized successfully with PostgreSQL');
  } catch (err) {
    console.error('⚠️ Warning during prisma db push:', err.message);
  }
} else {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in Railway variables!');
  console.warn('⚠️ Please connect PostgreSQL database to this service in Railway dashboard.');
}

// Start the Express web server
require('./index.cjs');
