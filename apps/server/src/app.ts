import './config/env';
import express from 'express';
import cors from 'cors';
import sketchesRouter from './routes/sketches';
import { httpLoggingMiddleware } from './middleware/logging';

const app = express();
app.set('trust proxy', true);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Enable CORS for frontend requests
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

// Parse JSON request bodies
// app.use(express.json());
app.use(express.json({ limit: '10mb' }));

// Custom HTTP request & response body logger (only active when DEBUG_HTTP=true)
app.use(httpLoggingMiddleware);

// Mount routes
app.use('/api/sketches', sketchesRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'MangaSketch Backend' });
});

export default app;
