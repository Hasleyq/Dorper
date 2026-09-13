const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { handleRpc } = require('./rpc-handler.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Railway health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dorper-web-app', timestamp: new Date().toISOString() });
});

// Main RPC API for all database interactions
app.post('/api/rpc', async (req, res) => {
  try {
    const { channel, args } = req.body || {};
    if (!channel) {
      return res.status(400).json({ success: false, error: 'Missing channel in request body' });
    }
    const result = await handleRpc(channel, args || []);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(`[RPC Error: ${req.body?.channel}]`, err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// Serve frontend build in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing (Express 5 compatible)
const fs = require('fs');
app.use((_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>dorper.pl</title></head>
        <body style="font-family:sans-serif;padding:50px;text-align:center;background:#0f172a;color:#f8fafc;">
          <h1>dorper.pl — System hodowlany</h1>
          <p>Serwer aktywny. Frontend jest w trakcie inicjalizacji...</p>
        </body>
      </html>
    `);
  }
});

const portsToListen = new Set([Number(PORT) || 3000, 3000, 8080]);

for (const p of portsToListen) {
  try {
    app.listen(p, '0.0.0.0', () => {
      console.log(`🚀 Dorper Web Application listening on http://0.0.0.0:${p}`);
    });
  } catch (err) {
    console.log(`Port ${p} could not be bound:`, err.message);
  }
}

if (process.env.DATABASE_URL) {
  console.log('🔗 Database connected via PostgreSQL DATABASE_URL');
}
