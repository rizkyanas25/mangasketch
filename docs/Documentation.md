# MangaSketch — Technical & Design Documentation

This document covers the complete system design, architecture, and technical decisions made during the planning and execution phases of MangaSketch.

---

# PART 1: MY THINKING (Pre-Build Design)

## 1. Niche Selection & Product Vision
MangaSketch is built specifically for **mangakas (manga artists) and concept designers**. I chose manga as the niche because of my genuine passion and deep interest in manga, anime, and Japanese pop culture. This authentic connection inspired me to create a tool tailored precisely to the real-world workflow and aesthetic requirements of comic artists—ensuring the niche shapes the actual product design rather than just serving as a superficial label on top of a generic image generator.
* **The Problem:** Generic AI generators output high-contrast color illustrations that look nothing like traditional comic ink. When creating manga storyboards, character designs, or backgrounds, artists need black-and-white drawings, ink outlines, screentone dots, and clean lines.
* **The Solution:** MangaSketch wraps all user inputs in custom-tailored prompt engineering templates. It restricts output specifically to monochrome manga aesthetics, regardless of what the user types.
* **The Vision:** An AI concept artist assistant. Instead of separate, disjointed generations, each storyboard frame or sketch can evolve into versions (iterations) while preserving composition and seeds.

---

## 2. App Journey (Data & Request Flow)

The diagram below illustrates our initial planning of how a user's prompt travels from the browser, through the Express backend, to the AI API, and back as an image:

```
User Browser
     │
     ├── 1. User type prompt + select manga style (Shonen, Seinen, Shojo, etc)
     │
     ├── 2. Frontend send POST request to backend
     │      POST /api/generate
     │      Body: { prompt, style }
     │      Header: Authorization: Bearer <jwt> (if logged in)
     │
     ▼
Express Backend (Railway)
     │
     ├── 3. Validate the prompt (not empty, not too long)
     │
     ├── 4. Build full prompt by wrapping user input with manga template
     │      Final prompt: "manga sketch, black and white ink drawing,
     │                     a girl sitting in coffee shop, shojo style,
     │                     hand-drawn linework, screentone shading"
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
     │      │     ├── Save metadata to PostgreSQL (prompt, style, image_url, user_id)
     │      │     └── Return { id, prompt, style, image_url, saved: true }
     │      │
     │      └── NO (anonymous):
     │            └── Return { prompt, style, image_data: base64, saved: false }
     │
     ▼
User Browser
     │
     └── 9. Frontend display the generated manga sketch
            ├── Logged in: "Saved to gallery ✓" + image appear in gallery
            └── Anonymous: "Login to save this to your gallery"
```

---

## 3. Tech Stack Justification

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router) + TypeScript | Modern React framework with excellent optimization. TypeScript provides strict compile-time checks, ensuring type safety between backend responses and UI components. |
| **Styling** | Tailwind CSS v4 | Provides rapid, responsive layout styling. The utility-first approach helps build complex neo-brutalist visuals easily. |
| **Backend** | Express + Node.js + TypeScript | Separating the backend ensures the Next.js client is unaffected by heavy image processing loads. TypeScript matches types with the frontend. |
| **State Management**| Zustand | Lightweight, selector-based state manager. Prevents heavy page-wide re-renders (unlike React Context) when sharing loading states and notifications. |
| **Server State** | TanStack Query (React Query) | Handles detail caches, timeline fetching, automatic invalidations, and smooth version switching without layout jumps. |
| **Database & Auth** | Supabase (PostgreSQL, Storage, Auth) | Full-featured managed PostgreSQL database with row-level security. Supabase Auth (Google OAuth) handles sign-in, and Storage handles secure asset hosting. |
| **Image Processing**| Sharp | High-performance Node.js image manipulation library. Used for Grayscale conversion and compositing SVG watermark buffers. |

---

## 4. The Build Process (Sequence)

We sequenced the planned development into 5 distinct phases to prioritize working software and validate core dependencies first:

* **Phase 1: Foundation (Day 1)**
  - Setup monorepo structure
  - Init Next.js + Express projects
  - Setup Supabase (database, storage, auth)
  - Test AI API (Pollinations), make sure it works before building anything on top
  - *Why first:* If the AI API doesn't work reliably, everything else is a waste of time. We must validate the core dependency first.
* **Phase 2: Core Backend (Day 2)**
  - Build `/api/generate` endpoint
  - Implement prompt wrapping (manga template)
  - Connect to Pollinations API
  - Implement image upload to Supabase Storage
  - Save metadata to PostgreSQL
  - Error handling for all failure states
  - *Why second:* Backend is the foundation. The frontend cannot do anything without a working API.
* **Phase 3: Core Frontend (Day 3-4)**
  - Build generate page with form
  - Implement loading experience (meaningful, not just spinner)
  - Display generated result
  - Handle all 3 error states visibly
  - Integrate Auth flow (Google login)
  - Build gallery page and detail page with re-generation
  - *Why third:* Once the backend is working, we can build the frontend with real data flowing through.
* **Phase 4: Polish + Deploy (Day 5)**
  - UI polish, make it feel like a real product, not an assignment
  - Deploy to Vercel + Railway
  - Test live URL end-to-end
  - Write setup instructions and documentation
* **Phase 5: Record Demo (Day 6)**
  - Record Loom demo highlighting the full journey (prompt, wait, image, save, re-generate)
  - Demonstrate at least two of the three required failure states on camera
  - Write down honest observations and system limitations

---

# PART 2: MY DECISIONS (Technical Choices & Evolution)

This section documents the actual engineering decisions made during pengerjaan (execution), comparing them against the original `thinking-old.md` planning.

---

### 1. Renaming & Consistent Wording Overhaul
* **Original Plan (`thinking-old.md`):** Used terms like "gallery" (`/gallery`), "generations" (database table `generations`), "variants" and "drafts".
* **Actual Decision:** Refactored the entire project to use **"sketchbook"** (route `/sketches`), **"sketch(es)"** (database table `sketches`), and **"version(s)"** (instead of variants/drafts). All types in `@mangasketch/shared` and routes were strictly updated.
* **Why:** "Sketchbook" and "sketches" align much better with the creative manga niche, making the branding feel authentic. Consolidating terms prevents cognitive load and keeps codebase semantics clean.

---

### 2. Hanko Stamp Watermarking System
* **Original Plan:** No watermarking or signature features.
* **Actual Decision:** 
  - Created a dynamic Japanese red Hanko stamp SVG (`HankoStamp.tsx`) showing Katakana text `マンガスケッチ` (MangaSketch) and optional user initials (max 4 characters).
  - Applied this stempel by default to all generated sketches using the backend `sharp` compositor.
  - Placed the Hanko logo behind the main brand text in `Header.tsx`.
* **Why:** The Hanko stamp acts as an authentic signature for manga artists. Putting it in the logo header creates visual continuity, linking the watermark stamp to the platform's brand identity.

---

### 3. Grayscale Processing via Sharp
* **Original Plan:** Rely on prompt engineering (e.g., *"black and white, manga panel"*) to get monochrome images.
* **Actual Decision:** Programmatically converted the raw image buffer to grayscale using `sharp(buffer).grayscale().toBuffer()` in the backend before adding the watermark.
* **Why:** Diffusion models (like Pollinations) are stochastic and often leak sepia, blue, or yellow tones even with strict B&W prompts. Forcing grayscale in the backend guarantees a pure monochrome output, ensuring a consistent manga-paper aesthetic.

---

### 4. Overhauled Watermark Style Selector
* **Original Plan:** Standard textual style chips.
* **Actual Decision:**
  - Built interactive grid selector buttons with transparent manga drawings as backgrounds.
  - Created a Python script to crop out black borders from raw AI images and mask grayscales into pure transparent ink PNGs (`alpha = 255 - gray`).
  - Added theme-aware CSS image filters to adapt the selector backgrounds dynamically to Light, Tankobon (sepia), and Midnight (dark) themes.
* **Why:** Provides visual examples for style selections (Shonen, Seinen, Shojo, Chibi, etc.). Transparent alpha masking ensures background images adapt cleanly to the active theme without losing contrast or readability.

---

### 5. Post-Authentication Cache Recovery (UX Preservation)
* **Original Plan:** Guest users click login, losing any prompt they had typed.
* **Actual Decision:**
  - If a guest generates a sketch, the app caches the prompt, styles, seed, and base64 image URL in `localStorage` (`mangasketch_pending_upload`).
  - After logging in and redirecting to `/auth/callback`, the app reads this cache and calls a dedicated backend route handler to upload the base64 image directly to Supabase storage and persist the metadata.
* **Why:** Prevents users from losing their prompts and generated artwork during OAuth redirects. The sketch is recovered and saved to their sketchbook automatically, providing a seamless user experience.

---

### 6. Split-Server Entry Point Refactoring
* **Original Plan:** Single `server.ts` entry point binding to ports.
* **Actual Decision:** Split the Express backend into `app.ts` (defining routes, middleware, and Express configuration) and `index.ts` (binding to the network port).
* **Why:** In integration testing (Vitest + Supertest), the test runner needs to mount the Express app without listening on a physical port. Splitting these files prevents "address already in use" errors during parallel test execution.

---

### 7. Snappy Deletion & Asynchronous Invalidation Transitions
* **Original Plan:** Standard page refreshes or blocking waits during deletions.
* **Actual Decision:**
  - Refactored the detail page deletion to instantly close the modal and update the UI router state (navigating to the latest remaining version) *before* invalidating queries in the background (no `await`).
  - Reduced the deletion toast autohide duration in the Zustand store from 4000ms to 2500ms.
* **Why:** Keeps the UI responsive. Waiting for the database invalidation to resolve blocked page transitions. Running it asynchronously makes transitions instant, and a shorter toast duration matches the quick deletion flow.

---

### 8. Smart Input Change Detection
* **Original Plan:** The submit button is always active.
* **Actual Decision:**
  - Added a change listener comparing the current form state to the active sketch's parameters.
  - Displays a red `[ CHANGED ]` badge next to modified inputs.
  - Changes the submit button text from `NO CHANGES DETECTED` (disabled) to `SKETCH NEW VERSION` (enabled).
* **Why:** Prevents duplicate generations of identical sketches, saving API limits. It clearly informs users whether their current configuration will fork a new version or matches the loaded one.

---

### 9. Speech-Bubble Comic Tooltips
* **Original Plan:** Standard browser `title` tooltips or truncated text.
* **Actual Decision:** Created a custom monospace tooltip component styled like a manga speech bubble with thick borders, a flat box shape, and a tiny directional triangular notch.
* **Why:** Reinforces the manga theme. Replacing native browser tooltips with a thematic speech bubble makes viewing long prompts fun and matches the overall aesthetic.

---

### 10. Anti-Save & Drag Protection
* **Original Plan:** Standard HTML `<img>` elements.
* **Actual Decision:** Disabled right-clicks (`onContextMenu={(e) => e.preventDefault()}`) and image dragging (`draggable={false}`) on all canvases, overlays, and sketchbook thumbnails.
* **Why:** Protects platform artwork and simulates a premium environment. It encourages users to use the official "Download Panel" button, which applies the Hanko stamp watermark.

---

### 11. Unified Delete Confirmation Modal with Card Preview
* **Original Plan:** A generic text warning dialog.
* **Actual Decision:** Developed a unified `<DeleteConfirmationModal />` displaying a horizontal mini-card preview of the target sketch (portrait thumbnail on left, metadata + prompt on right, and a badge identifying if it is the original sketch or a child version).
* **Why:** Deleting an original sketch cascades and erases all child versions. Providing a detailed visual preview card prevents accidental deletion of entire sketch families.

---

### 12. Flat-Tree DB Versioning
* **Original Plan:** A nested tree hierarchy.
* **Actual Decision:** Flat-tree database design where all variations point directly to the original root sketch (`parent_id = root parent id`).
* **Why:** Avoids complex, recursive PostgreSQL queries (Common Table Expressions) that degrade query performance as version history grows. This flat-tree structure makes retrieving a sketch's entire version history fast and scalable.

---

### 13. Zustand for Global UI State
* **Original Plan:** React Context for sharing state.
* **Actual Decision:** Created a Zustand store (`useUiStore`) to manage loading, toast alerts, and navigation indicators.
* **Why:** Context triggers a full re-render of child components whenever any value changes. Zustand's selector-based subscription prevents layout updates, keeping page renders lightweight.

---

### 14. Retro 3-Mode Theme Switcher
* **Original Plan:** Standard Light/Dark mode.
* **Actual Decision:** Created three customized themes:
  - **Light Ink:** High-contrast white paper.
  - **Recycled Book / Tankobon:** Warm sepia paper color resembling vintage manga magazine print.
  - **Midnight Moon:** High-contrast dark mode.
* **Why:** Reduces eye strain during night reading. The Tankobon theme offers a nostalgic feel that matches cheap newsprint manga magazines like *Weekly Shōnen Jump*.

---

## 15. Actual App Journeys & Operations (High-Fidelity Flows)

These diagrams visualize the finalized actual architectures and request lifecycles implemented in the production codebase.

### A. Actual Generation Journey (POST /api/sketches)

This flowchart illustrates the end-to-end request loop for generating a new panel, including the backend sharp processing pipeline and the localStorage guest cache recovery flow:

```
User Browser                  Express Backend                Supabase Storage / DB
     │                               │                                 │
     ├── 1. POST /api/sketches ──────┼────────────────────────────────>│ [Verify Auth]
     │   - prompt, styles, seed      │                                 │ (optional)
     │                               ├── 2. Check Layer 1 Safety (Blocklist)
     │                               │
     │                               ├── 3. Build & Wrap Prompt (B&W instructions)
     │                               │
     │                               ├── 4. Request to Pollinations.ai (Model zimage)
     │                               │      Returns Raw Binary PNG Buffer
     │                               │
     │                               ├── 5. Post-Processing Pipeline (sharp):
     │                               │      - Force Grayscale Conversion (anti-leakage)
     │                               │      - Dynamic Hanko SVG stamp overlay
     │                               │
     │     ┌─────────────────────────┴─────────────────────────┐
     │     ▼ [Authenticated?]                                  ▼ [Guest/Anonymous?]
     │     │                                                   │
     │     ├── 6. Persist sketch:                              ├── 6. Returns base64
     │     │   - Upload PNG to Storage bucket                  │      Data URL directly
     │     │   - Save PostgreSQL record (parent/child)         │
     │     │                                                   ├── 7. Cache metadata & base64
     │     ├── 7. Returns saved payload                        │      in localStorage
     │     │                                                   │      (mangasketch_pending_upload)
     ▼     ▼                                                   ▼
[MangaCanvas]                                             [Stored in Browser Memory]
           │                                                   │
           │                                                   ├── 8. User Login (Google OAuth)
           │                                                   │      Redirect Callback
           │                                                   │
           │                                                   └── 9. POST /api/sketches (base64)
           │                                                          Directly uploaded to Storage
           │                                                          & saved to PostgreSQL
           ▼                                                   ▼
  [Sketch Secured! ✓]                                 [Sketchbook Recovered! ✓]
```

### B. Actual Deletion & Cleanup Journey (DELETE /api/sketches/:id)

This flowchart illustrates how a sketch or variation is permanently purged from the workspace. It details the cascading database purge and the bulk file deletion from cloud storage:

```
User Browser                  Express Backend                Supabase Storage / DB
     │                               │                                 │
     ├── 1. DELETE /api/sketches/:id ┼────────────────────────────────>│ [Verify Auth & Ownership]
     │   - Bearer JWT Token          │                                 │
     │                               ├── 2. Check UUID ID Format       │
     │                               │
     │                               ├── 3. Query image metadata:      │
     │                               │      Retrieve image URL for     │
     │                               │      target sketch & all sibling│
     │                               │      versions.                  │
     │                               │                                 │
     │                               ├── 4. Send DB Delete Query ─────>│ [PostgreSQL Engine]
     │                               │                                 │ Delete main sketch record.
     │                               │                                 │ (ON DELETE CASCADE
     │                               │                                 │  automatically purges all
     │                               │                                 │  child version records).
     │                               │                                 │
     │                               ├── 5. Parse & Extract Filepath:  │
     │                               │      Extract clean storage path │
     │                               │      from image URL             │
     │                               │      (e.g., 'user-id/file.png') │
     │                               │                                 │
     │                               ├── 6. Bulk delete image files ──>│ [Supabase Storage Bucket]
     │                               │      from Storage.              │ Purge all associated files
     │                               │                                 │ in cloud storage.
     │                               │                                 │
     │     ┌─────────────────────────┴─────────────────────────┘
     │     ▼
     ├── 7. Returns 200 OK (success: true)
     │
     ├── 8. UI Handler:
     │      - Close delete modal instantly.
     │      - Show Snappy Toast (auto-hide 2.5s).
     │      - Invalidate TanStack query cache in background (async).
     │      - Redirect router to remaining version or to /sketches.
     ▼
[UI Updated Successfully]
```
