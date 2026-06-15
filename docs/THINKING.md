# MangaSketch - System Design

> This document covers my thinking process before writing any code: how the app works, why I pick this stack, and how I plan the build.

---

## Why Manga?

I pick manga as the niche because I genuinely enjoy manga and anime culture. But more importantly, manga sketch has a very clear visual identity, like black and white ink drawings, clean linework, screentone shading. This means I can enforce a consistent output style regardless of what the user types as prompt.

The idea is: user type anything, the backend wrap it with manga-specific prompt template, and the result always come out as manga sketch. This make the niche feel real, not just a label on top of generic image generator.

The product vision is simple: **users should feel like they are collaborating with an AI-powered manga concept artist, not just generating random images.**

---

## App Journey

### How a prompt travels from browser to image

```
User Browser
     │
     ├── 1. User type prompt + select Manga Style (Shonen, Seinen, etc) & Drawing Style (Rough, Inked, etc)
     │
     ├── 2. Frontend send POST request to backend
     │      POST /api/sketches
     │      Body: { prompt, mangaStyle, drawingStyle, watermarkText?, watermarkPosition? }
     │      Header: Authorization: Bearer <jwt> (if logged in)
     │
     ▼
Express Backend (Railway)
     │
     ├── 3. Validate the prompt (not empty, not too long)
     │
     ├── 4. Build full prompt by wrapping user input with manga & drawing templates
     │      Example:
     │      User input: "a girl sitting in coffee shop"
     │      Final prompt: "a girl sitting in coffee shop, shojo style, elegant linework, expressive emotional tone, soft screens, manga sketch, black and white ink drawing, hand-drawn linework, screentone shading"
     │
     ├── 5. Send request to AI Image API (Pollinations.ai)
     │      GET https://image.pollinations.ai/prompt/{encoded_prompt}
     │
     ├── 6. Wait for response (10-30 seconds is normal)
     │
     ├── 7. Receive image binary from API
     │
     ├── 8. Check if user is authenticated:
     │      ├── YES (logged in):
     │      │     ├── Upload image to Supabase Storage
     │      │     ├── Save metadata to PostgreSQL (prompt, mangaStyle, drawingStyle, seed, image_url, user_id)
     │      │     └── Return { id, prompt, mangaStyle, drawingStyle, seed, image_url, saved: true, watermarkText?, watermarkPosition? }
     │      │
     │      └── NO (anonymous):
     │            └── Return { prompt, mangaStyle, drawingStyle, seed, image_url: base64, saved: false, watermarkText?, watermarkPosition? }
     │
     ▼
User Browser
     │
     └── 9. Frontend display the generated manga sketch
            ├── Logged in: "Saved to sketchbook ✓" + image appear in sketchbook
            └── Anonymous: "Login to save this to your sketchbook"
```

### Re-generation Flow

Re-generated images are not just separate entries. They are **linked to the original sketch** via `parent_id`. This way, user can see the evolution of their idea.

```
Sketchbook (/sketches)
     │
     ├── Each card show the latest version of that sketch
     ├── If a sketch has variations, card show version count (e.g. "3 versions")
     │
     ├── User click on a card
     │
     ▼
Detail Page (/sketches/[id])
     │
     ├── Show all versions of this sketch (latest first, default opened)
     ├── User can browse previous versions
     ├── Prompt from selected version is pre-filled in the form
     ├── User edit the prompt
     ├── Click "Re-ink Panel"
     │
     ▼
     Same flow as above (step 2-9)
     │
     └── New image saved with parent_id pointing to original sketch
         └── Sketchbook card update to show new version as the latest
```

**Database structure for this:**

```sql
sketches table:
  id            UUID (primary key)
  parent_id     UUID (nullable, references sketches.id)
  user_id       UUID
  prompt        TEXT
  manga_style   TEXT
  drawing_style TEXT
  image_url     TEXT
  seed          BIGINT
  created_at    TIMESTAMPTZ
```

- First sketch: `parent_id = null`
- Re-ink sketch: `parent_id = original sketch id`
- Sketchbook query: group by root parent, show latest version, **cursor-based pagination** (load more as user scroll)
- Detail query: get all rows where `id = X` or `parent_id = X`, order by `created_at DESC`

- **[UPDATED ON DEVELOPMENT]**: 
  - To avoid complex recursive PostgreSQL queries, I implement a **flat-tree structure** where all variations point directly to the original root parent sketch (`parent_id = root parent id`). This is resolved dynamically in the backend using `getRootParentId()`.
  - Sketchbook query simply fetches all sketches for the user sorted by latest (`created_at DESC`).
  - Detail query retrieves the parent and all variations (`id = rootId OR parent_id = rootId`) sorted chronologically (`created_at ASC`) to render version sequence correctly in the UI.

### Safety Architecture (PG-13 Guardrails)

To prevent abuse (NSFW, hate speech, explicit content) while keeping action-oriented manga concepts (like sword fights, magic, and monsters) unblocked, we implement a 2-layer safety system:

1. **Layer 1: Backend Text Moderation (Blocklist)**
   - Pre-request blocklist checks user prompt for highly offensive, sexual, or prohibited keywords.
   - If triggered, immediately returns `400: PROHIBITED_PROMPT` without hitting the AI provider.
   - UI maps this to the dramatic manga error: **"PROHIBITED INK!"** or **"FORBIDDEN TECHNIQUE!"** (e.g. *"Your prompt violates our community guidelines. Keep it PG-13!"*).

2. **Layer 2: Prompt Wrapper Safeguards**
   - Appends safety directives (`safe for work, PG-13, no nudity, no explicit content, no gore`) into the final wrapped prompt sent to Pollinations/Gemini.
   - Restricts NSFW generation without over-sensitizing the model to action-packed manga keywords.

### Error Handling Flow

```
Backend receive request
     │
     ├── Prompt empty or too long?
     │     └── Return 400: INVALID_PROMPT
     │         Frontend show: "Please enter a valid prompt."
     │
     ├── Prompt contains prohibited words? (Layer 1 Safety)
     │     └── Return 400: PROHIBITED_PROMPT
     │         Frontend show: "Prohibited ink! Keep your prompt PG-13."
     │
     ├── AI API not responding within 60s?
     │     └── Return 504: AI_TIMEOUT
     │         Frontend show: "Image generation timed out. Please try again."
     │
     ├── AI API return broken/malformed response?
     │     └── Return 502: AI_PROVIDER_ERROR
     │         Frontend show: "Unexpected response from AI service."
     │
     ├── Too many requests from anonymous user? (>5/hour)
     │     └── Return 429: RATE_LIMITED
     │         Frontend show: "Too many requests. Please wait."
     │
     ├── **[UPDATED ON DEVELOPMENT]** - GET /api/sketches (No auth token)?
     │     └── Return 401: UNAUTHORIZED
     │         Frontend show: "You must be logged in to view your sketchbook."
     │
     ├── **[UPDATED ON DEVELOPMENT]** - GET /api/sketches/:id (Invalid UUID format)?
     │     └── Return 400: INVALID_SKETCH_ID
     │         Frontend show: "Invalid sketch ID format."
     │
     ├── **[UPDATED ON DEVELOPMENT]** - GET /api/sketches/:id (Sketch not found or not own by user)?
     │     └── Return 404: SKETCH_NOT_FOUND
     │         Frontend show: "Sketch not found or access denied."
     │
     └── Network/server down?
           └── Frontend catch network error
               Frontend show: "Unable to connect to server."
```

---

## Tech Stack

### Frontend: Next.js 15 + TypeScript + Tailwind CSS

I choose Next.js because its my main framework that I use daily. App Router give me good file-based routing, and server components help with performance. TypeScript because type safety is important specially when dealing with API response shapes. Tailwind because I can build UI fast without context switching to CSS files.

I also use **TanStack Query** for server state management. It handle loading states, error states, caching, and refetching out of the box. This is important because image generation is slow (10-30s) and I need good loading/error UX.

### Backend: Express + TypeScript

I go with separate Express backend instead of Next.js API routes for few reasons:
- Clear separation between frontend and backend concern
- Backend might need to handle heavy image processing and I dont want that to affect frontend server
- Easier to scale independently. If the AI generation is slow, I can scale backend without touching frontend
- In real production, backend API usually live separately

### Database: Supabase PostgreSQL

Supabase give me managed PostgreSQL + Auth + Storage in one platform. I dont need to setup separate database server, auth system, and file storage. For this scope, its the right level of simplicity without sacrificing reliability.

### Storage: Supabase Storage

Generated images stored in Supabase Storage bucket. This ensure images persist server-side and survive page refresh. Each image linked to a row in PostgreSQL via `image_url`.

### Auth: Supabase Auth (Google OAuth)

Simple Google sign-in. No email/password to manage. User click login, Google handle the rest, Supabase give me JWT token. Backend verify this token on every authenticated request.

### AI Provider: Pollinations.ai (primary) / Gemini (fallback)

I start with Pollinations as primary AI provider because:
- **Simple REST API**, send a GET request with encoded prompt, receive image binary directly
- **Good model selection** for generating stylized artwork
- **Free tier** that is enough for this use case

That said, during development I might switch to **Gemini Flash Image API** if Pollinations doesnt produce good enough manga-style output. The backend is designed so that swapping AI provider only require changing one service file, not the whole app. This is intentional because in real project, AI providers can change anytime due to pricing, quality, or reliability issues.

Both providers require API key, so setup complexity is similar. The decision will come down to which one produce better manga sketch output during testing.

- **[UPDATED ON DEVELOPMENT]**:
  - I use **Z-Image Turbo** (`zimage`) as the default model. It gives very fast generation (75 images/hour on Seed tier) and does not have native AI watermarks.
  - To guarantee a pure black-and-white output and eliminate color leakage, I programmatically convert the image buffer to grayscale using the **Sharp** library before applying the watermark.

### Hanko Stamp Watermark
- **[UPDATED ON DEVELOPMENT]**: 
  - I added a traditional Japanese hanko stamp watermark to sketches to make them feel authentic like they were made by a real manga artist.
  - The watermark is a red stamp with Katakana text `マンガスケッチ` and user initials (optional, max 4 chars). It is always generated and applied by the backend using `sharp`.



### Monorepo Structure

I use single repository with `apps/web` and `apps/server` folder instead of two separate repos. The reasons:

- **Single clone, single README**. Reviewer can clone once, run `npm install` at root, and start both frontend and backend. This help achieve the "running in under 15 minutes" target.
- **Unified commit history**. Reviewer can see the full development timeline in one place. With two repos, the story is scattered and harder to follow.
- **Shared workspace package**. We share TypeScript definitions, data models, validation constants, and API contracts using a local workspace package `@mangasketch/shared` located at `packages/shared`. This acts as a single source of truth to keep both frontend and backend fully in sync without publishing to npm.
- **Simpler CI/CD**. One repo to manage, one set of environment variables to configure.

Deploy is still independent. Vercel and Railway both support monorepo by setting "Root Directory" to `apps/web` and `apps/server` respectively. So I get the benefit of monorepo without the drawback of coupled deployment.

In a real production project, I would probably separate the repos. Maybe even use different languages for backend (Go, Rust) depending on performance needs, add proper CI/CD pipelines per service, and use tools like Turborepo or Nx for monorepo orchestration. But for this assessment, I prioritize **speed, simplicity, and avoiding over-engineering**. The goal is to ship clean working software, not to impress with infrastructure complexity.

### Deploy: Vercel (Frontend) + Railway (Backend)

- Vercel is optimized for Next.js, zero config deployment
- Railway for Express backend, no cold start (unlike Render free tier), simple GitHub integration
- Both support monorepo with root directory config

---

## Build Process

### How I sequence the work

I prioritize based on what the assignment value most: **working software with real API calls and proper error handling**.

#### Phase 1: Foundation (Day 1)
- Setup monorepo structure
- Init Next.js + Express projects
- Setup Supabase (database, storage, auth)
- Test AI API (Pollinations), make sure it works before building anything on top

**Why first**: If the AI API doesnt work reliably, everything else is waste of time. I need to validate the core dependency first.

#### Phase 2: Core Backend (Day 2)
- Build `/api/generate` endpoint
- Implement prompt wrapping (manga template)
- Connect to Pollinations API
- Implement image upload to Supabase Storage
- Save metadata to PostgreSQL
- Error handling for all failure states

**Why second**: Backend is the foundation. Frontend cant do anything without working API.

#### Phase 3: Core Frontend (Day 3-4)
- Build generate page with form
- Implement loading experience (meaningful, not just spinner)
- Display generated result
- Error state handling (all 3 types visible)
- Auth flow (Google login)
- Gallery page
- Detail page with re-generation

**Why third**: Now I have working backend, I can build frontend with real data flowing through.

- **[UPDATED ON DEVELOPMENT]**:
  - **Zustand for Global UI State**: 
    I use Zustand (`useUiStore`) instead of putting everything inside React Context. It helps share the `isGenerating` loading state to the navigation Header. Because it uses selector-based subscription, it avoids re-rendering the whole Header or pages when generation is pending. Also, this store will be very useful when we need to share other global UI states later, like toast message queue or sidebar/drawer states.
  - **Auth & Theme Providers separation**:
    I split root providers into `AuthProvider` and `ThemeProvider` instead of one big context. This keeps concerns separated. Changing themes will not trigger any authentication session checks, keeping renders light. This separation also makes it easy to add other providers later (like ToastProvider or ReactQueryProvider) without making a single giant context file.
  - **Retro Theme Switcher**:
    I added a Neo-Brutalist theme switcher in the header with three curated modes:
    1. `Light Ink` (high-contrast black/white manga paper style)
    2. `Recycled Book / Tankobon` (warm sepia paper color, like vintage cheap Shonen Jump magazine print)
    3. `Midnight Moon` (high-contrast dark mode)
    Why this theme switcher exist: pure white background can be very blinding if user open the website at night. So I provide warm sepia (`Recycled Book`) and dark mode (`Midnight Moon`) to make it comfortable for eyes, while still looking premium and keeping the strong manga identity.

#### Phase 4: Polish + Deploy (Day 5)
- UI polish, make it feel like real product, not assignment
- Deploy to Vercel + Railway
- Test live URL end to end
- Write documentation

#### Phase 5: Record Demo (Day 6)
- Record Loom with real API calls
- Show all failure states on camera
- Write honest observation about limitations

### What I chose NOT to build

- **Image-to-image generation**: The assignment mention "text and/or image" input, but for manga sketch niche, text-to-image is the core workflow. Adding image input would add complexity without much value for the specific use case.
- **User profiles / settings page**: Not needed for the core flow. User just need to login and generate.
- **Image editing / annotation**: Out of scope. The value is in quick ideation, not detailed editing.
- **WebSocket / SSE for real-time progress**: Nice to have, but simple polling or just showing loading state is enough. The generation time (10-30s) is short enough that user can wait with a good loading UX.

---

## Known Limitations

1. **Pollinations API has no SLA**. Its a free service, so there is no guarantee of uptime or response time. In production, I would add a fallback provider.
2. **Stochastic nature of diffusion models**. While we implement seed locking (variation control) to preserve composition and character structure during re-inking, minor visual shifts can still occur when modifying prompt tokens. This is normal behavior for diffusion processes.
3. **Rate limiting is in-memory**. If backend restart, rate limit counter reset. For production, I would use Redis.
