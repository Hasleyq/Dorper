import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function webApiPlugin() {
  return {
    name: 'web-api-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/rpc', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('Method Not Allowed');
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { channel, args } = JSON.parse(body || '{}');
            // @ts-ignore
            const { handleRpc } = await import('./server/rpc-handler.cjs');
            const result = await handleRpc(channel, args || []);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: result }));
          } catch (err: any) {
            console.error('[Web API Error]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), webApiPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Allows access from phones / tablets on local network
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
