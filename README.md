# MangaSketch

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

**Turn your manga ideas into visual concepts in seconds.**

[Live Demo](#) • [System Design](./docs/THINKING.md)

</div>

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/rizkyanas25/mangasketch.git
cd mangasketch

# 2. Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials

# 3. Install dependencies
npm install

# 4. Start development
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

---

## 🎨 Features

- **AI Manga Sketch Generator**, generate manga-style artwork from text prompts
- **Style Presets**, choose between Shonen, Seinen, Shojo, Dark Fantasy, Cyberpunk
- **Personal Gallery**, save and browse all your generated sketches
- **Re-generation**, pick any saved result, tweak the prompt, and generate a new version
- **Version History**, track the evolution of your ideas across re-generations
- **Google Sign-In**, simple authentication to save your work
- **Try Without Login**, anonymous users can generate up to 5 images per hour

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS | App Router, server components, fast DX |
| **State Management** | TanStack Query | Loading/error states, caching, infinite scroll |
| **Backend** | Node.js, Express, TypeScript | Lightweight, full control over API routing |
| **Database** | Supabase PostgreSQL | Managed Postgres with built-in auth |
| **Storage** | Supabase Storage | Image storage with CDN |
| **Auth** | Supabase Auth (Google OAuth) | Simple social login |
| **AI API** | Pollinations.ai / Gemini | Manga sketch generation, swappable provider |
| **Deploy** | Vercel (FE) + Railway (BE) | Optimized for each layer |

---

## 📁 Project Structure

```
mangasketch/
├── apps/
│   ├── web/            # Next.js frontend
│   └── server/         # Express backend
├── docs/
│   └── THINKING.md     # System design document
├── .env.example
├── package.json        # npm workspaces root
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/generate` | Optional | Generate manga sketch from prompt |
| `GET` | `/api/gallery` | Required | List user's generations (paginated) |
| `GET` | `/api/gallery/:id` | Required | Get single generation detail |
| `DELETE` | `/api/gallery/:id` | Required | Delete a generation |

---

## ⚙️ Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `POLLINATIONS_API_KEY` | Pollinations.ai secret key |
| `GEMINI_API_KEY` | Gemini API key (if using Gemini as provider) |
| `PORT` | Backend server port (default: 3001) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:web` | Start frontend only |
| `npm run dev:server` | Start backend only |

---

## 📖 Documentation

For system design, tech stack decisions, and build process:

**[📄 THINKING.md](./docs/THINKING.md)**

---

## 🚀 Deployment

| Service | Platform | Root Directory |
|---------|----------|---------------|
| Frontend | [Vercel](https://vercel.com) | `apps/web` |
| Backend | [Railway](https://railway.app) | `apps/server` |

---

## 📝 License

MIT

---

<div align="center">

_"Users should feel like they are collaborating with an AI-powered manga concept artist."_

**MangaSketch**

</div>
