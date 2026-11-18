// Development server: Vite handles the front-end with hot reload, and any
// /api request is passed through to the Express API on the same port.
// Start with: npm run dev
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import apiRouter from '../src/routes/api.js';

const PORT = Number(process.env.PORT || 5173);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
app.use(vite.middlewares);

app.listen(PORT, () => {
  console.log(`Batloung Farm Distribution System (dev) → http://localhost:${PORT}`);
});
