# Style Selector Pill Background Images — Implementation Guide

> **Purpose**: This document captures every decision from our design discussion so any developer or AI model can implement this feature exactly as intended, without deviation.
>
> **Project**: MangaSketch — a Neo-Brutalist Manga AI Sketch Generator
> **Stack**: Next.js 16 + Tailwind CSS v4 + TypeScript
> **Design Reference**: [DESIGN_LANGUAGE.md](/Users/rizkyanasbukhori/PlayWorks/mangasketch/docs/DESIGN_LANGUAGE.md)

---

## 1. Context: What Are We Building?

The MangaSketch app has a **StyleSelector** component with 8 pills (buttons) across 2 categories:

### Manga Style (Storytelling & Aesthetic) — 2×2 grid
| Pill | Meaning |
|------|---------|
| `SHONEN` | Action, energy, youth (Dragon Ball, Naruto) |
| `SEINEN` | Mature, dark, detailed (Berserk, Vinland Saga) |
| `SHOJO` | Romance, sparkle, emotional (Sailor Moon, Fruits Basket) |
| `CHIBI` | Cute, deformed, comedic (4-koma gag manga) |

### Drawing Style (Artistic Development Stage) — 2×2 grid
| Pill | Meaning |
|------|---------|
| `ROUGH_SKETCH` | Pencil construction lines, loose and raw |
| `CLEAN_LINE_ART` | Precise single-weight outlines, no shading |
| `INKED_MANGA` | G-pen bold strokes, heavy shadows (kakeami) |
| `DETAILED_ILLUSTRATION` | Full render — cross-hatching, screentone, complete |

### Current Pill Appearance
- **Unselected**: white bg, black border (2px), black text
- **Selected**: black bg, black border, white text (inverted)
- **Size**: ~150×50px each, `py-5 px-3`, `font-mono text-xs font-bold uppercase`
- **Layout**: `grid grid-cols-2 gap-2` (2 per row)
- **Hover**: `hover:bg-screentone` (existing screentone dot pattern bg)

### Goal
Add **subtle manga-style background images** to each pill that visually communicate what the style does, without breaking text readability. The images act as watermark-like decorations.

---

## 2. Design Decision History (Why Images, Not CSS Patterns)

We evaluated 3 approaches:

| Approach | Verdict | Reason |
|----------|---------|--------|
| **Option 1: Dynamic Preview Card** | ❌ Rejected | Too much visual noise in tight form layout. 8 preview assets. Misleading risk. |
| **Option 2: Pure CSS gradient patterns** | ❌ Rejected | At 10-15% opacity on a 150×50px pill, geometric patterns (lines, dots, grids) are barely noticeable. Looks like monitor glitch, not manga. |
| **Option 2.5: Real manga images as bg** | ✅ Chosen | Immediately communicates the style. More impactful. Premium feel. |

### Key constraints we agreed on:
1. Images must be **transparent background** PNGs
2. Images must be **theme-aware** (3 themes: Light Ink, Tankobon, Midnight Moon)
3. Images must **not reduce text readability** — positioned as subtle watermarks
4. Images must be **visually consistent** across all 8 pills (same art weight, same level of detail)
5. **No existing CSS pattern reuse** — we have `.manga-speedlines` and `.bg-screentone` elsewhere. Do NOT use these on pills.

---

## 3. Image Specifications

### 3.1 What to Generate for Each Pill

#### MANGA STYLE images — use **character faces/expressions** from specific series:

| Style | Series Reference | Image Subject | Art Direction |
|-------|-----------------|--------------|---------------|
| **SHONEN** | **One Piece** (Luffy) | Luffy's face/head — fierce grin, straw hat silhouette, determined eyes. Can include small speed line fragments around him. | Bold confident lines. High energy. Signature straw hat must be recognizable even at small size. The expression should scream "adventure". |
| **SEINEN** | **Vinland Saga** (Thorfinn) | Thorfinn's face — battle-hardened expression, heavy shadow/screentone across face, intense narrow eyes. | Moody, heavily inked. Dense cross-hatching for shadows. The face should feel weathered and serious. Lots of ink weight variation. |
| **SHOJO** | **Sailor Moon** (Usagi) | Usagi's face — iconic large sparkly eyes with star reflections (kirameki), flowing hair strands, magical girl aesthetic. | Beautiful, delicate linework. Multiple light reflections in pupils. Soft detailed eyelashes. Romantic and dreamy feel. |
| **CHIBI** | **Crayon Shin-chan** (Shinnosuke) | Shin-chan's iconic face — super simple circle head, thick eyebrows, tiny dot eyes, signature expression. | Extremely minimal. Thick simple outlines. Almost no detail — that's the point. Instantly recognizable silhouette even at 70px. |

> **Note on likeness**: AI generators will produce "inspired by" results, not exact copies of copyrighted characters. The vibe and energy is what matters, not pixel-perfect likeness.

#### DRAWING STYLE images — use **tool/technique visual metaphors**:

| Style | Image Subject | Art Direction |
|-------|--------------|---------------|
| **ROUGH_SKETCH** | Loose pencil construction lines — overlapping circles/ovals (head construction), rough guide lines | Messy, multiple strokes. Blue or grey pencil feel. Show the "skeleton" of a drawing before cleanup. |
| **CLEAN_LINE_ART** | A single clean, confident ink line — maybe a hair strand silhouette or face profile outline | Minimal. One smooth unbroken line. No shading. Pure precision. Like a G-pen calligraphy stroke. |
| **INKED_MANGA** | Bold ink splatter or thick kakeami (cross-hatching) shadow block | Heavy black areas. Ink drips. G-pen weight variation. Raw ink energy. |
| **DETAILED_ILLUSTRATION** | Dense micro cross-hatching forming a gradient shadow, or fine screentone dots blending into linework | Complex, layered. Multiple techniques visible. The "finished product" feel. |

### 3.2 Image Generation Rules

> **CRITICAL — Read this before generating any images:**

1. **Style**: All 8 images MUST be in **black and white manga ink style** — NO color, NO grayscale gradients. Pure black lines on transparent background.
2. **Dimensions**: Generate at **256×256px** minimum. They'll be displayed at ~70×70px but retina screens need the resolution.
3. **Background**: **Transparent** (PNG with alpha channel). If the generation tool can't do transparent, generate on pure white and we'll remove the bg later.
4. **Consistency**: All 8 images should look like they were drawn by the **same mangaka**. Same ink weight, same line quality. Don't mix photorealistic with cartoon.
5. **Simplicity**: These are SMALL background watermarks. Don't over-detail. The image will be displayed at ~70px with 12% opacity. Complex details will turn into noise.
6. **Orientation**: The subject should be facing LEFT or be positioned in the RIGHT portion of the canvas (because it will be placed at the right side of the pill, and text is on the left).
7. **Character images (manga style pills)**: Show face/head only — NOT full body. The face should be recognizable even as a tiny 70px watermark.

### 3.3 File Naming & Location

Save all images to:
```
/apps/web/public/assets/styles/
├── pill-shonen.png      (Luffy face)
├── pill-seinen.png      (Thorfinn face)
├── pill-shojo.png       (Usagi face)
├── pill-chibi.png       (Shin-chan face)
├── pill-rough.png       (construction lines)
├── pill-clean.png       (single ink line)
├── pill-inked.png       (ink splatter)
└── pill-detailed.png    (cross-hatch mesh)
```

### 3.4 Image Positioning Inside Pills

The image sits at the **bottom-right** of the pill, slightly overflowing the bounds (clipped by `overflow-hidden`). Text is **left-aligned** so it never overlaps the image.

#### Unselected Pill (bg: white, text: black)
```
┌─────────────────────────────────┐
│                                 │
│  SHONEN              ░░░░░░░   │  ← image at 12% opacity
│                      ░░▓▓░░░   │    (black silhouette via filter)
│                      ░░░░░░░   │
│  ← text-left         ↗ img →   │
│     z-10          right:-4px   │
└─────────────────────────────────┘
   overflow-hidden clips anything past the border
```

#### Selected Pill (bg: black, text: white)
```
┌─────────────────────────────────┐
│ ████████████████████████████████│
│ █ SHONEN █████████████░░░░░░░██│  ← image at 20% opacity
│ █████████████████████░░▓▓░░░██│    (white silhouette via filter)
│ █████████████████████░░░░░░░██│    slightly scaled up (1.05x)
│ ████████████████████████████████│
└─────────────────────────────────┘
```

#### CSS Positioning Breakdown:
```
.pill-style-img {
  position: absolute;     ← relative to button (parent has `relative`)
  right: -4px;            ← slightly overflows right edge
  bottom: -4px;           ← slightly overflows bottom edge
  width: 70px;            ← ~45% of pill width
  height: 70px;           ← taller than pill height (clipped)
  z-index: 0;             ← behind text (text is z-10)
}
```

#### Why bottom-right?
- Text reads left-to-right → user's eye hits text first
- Image acts as secondary visual cue, not primary content
- Slight overflow (-4px) creates dynamic "breaking the panel" manga feel
- `overflow-hidden` on button keeps it contained

#### Edge Case: Long Text (e.g. "DETAILED ILLUSTRATION")
```
┌─────────────────────────────────┐
│                                 │
│  DETAILED           ░░░░░░░    │  ← text wraps naturally
│  ILLUSTRATION       ░░▓▓░░░   │    image stays at right
│                     ░░░░░░░    │    no collision because
│                                │    text-left + z-10
└─────────────────────────────────┘
```

---

## 4. CSS Implementation

### 4.1 Theme-Aware Filter System

Add to `/apps/web/src/app/globals.css` — use **plain CSS classes** (NOT `@utility` blocks) for consistency with existing codebase:

```css
/* ==========================================================================
   Style Selector Pill Background Images — Theme-Aware Filters
   ========================================================================== */

/* Base class for manga pill background images */
.pill-style-img {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 70px;
  height: 70px;
  object-fit: contain;
  pointer-events: none;
  opacity: 0.12;
  filter: var(--pill-img-filter);
  transition: all 0.15s ease-in-out;
  z-index: 0;
}

/* When pill is SELECTED (bg is dark/foreground color) → image must become light */
.pill-style-img-selected {
  opacity: 0.2;
  filter: brightness(0) invert(1);
  transform: scale(1.05);
}
```

### 4.2 Theme Filters (add to existing theme definitions)

The app has 3 themes defined via `data-theme` attribute on `<html>`. Add the `--pill-img-filter` variable to each:

```css
/* Light Ink (default) — force image to pure black */
:root, [data-theme="light-ink"] {
  --pill-img-filter: brightness(0);
}

/* Tankobon — force image to dark brown ink */
[data-theme="tankobon"] {
  --pill-img-filter: brightness(0) sepia(1) saturate(0.8) brightness(0.35);
}

/* Midnight Moon — force image to pure white */
[data-theme="midnight-moon"] {
  --pill-img-filter: brightness(0) invert(1);
}
```

> **WHY this filter approach?**
> - `brightness(0)` forces ANY image to pure black first (normalize)
> - Then `sepia()` / `invert()` / etc. transform from that black baseline
> - This is MORE reliable than complex filter chains with magic numbers
> - `var(--pill-img-filter)` auto-switches when theme changes

### 4.3 Selected State Filter Logic

When a pill is selected:
- **Unselected pill**: bg=white, text=black → image is black (via theme filter) at 12% opacity
- **Selected pill**: bg=black, text=white → image MUST become white at 20% opacity

We handle this by overriding the filter to `brightness(0) invert(1)` which ALWAYS produces white, regardless of theme. This is applied via the `.pill-style-img-selected` class.

> **IMPORTANT**: Do NOT use just `invert(1)` alone. If the source image has colors or grays, `invert(1)` alone produces unpredictable results. Always normalize with `brightness(0)` first.

---

## 5. React Implementation

### 5.1 StyleSelector.tsx Changes

The current button rendering in `StyleSelector.tsx` looks like this:

```tsx
{MANGA_STYLES.map((style) => (
  <button
    type='button'
    key={style}
    disabled={disabled}
    onClick={() => setMangaStyle(style)}
    className={`font-mono text-xs font-bold px-3 py-5 border-2 border-foreground uppercase text-center rounded-none transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${
      mangaStyle === style
        ? 'bg-foreground text-background'
        : 'bg-background text-foreground ' +
          (disabled ? '' : 'hover:bg-screentone')
    }`}
  >
    {style}
  </button>
))}
```

**Change to:**

```tsx
// Map style names to their image paths
const MANGA_STYLE_IMAGES: Record<MangaStyle, string> = {
  SHONEN: '/assets/styles/pill-shonen.png',
  SEINEN: '/assets/styles/pill-seinen.png',
  SHOJO: '/assets/styles/pill-shojo.png',
  CHIBI: '/assets/styles/pill-chibi.png',
};

const DRAWING_STYLE_IMAGES: Record<DrawingStyle, string> = {
  ROUGH_SKETCH: '/assets/styles/pill-rough.png',
  CLEAN_LINE_ART: '/assets/styles/pill-clean.png',
  INKED_MANGA: '/assets/styles/pill-inked.png',
  DETAILED_ILLUSTRATION: '/assets/styles/pill-detailed.png',
};

// Then in the button rendering:
{MANGA_STYLES.map((style) => {
  const isSelected = mangaStyle === style;
  return (
    <button
      type='button'
      key={style}
      disabled={disabled}
      onClick={() => setMangaStyle(style)}
      className={`relative overflow-hidden font-mono text-xs font-bold px-3 py-5 border-2 border-foreground uppercase text-left rounded-none transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isSelected
          ? 'bg-foreground text-background'
          : 'bg-background text-foreground ' +
            (disabled ? '' : 'hover:bg-screentone')
      }`}
    >
      {/* Text always on top */}
      <span className='relative z-10'>{style}</span>

      {/* Background style image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MANGA_STYLE_IMAGES[style]}
        alt=''
        aria-hidden='true'
        className={`pill-style-img ${isSelected ? 'pill-style-img-selected' : ''}`}
      />
    </button>
  );
})}
```

> **Key changes from current code:**
> 1. Added `relative overflow-hidden` to button (for absolute image positioning)
> 2. Changed `text-center` to `text-left` (text goes left, image goes right)
> 3. Wrapped text in `<span className='relative z-10'>` (keeps text above image)
> 4. Added `<img>` with `.pill-style-img` class
> 5. Apply same pattern for DRAWING_STYLES with `DRAWING_STYLE_IMAGES` map

---

## 6. Visual Checklist

After implementation, verify each of these:

### Per-Pill Checks
- [ ] Each pill shows its background image at bottom-right
- [ ] Text is fully readable on all 8 pills
- [ ] Image opacity is ~12% when unselected
- [ ] Image opacity increases to ~20% when selected
- [ ] Image color inverts correctly when selected (becomes white on dark bg)

### Theme Checks
- [ ] **Light Ink** (default): Images appear as black silhouettes
- [ ] **Tankobon**: Images appear as dark brown/sepia silhouettes
- [ ] **Midnight Moon**: Images appear as white silhouettes

### State Checks
- [ ] Hover state (`bg-screentone`) doesn't conflict with image
- [ ] Disabled state dims everything including image
- [ ] Transition between selected/unselected is smooth (0.15s)

### Responsiveness
- [ ] Images don't break pill layout on mobile
- [ ] Images stay contained within pill bounds (`overflow-hidden`)

---

## 7. DO's and DON'Ts

### DO:
- ✅ Use plain CSS classes (`.pill-style-img`) — consistent with existing globals.css
- ✅ Use `brightness(0)` as first step in ALL filter chains (normalizes to black)
- ✅ Use `pointer-events: none` on images (don't steal clicks)
- ✅ Use `aria-hidden='true'` and empty `alt=''` on images (decorative only)
- ✅ Keep images at ~70×70px display size with 12% opacity
- ✅ Position images at bottom-right of pill
- ✅ Make text `relative z-10` to stay above image

### DON'T:
- ❌ Don't reuse existing CSS patterns (`manga-speedlines`, `bg-screentone`) on pills
- ❌ Don't use `@utility` blocks — use plain CSS classes
- ❌ Don't use complex magic-number filter chains — keep filters simple and predictable
- ❌ Don't use just `invert(1)` without `brightness(0)` first
- ❌ Don't use colored images — all source images must be black-on-transparent
- ❌ Don't make images too large or too detailed — they're watermarks, not features
- ❌ Don't add CSS patterns (gradients, repeating patterns) — we specifically chose images over patterns
- ❌ Don't change the pill layout (2×2 grid, py-5, etc.) — those were carefully designed

---

## 8. Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `apps/web/src/app/globals.css` | MODIFY | Add `.pill-style-img`, `.pill-style-img-selected`, and `--pill-img-filter` per theme |
| `apps/web/src/components/StyleSelector.tsx` | MODIFY | Add image maps, `relative overflow-hidden` to buttons, `<img>` elements, text wrapping |
| `apps/web/public/assets/styles/*.png` | NEW (8 files) | 8 transparent PNG images for each style |

---

## 9. Current App Theme System Reference

The app uses `data-theme` on the `<html>` element. Themes are defined in `globals.css` with CSS custom properties. The key foreground/background variables:

```
Light Ink:     --foreground: #000000, --background: #FFFFFF
Tankobon:      --foreground: #2B2421, --background: #F4EBE1
Midnight Moon: --foreground: #E8E8E8, --background: #0D0D0D
```

Theme switching is handled by `ThemeProvider.tsx` which toggles `data-theme` attribute.

---

## 10. Image Generation Prompt Templates

If using an AI image generation tool, use these prompts:

### Manga Style Prompts (Character-Specific):
```
SHONEN (Luffy — One Piece):
"Monkey D. Luffy face and head, straw hat, fierce determined grin showing teeth, shonen manga style, bold confident ink lines, small speed line fragments around head, pure black ink on white background, manga illustration, high contrast, face/head only, no color"

SEINEN (Thorfinn — Vinland Saga):
"Thorfinn face from Vinland Saga, battle-hardened expression, narrow intense eyes, heavy ink shadows across face, screentone shading on cheeks, seinen manga style, detailed cross-hatching, pure black ink on white background, moody atmosphere, face/head only, no color"

SHOJO (Usagi — Sailor Moon):
"Sailor Moon Usagi face, iconic large sparkly eyes with star and light reflections (kirameki) in pupils, long detailed eyelashes, flowing hair strands framing face, shojo manga style, delicate beautiful linework, pure black ink on white background, romantic dreamy feel, face/head only, no color"

CHIBI (Shin-chan — Crayon Shin-chan):
"Shinnosuke Nohara face from Crayon Shin-chan, super simple round head, signature thick caterpillar eyebrows, tiny dot eyes, minimalist expression, extremely simplified style, thick outlines only, pure black ink on white background, minimal detail, face/head only, no color"
```

### Drawing Style Prompts:
```
ROUGH_SKETCH:
"Loose overlapping pencil construction lines forming a head/face guideline, rough circles and cross guides, sketchy raw construction drawing, pure black lines on white background, messy multiple strokes, no color"

CLEAN_LINE_ART:
"A single smooth confident ink line forming a simple hair strand or face profile silhouette, pure clean unbroken line, G-pen calligraphy style, pure black on white background, minimal, no shading, no color"

INKED_MANGA:
"Bold ink splatter and thick kakeami cross-hatching shadow block, G-pen ink drips and heavy black areas, manga inking technique showcase, pure black ink on white background, raw ink energy, no color"

DETAILED_ILLUSTRATION:
"Dense intricate cross-hatching forming a gradient shadow pattern, fine screentone dots blending into detailed linework, multiple layered techniques visible, pure black ink on white background, complex and precise, no color"
```

> **After generation**: Remove white background to make transparent PNG. If tool can't generate transparent, use any bg removal tool (e.g. remove.bg, Photoshop, GIMP).
>
> **Image check before saving**: Each image should be clearly recognizable at 70×70px. If it looks like noise at that size, regenerate with less detail.

---

*Last updated: 2026-06-16 by Claude (Opus) during pair programming session with Rizky.*
*Design decisions made collaboratively. Do not deviate from this spec without re-discussion.*
