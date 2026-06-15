import app from './app';

const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Start the server
app.listen(port, () => {
  console.log(`[Server] MangaSketch Backend is running on http://localhost:${port}`);
  console.log(`[Server] Configured CORS to allow requests from: ${frontendUrl}`);
});
