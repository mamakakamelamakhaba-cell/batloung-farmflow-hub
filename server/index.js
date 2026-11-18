// Single server for the Batloung Farm Distribution System.
// - serves the built front-end from dist/
// - serves the JSON API under /api
// Run in development with: npm run dev  (Vite + this server)
// Run in production with:  npm run build && npm start
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import apiRouter from '../src/routes/api.js';
import { errorHandler, notFoundHandler, requestLogger } from '../src/middleware/errorHandler.js';
import { pool } from '../src/database/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api', apiRouter);

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

if (isProd) {
  const dist = path.join(root, 'dist', 'client');
  const distAlt = path.join(root, 'dist');
  const staticDir = fs.existsSync(dist) ? dist : distAlt;

  app.use(express.static(staticDir, { index: false, maxAge: '1h' }));

  // Client-side routing: anything not an API call returns the app shell.
  app.get('*', (_req, res) => {
    const indexFile = path.join(staticDir, 'index.html');
    if (!fs.existsSync(indexFile)) {
      return res.status(500).send('Front-end build not found. Run `npm run build` first.');
    }
    res.sendFile(indexFile);
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Batloung Farm Distribution System → http://localhost:${PORT}`);
  console.log(`API health check            → http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, closing server...`);
    await pool.end();
    server.close(() => process.exit(0));
  });
}