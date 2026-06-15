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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key') {
  console.error('\x1b[31m[Error] GEMINI_API_KEY is not configured or still has the placeholder value in .env.\x1b[0m');
  process.exit(1);
}

// Sample prompt incorporating style and safety rules
const prompt = "cybernetic samurai standing in rain, Tokyo skyline, shonen style, rough sketch, black and white manga, safe for work, PG-13, no nudity, no explicit content, no gore";

// We use the Gemini 3.1 Flash Image model which supports free tier generateContent
const model = 'gemini-3.1-flash-image';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

console.log('\x1b[36m%s\x1b[0m', '--- Gemini 3.1 Flash Image (Free Tier) Spike Test ---');
console.log('Sending prompt:', `"${prompt}"`);
console.log('API URL:', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=REDACTED`);
console.log('Waiting for image generation (10-30 seconds)...');

const start = Date.now();

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"]
    }
  })
})
  .then(async (response) => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${text}`);
    }
    return response.json();
  })
  .then((data) => {
    // Navigate candidate content parts to find the image data
    const candidate = data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    
    if (!part || !part.inlineData || !part.inlineData.data) {
      throw new Error(`Invalid or empty response structure. Full response: ${JSON.stringify(data, null, 2)}`);
    }
    
    const base64Image = part.inlineData.data;
    const mimeType = part.inlineData.mimeType || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    
    const buffer = Buffer.from(base64Image, 'base64');
    const outputPath = path.join(__dirname, `gemini_free_output.${extension}`);
    fs.writeFileSync(outputPath, buffer);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log('\x1b[32m%s\x1b[0m', `\n[Success] Image generated successfully in ${duration} seconds!`);
    console.log(`Saved output to: ${outputPath}`);
  })
  .catch((error) => {
    console.error('\x1b[31m%s\x1b[0m', '\n[Failure] API call failed:');
    console.error(error.message || error);
  });
