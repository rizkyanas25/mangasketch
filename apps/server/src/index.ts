import './config/env';
import express from 'express';
import cors from 'cors';
import sketchesRouter from './routes/sketches';

const app = express();
const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Enable CORS for frontend requests
app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Mount routes
app.use('/api/sketches', sketchesRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'MangaSketch Backend' });
});

// Start the server
app.listen(port, () => {
  console.log(`[Server] MangaSketch Backend is running on http://localhost:${port}`);
  console.log(`[Server] Configured CORS to allow requests from: ${frontendUrl}`);
});
