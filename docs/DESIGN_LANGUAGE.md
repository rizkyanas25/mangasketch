# MangaSketch - Design Language

> This document defines the visual language for MangaSketch. The goal is to make the web app feel like a digital manga sketchbook that came to life.

Reference: Stitch project "MangaSketch AI Generator"

---

## Design Philosophy

The interface should feel like opening a professional mangaka's draft book. Every element, from buttons to cards to loading states, should feel hand-crafted with ink on paper. The aesthetic is **Neo-Brutalist Manga** with strict black-and-white palette, screentone textures, and angular panel-inspired layouts.

Key principle: **the niche shapes the product**. This is not a generic AI tool with a manga label. The entire UI language speaks manga.

---

## Color Palette

Strictly black and white. No color accents except for destructive actions (red).

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#000000` | Text, borders, filled buttons, ink elements |
| `secondary` | `#FFFFFF` | Backgrounds, inverted text, card surfaces |
| `neutral` | `#767676` | Muted text, secondary labels, disabled states |
| `neutral-light` | `#E5E5E5` | Borders, dividers, subtle separators |
| `neutral-lighter` | `#F5F5F5` | Background tints, card hover states |
| `screentone` | `dot pattern overlay` | Mid-tone texture, background depth |
| `destructive` | `#DC2626` | Delete actions only |

### Screentone Patterns

Instead of flat grays for mid-tones, use manga-style screentone dot patterns. Apply as CSS background patterns or SVG overlays on:
- Hero section background
- Empty state areas
- Card hover states
- Section dividers

---

## Typography

Three-font system that balances impact, readability, and technical precision.

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Headline** | Anton | 400 (regular) | Page titles, hero text, dramatic headings. Always uppercase. |
| **Body** | Libre Franklin | 400, 500, 600 | Body text, descriptions, prompt text, UI labels |
| **Label/Mono** | Space Mono | 400, 700 | Technical data, prompt display, metadata, timestamps |

### Scale

| Token | Size | Line Height | Font | Usage |
|-------|------|-------------|------|-------|
| `display` | 48px | 52px | Anton | Hero heading |
| `display-mobile` | 32px | 36px | Anton | Hero heading (mobile) |
| `heading-lg` | 32px | 36px | Anton | Page titles ("MY SKETCHBOOK") |
| `heading-md` | 24px | 28px | Anton | Section titles |
| `heading-sm` | 18px | 24px | Libre Franklin 600 | Card titles, sub-sections |
| `body-lg` | 16px | 24px | Libre Franklin 400 | Primary body text |
| `body-md` | 14px | 20px | Libre Franklin 400 | Secondary body text |
| `body-sm` | 12px | 16px | Libre Franklin 400 | Captions, timestamps |
| `mono-md` | 14px | 20px | Space Mono 400 | Prompt display, metadata |
| `mono-sm` | 12px | 16px | Space Mono 400 | Technical labels, badges |

---

## Layout

### Navigation (Simplified from Stitch)

**Top navbar only, no sidebar.** 

* **For Anonymous/Logged-out Users:**
```
┌─────────────────────────────────────────────────────────┐
│  MANGASKETCH                                    [Login] │
└─────────────────────────────────────────────────────────┘
```

* **For Logged-in Users:**
```
┌─────────────────────────────────────────────────────────┐
│  MANGASKETCH          MY SKETCHBOOK            [Logout] │
└─────────────────────────────────────────────────────────┘
```

- **Logo "MANGASKETCH"** in Anton, uppercase, left-aligned. Clicking the logo always returns to the Generator (Home) page.
- **"MY SKETCHBOOK" link** (Libre Franklin 600) only visible to logged-in users, placed next to the logo.
- **Action Button** on the far right: Shows "LOGIN" for anonymous users and "LOGOUT" (or user avatar with dropdown) for logged-in users.
- No other submenus (Tools, Drafts, Settings).

### Page Structure

All pages use a centered container with max-width 1200px.

```
Outer background: white (#FFFFFF) with subtle screentone texture
├── Navbar (full width, white bg, black bottom border 2px)
├── Content container (max-width: 1200px, centered)
│   └── Page content
└── No footer needed (minimal)
```

### Spacing Scale (8px base)

| Token | Value |
|-------|-------|
| `space-xs` | 4px |
| `space-sm` | 8px |
| `space-md` | 16px |
| `space-lg` | 24px |
| `space-xl` | 32px |
| `space-2xl` | 48px |
| `space-3xl` | 64px |

---

## Components

### Buttons

4 variants from the design system:

| Variant | Background | Border | Text | Usage |
|---------|-----------|--------|------|-------|
| **Primary** | `#000000` | none | `#FFFFFF` | "GENERATE PANEL", main actions |
| **Secondary** | `#FFFFFF` | 2px solid `#000000` | `#000000` | Secondary actions |
| **Inverted** | `#FFFFFF` | none | `#000000` | Actions on dark backgrounds |
| **Outlined** | transparent | 1px solid `#767676` | `#767676` | Tertiary/subtle actions |

All buttons:
- No border radius (0px, sharp corners)
- Uppercase text in Libre Franklin 600 or Anton
- Padding: 12px 24px
- Hover: invert colors (primary becomes white bg + black text)
- Active: slight scale down (transform: scale(0.98))

### "GENERATE PANEL" Button (Special)

The main generate button should be extra dramatic:
- Full width of the form area
- Larger padding (16px 32px)
- Anton font, uppercase
- Pencil/pen icon before text
- Black background, white text

### Cards (Manga Panels)

Gallery cards look like manga panels:

```
┌──────────────────────────┐  <- 2px solid black border
│                          │
│      [Image Area]        │
│                          │
├──────────────────────────┤  <- 1px divider
│ CYBERPUNK    OCT 19,2023 │  <- Style badge + date in Space Mono
│                          │
│ "Ronin samurai standing  │  <- Prompt text in Libre Franklin
│  under a dead cherry..." │
│                          │
│ DETAILS        ♡    ↗    │  <- Actions
└──────────────────────────┘
```

- Border: 2px solid black
- Border radius: 0px (sharp corners)
- Background: white
- Image aspect ratio: 3:4 (portrait, manga proportion)
- Hover: subtle screentone overlay or slight shadow offset

### Style Preset Chips

Manga-style toggle chips for selecting styles across two independent dimensions:

1. **Manga Style** (Storytelling & Aesthetic):
```
[■ SHONEN]  [□ SEINEN]  [□ SHOJO]  [□ CHIBI]
```

2. **Drawing Style** (Artistic Development Stage):
```
[■ ROUGH SKETCH]  [□ CLEAN LINE ART]  [□ INKED MANGA]  [□ DETAILED ILLUSTRATION]
```

* Selected: black fill, white text
* Unselected: white fill, black border 2px, black text
* No border radius (0px)
* Space Mono font, uppercase
* Padding: 8px 16px

### Prompt Input

Large textarea that looks like it belongs in a sketchbook:

```
┌─────────────────────────────────────────────┐
│ DESCRIBE YOUR PANEL SCENE...                │  <- Placeholder in Space Mono
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

- Border: 2px solid black
- No border radius
- Font: Libre Franklin 400, 16px
- Placeholder: Space Mono, uppercase, #767676
- Focus state: border stays 2px, add subtle black outer shadow (0 0 0 2px black)
- Min height: 120px

### Custom Watermark (Hanko Stamp)

Users can optionally add a customized watermark to their generated sketches, styled as a traditional Japanese Hanko Stamp:

*   **Design**: A red round seal stamp, featuring:
    *   Constant Katakana in the center: **マンガスケッチ** (MangaSketch) split into two vertical columns ("マンガ" on the right, "スケッチ" on the left).
    *   Filled red segment at the bottom displaying the user's custom name in white uppercase text (1-4 characters, e.g. "JOHN").
*   **Aesthetic Details**: Red color `#D9383A` with a subtle transparency (`opacity: 0.85`), placed diagonally in one of the 4 corners of the panel.
*   **Controls in Form**:
    *   Input: Text input, uppercase constraint, placeholder "JOHN" (max 4 characters).
    *   Position: A 2x2 grid selector representing the 4 corners: `TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT`, and `BOTTOM_RIGHT`.

### Search Input

```
┌──────────────────────────┐
│ 🔍 Search                │
└──────────────────────────┘
```

- Border: 1px solid #767676
- No border radius
- Libre Franklin font

---

## Pages

### 1. Home / Generate Page (`/`)

**Simplified from Stitch**: No sidebar, top navbar only.

```
┌─────────────────────────────────────────────────────────┐
│  MANGASKETCH                                    [Login] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── screentone bg ──────────────────────────────────┐ │
│  │                                                     │ │
│  │   TURN YOUR MANGA IDEAS INTO                        │ │
│  │   VISUAL CONCEPTS IN SECONDS                        │ │
│  │                                                     │ │
│  │   Visualizer for mangaka. Sketch layouts,           │ │
│  │   character designs, tonal ink and screentone.      │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ DESCRIBE YOUR PANEL SCENE...                        │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  MANGA STYLE:                                           │
│  [■ SHONEN] [□ SEINEN] [□ SHOJO] [□ CHIBI]              │
│                                                         │
│  DRAWING STYLE:                                         │
│  [■ ROUGH] [□ CLEAN] [□ INKED] [□ DETAILED]             │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            ✏️  GENERATE PANEL                        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │           YOUR PANELS WILL APPEAR HERE              │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  (anonymous users see:)                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  🔒 Login to save this to your sketchbook           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Sketchbook Page (`/sketches`)

**Naming: "MY SKETCHBOOK"** (from Stitch design)

```
┌─────────────────────────────────────────────────────────┐
│  MANGASKETCH          MY SKETCHBOOK            [Logout] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MY SKETCHBOOK                          [Recent ▼]      │
│  A collection of generated panels crafted               │
│  with G-pen precision.                                  │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │         │  │         │  │         │  │         │   │
│  │  img    │  │  img    │  │  img    │  │  img    │   │
│  │         │  │         │  │         │  │         │   │
│  ├─────────┤  ├─────────┤  ├─────────┤  ├─────────┤   │
│  │ SHONEN •│  │ SEINEN •│  │ SHOJO • │  │ CHIBI • │   │
│  │ ROUGH   │  │ INKED   │  │ CLEAN   │  │ DETAILED│   │
│  │ DETAILS │  │ DETAILS │  │ DETAILS │  │ DETAILS │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                         │
│              INKING MORE PANELS...                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- 4 columns on desktop, 2 on tablet, 1 on mobile
- Cards use manga panel style (thick black border, no radius)
- Infinite scroll with "INKING MORE PANELS..." text
- Empty state: manga illustration + "No sketches yet. Start creating!"

### 3. Detail Page (`/sketches/[id]`)

**Simplified from Stitch**: Remove stroke weight slider, screentone density selector, production data. Keep: image, prompt, re-generate form, version history.

```
┌─────────────────────────────────────────────────────────┐
│  MANGASKETCH          MY SKETCHBOOK            [Logout] │
├─────────────────────────────────────────────────────────┤
│  ← BACK TO SKETCHBOOK                                   │
│  PANEL #042                                             │
│                                                         │
│  ┌───────────────────┐  ┌──────────────────────────┐    │
│  │                   │  │ MANGAKA PROMPT            │    │
│  │                   │  │                           │    │
│  │                   │  │ "Cybernetic samurai       │    │
│  │    [Main Image]   │  │  standing in rain,        │    │
│  │                   │  │  tokyo skyline..."        │    │
│  │                   │  │                           │    │
│  │                   │  │ [SEINEN] [ROUGH] [SEED:739]│    │
│  │                   │  ├──────────────────────────┤    │
│  │                   │  │ ✏️ RE-INK PANEL           │    │
│  │                   │  │                           │    │
│  │                   │  │ [Edit prompt area...]     │    │
│  │                   │  │                           │    │
│  │                   │  │ MANGA: [■ SEINEN] [□ SHOJ]│    │
│  │                   │  │ INK: [■ CLEAN] [□ INKED]  │    │
│  │                   │  │ [ ] LOCK VARIATION (SEED) │    │
│  └───────────────────┘  │ [REGENERATE PANEL]        │    │
│                         └──────────────────────────┘    │
│  Created: Oct 12, 2023   Seed: 7394827419               │
│                                                         │
│  INKING PROCESS (version history)                       │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ v01    │  │ v02    │  │ v03    │  │ v04 ★  │       │
│  │ rough  │  │ clean  │  │ lines  │  │ final  │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
└─────────────────────────────────────────────────────────┘
```

- Two column layout: image left, prompt + re-generate right
- "INKING PROCESS" section shows version history (horizontal scroll)
- Current version marked with ★
- Click on any version to load that prompt

---

## States

### Loading State: "Sketching your idea..."

From the Stitch design, the loading state should feel like watching an artist draw.

```
┌─────────────────────────────────────────┐
│                                         │
│            ✏️ (pen animation)            │
│                                         │
│        Sketching your idea...           │  <- Libre Franklin italic
│                                         │
│   REFINING INK STROKES...              │  <- Space Mono, muted
│                                         │
│   "Patience is the tool of the         │  <- Quote, subtle
│    master mangaka."                     │
│                                         │
└─────────────────────────────────────────┘
```

- Animated pen/pencil icon (CSS animation)
- Progress text that changes: "Sketching...", "Refining ink strokes...", "Adding screentone..."
- Optional manga quote for long waits
- Disable generate button during loading

### Error States: Manga Drama Panels

Each error is a dramatic manga panel:

**Invalid Prompt (empty/too long)**
```
┌─────────────────────────────────────────┐
│         ⚠️                               │
│                                         │
│   BLANK PAGE!                           │  <- Anton, dramatic
│                                         │
│   Every great manga starts with        │
│   a prompt. Please describe your        │
│   scene.                                │
│                                         │
└─────────────────────────────────────────┘
```

**API Timeout**
```
┌─────────────────────────────────────────┐
│         💀                               │
│                                         │
│   CONNECTION SEVERED!                   │  <- Anton, dramatic
│                                         │
│   The ink has dried up. The server      │
│   is not responding.                    │
│                                         │
│   [RETRY]                              │
│                                         │
└─────────────────────────────────────────┘
```

**Broken Response / Data Corruption**
```
┌─────────────────────────────────────────┐
│         💔                               │
│                                         │
│   DATA CORRUPTION                       │  <- Anton, dramatic
│                                         │
│   Inconsistent panel generated.         │
│   The drawing board is distorted.       │
│                                         │
│   [SCRAP DRAFT]                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Manga-Specific Naming Convention

Use manga/mangaka terminology throughout the UI instead of generic tech terms:

| Generic Term | MangaSketch Term |
|---|---|
| Generate | **Generate Panel** |
| Re-generate | **Re-ink Panel** |
| Gallery | **My Sketchbook** |
| Image | **Panel** |
| Loading | **Sketching your idea...** |
| Infinite scroll loading | **Inking more panels...** |
| Version history | **Inking Process** |
| Prompt | **Mangaka Prompt** |
| Style presets | **Manga Style & Drawing Style** |
| Save | **Save to Sketchbook** |
| Detail page | **Panel #[number]** |
| Error | Dramatic manga titles (see above) |

---

## Responsive Breakpoints

| Breakpoint | Width | Columns | Notes |
|---|---|---|---|
| Mobile | < 640px | 1 column | Stack everything vertically |
| Tablet | 640px - 1024px | 2 columns | Gallery 2-col, detail stacks |
| Desktop | > 1024px | 4 columns | Full layout as designed |

---

## CSS & Styling Considerations

Tailwind CSS (v4) is our **primary styling method**. We will maximize Tailwind utility classes for all elements (layout, colors, spacing, typography, states, transitions). Custom CSS is reserved only for features that Tailwind cannot cover, which will be implemented in `src/app/globals.css`.

### 1. Tailwind Implementation Examples
* **Manga Panel Cards**: `border-2 border-black bg-white rounded-none hover:bg-neutral-lighter active:scale-[0.98] transition-all`
* **Primary Speech Button**: `bg-black text-white px-6 py-3 font-semibold uppercase hover:bg-white hover:text-black hover:border-2 hover:border-black active:scale-95 transition-all`
* **Toggle Chips**: `border-2 border-black px-4 py-2 font-mono text-xs uppercase transition-colors`
* **Container**: `max-w-6xl mx-auto px-4`

### 2. Custom CSS Utilities (in globals.css)
For mid-tones, global sharp resets, and custom sketches:

```css
/* Screentone Dot Pattern Overlay */
.bg-screentone {
  background-image: radial-gradient(circle, #000 0.5px, transparent 0.5px);
  background-size: 8px 8px;
  opacity: 0.05;
}

/* Global Reset: Force sharp corners on all elements (including third-party libraries) */
* {
  border-radius: 0px !important;
}

/* Custom G-pen Sketching Animation */
@keyframes sketch {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(2px, -3px) rotate(5deg); }
  50% { transform: translate(-1px, 2px) rotate(-5deg); }
  75% { transform: translate(3px, 1px) rotate(3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
.animate-sketching {
  animation: sketch 0.5s infinite linear;
}
```

### 3. Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Libre+Franklin:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
```

---

## User Flows & Edge Cases

### 1. Post-Auth Synced Sketch Flow (Anonymous to Logged-in)
* **Problem**: Anonymous users generate a sketch and want to save it, but logging in via Supabase Google OAuth requires a page redirect, which would normally wipe out the generated image from React state.
* **Solution**: 
  1. When an anonymous user generates a sketch, the frontend caches the metadata (prompt, `mangaStyle`, `drawingStyle`, and the temporary base64 image data) in `localStorage` under a key like `mangasketch_temp_generation`.
  2. When the user clicks "Login to save this to your sketchbook", they are redirected to Google Sign-in.
  3. Upon successful redirect back to the app, the frontend checks `localStorage` for `mangasketch_temp_generation` and checks if the user is now authenticated.
  4. If authenticated, the frontend automatically triggers a background request to upload the cached base64 image to Supabase Storage, saves the record to the database under their UID, removes the item from `localStorage`, and displays a toast notification: *"Saved your last sketch to My Sketchbook!"*.

### 2. Interactive Version History ("Inking Process")
* Clicking on any past version card (e.g. `v01 (Rough Sketch)`) in the "Inking Process" timeline on the Detail page will:
  - Load that version's main image into the detail viewport.
  - Pre-populate the **Re-ink Panel** form with that version's exact prompt text, Manga Style, and Drawing Style, making it easy to fork or refine from any historical step.
* The active/selected version in the timeline is highlighted with a bold black border and a star `★`.

---

## Screenshots Reference

Stitch project: "MangaSketch AI Generator"
Screens generated:
1. Generator Page (home + prompt form)
2. Gallery Page (sketchbook grid)
3. Detail Page (panel view + re-ink)
4. System States (loading, errors, empty)

