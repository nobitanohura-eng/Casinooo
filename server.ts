import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/routes/api.ts';
import { operatorRouter } from './src/server/routes/operatorApi.ts';
import { setupSocketIO } from './src/server/sockets/socketHandler.ts';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// JSON and URL-encoded body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach API Routes
app.use('/api', apiRouter);
app.use('/api/ops', operatorRouter);

// Initialize Socket.IO with CORS support
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

setupSocketIO(io);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Dynamically load Vite in development mode and mount middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode');
  } else {
    // In production, serve static assets from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Failsafe: If dist/index.html was not generated during build command, build it automatically
    if (!fs.existsSync(indexPath)) {
      console.log('[Server] Warning: dist/index.html not found! Triggering automated vite build...');
      try {
        const { execSync } = await import('child_process');
        execSync('npx vite build', { stdio: 'inherit' });
        console.log('[Server] Automated vite build finished successfully.');
      } catch (buildErr) {
        console.error('[Server] Automated build encountered an error:', buildErr);
      }
    }

    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexPath);
      });
      console.log('[Server] Serving production build from /dist');
    } else {
      // Emergency Fallback: Mount dynamic Vite instance if dist is somehow unavailable
      console.log('[Server] Mounting dynamic Vite engine fallback...');
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: '0.0.0.0',
          port: PORT,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = PORT + 1;
      console.log(`[Server] Port ${PORT} already in use, switching to port ${fallbackPort}...`);
      httpServer.listen(fallbackPort, '0.0.0.0', () => {
        console.log(`[Server] Apex Arcade server listening on http://0.0.0.0:${fallbackPort}`);
      });
    } else {
      console.error('[Server] HTTP server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Apex Arcade server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
