# MangaSketch

> Turn your manga ideas into visual concepts in seconds.

AI-powered manga sketch generator. Create manga-inspired characters, scenes, and story concepts with AI — no drawing skills required.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15, TypeScript, Tailwind CSS | Server components, app router, fast DX |
| Backend | Node.js, Express, TypeScript | Lightweight, full control over API routing |
| Database | Supabase PostgreSQL | Managed Postgres with built-in auth |
| Storage | Supabase Storage | Image storage with CDN |
| Auth | Supabase Auth (Google OAuth) | Simple social login |
| AI API | Pollinations.ai | Free, no API key required, reliable |
| Deploy | Vercel (FE) + Railway (BE) | Optimized for each layer |

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account (free tier)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/mangasketch.git
cd mangasketch

# 2. Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials

# 3. Install dependencies
npm install

# 4. Start development
npm run dev
```

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:3001`

## Project Structure

```
mangasketch/
├── apps/
│   ├── web/            # Next.js frontend
│   └── server/         # Express backend
├── docs/
│   └── THINKING.md     # System design document
├── .env.example
├── package.json
└── README.md
```

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Documentation

- [System Design & Thinking](docs/THINKING.md)

## License

MIT
