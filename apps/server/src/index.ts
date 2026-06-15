import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

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

// Basic health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'MangaSketch Backend' });
});

// Start the server
app.listen(port, () => {
  console.log(`[Server] MangaSketch Backend is running on http://localhost:${port}`);
  console.log(`[Server] Configured CORS to allow requests from: ${frontendUrl}`);
});
