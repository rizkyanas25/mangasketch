# MangaSketch

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

**Turn your manga ideas into visual concepts in seconds.**

[Live Demo](https://mangasketch.vercel.app) • [Documentation](./docs/Documentation.md)

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

### 🗄️ Database & Storage Setup (Supabase)

To replicate the database and storage on your Supabase instance:

1. **Database Schema**:
   * Go to **SQL Editor** in your Supabase dashboard.
   * Open a new query, paste the contents of [supabase/schema.sql](./supabase/schema.sql), and click **Run** to create the `sketches` table and configure Row Level Security (RLS) policies.
2. **Storage Bucket**:
   * Go to **Storage** in Supabase and click **New Bucket**.
   * Name it **`sketches`** and toggle **Public** to `ON`.
3. **Authentication**:
   * Go to **Authentication** -> **Providers** and enable **Google**.
   * Configure your Google Client ID and Secret (Google Cloud Console).

---

## 🎨 Features

- **AI Manga Sketch Generator**, generate manga-style artwork from text prompts
- **Style Presets**, choose between Shonen, Seinen, Shojo, Dark Fantasy, Cyberpunk
- **Personal Sketchbook**, save and browse all your generated sketches
- **Re-generation**, pick any saved result, tweak the prompt, and generate a new version
- **Version History**, track the evolution of your ideas across re-generations
- **Retro Theme Switcher**, toggle between Light Ink, Tankobon (sepia paper), and Midnight Moon themes
- **Hanko Stamp Watermark**, dynamically generated SVG red signature stamps applied by default
- **Post-Auth Recovery**, guest sketch is automatically saved to the database post-login
- **Brutalist Canvas Overlays & Anti-Save**, hover custom tooltips, fullscreen modal, and right-click safeguards
- **Google Sign-In**, simple authentication to save your work
- **Try Without Login**, anonymous users can generate up to 5 images per hour

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS | App Router, server components, fast DX |
| **State Management** | TanStack Query, Zustand | Loading/error states, caching, global UI store |
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
│   ├── Documentation.md   # Technical & design documentation
│   └── DESIGN_LANGUAGE.md # Visual guidelines and design system
├── packages/
│   └── shared/         # Shared workspace package (types & constants)
├── .env.example
├── package.json        # npm workspaces root
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/sketches` | Optional | Generate manga sketch from prompt |
| `GET` | `/api/sketches` | Required | List user's sketches |
| `GET` | `/api/sketches/:id` | Required | Get single sketch detail & version history |
| `DELETE` | `/api/sketches/:id` | Required | Delete a sketch |
| `GET` | `/api/sketches/quota` | Optional | Retrieve current user's daily ink quota |

---

## ⚙️ Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `POLLINATIONS_API_KEY` | Pollinations.ai secret key |
| `GEMINI_API_KEY` | Gemini API key (if using Gemini as provider) |
| `PORT` | Backend server port (default: 3001) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |
| `DEBUG_HTTP` | Enable verbose HTTP request/response body logging in backend (default: false) |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:web` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run test` | Run backend automated test suite (Vitest & Supertest) |

---

## 📖 Documentation

For system design, technical decisions, visual design specs, and build process:

* **[📄 Documentation.md](./docs/Documentation.md)** - Technical & system design documentation
* **[🎨 DESIGN_LANGUAGE.md](./docs/DESIGN_LANGUAGE.md)** - Visual guidelines and retro design system

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
