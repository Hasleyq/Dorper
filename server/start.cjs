const { exec } = require('child_process');

console.log('🚀 Starting Dorper Web Application...');

// 1. Start the Express web server IMMEDIATELY so Railway gets an instant response!
require('./index.cjs');

// 2. Synchronize database in the background without blocking server startup
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_PRIVATE_URL;

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  console.log('📦 Database URL detected. Synchronizing PostgreSQL schema in background...');
  exec('npx prisma db push --accept-data-loss', (err, stdout, stderr) => {
    if (err) {
      console.error('⚠️ Notice during async prisma db push:', err.message);
    } else {
      console.log('✅ Database schema synchronized successfully with PostgreSQL:');
      if (stdout) console.log(stdout);
    }
  });
} else {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in Railway variables!');
  console.warn('⚠️ Connect PostgreSQL database to this service in Railway dashboard.');
}
