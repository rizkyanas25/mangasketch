const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid external dependencies before npm install
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('\x1b[31m[Error] No .env file found at:', envPath);
    console.error('Please copy .env.example to .env and fill in your API keys first.\x1b[0m');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !key.startsWith('#')) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

if (!POLLINATIONS_API_KEY || POLLINATIONS_API_KEY === 'your_pollinations_api_key') {
  console.error('\x1b[31m[Error] POLLINATIONS_API_KEY is not configured or still has the placeholder value in .env.\x1b[0m');
  process.exit(1);
}

// Sample prompt incorporating style and safety rules
const prompt = "cybernetic samurai standing in rain, Tokyo skyline, shonen style, rough sketch, black and white manga, safe for work, PG-13, no nudity, no explicit content, no gore";
const encodedPrompt = encodeURIComponent(prompt);

const width = 768;
const height = 1024;
const model = 'flux'; // Default model on Pollinations
const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&key=${POLLINATIONS_API_KEY}`;

console.log('\x1b[36m%s\x1b[0m', '--- Pollinations.ai API Spike Test ---');
console.log('Sending prompt:', `"${prompt}"`);
console.log('API URL:', url);
console.log('Waiting for image generation (10-30 seconds)...');

const start = Date.now();

fetch(url)
  .then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${text}`);
    }
    return response.arrayBuffer();
  })
  .then((arrayBuffer) => {
    const buffer = Buffer.from(arrayBuffer);
    const outputPath = path.join(__dirname, 'output.png');
    fs.writeFileSync(outputPath, buffer);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log('\x1b[32m%s\x1b[0m', `\n[Success] Image generated successfully in ${duration} seconds!`);
    console.log(`Saved output to: ${outputPath}`);
  })
  .catch((error) => {
    console.error('\x1b[31m%s\x1b[0m', '\n[Failure] API call failed:');
    console.error(error);
  });
