import { MangaStyle, DrawingStyle, BLOCKED_KEYWORDS } from '@mangasketch/shared';

/**
 * Checks if a user prompt contains any blocked keywords (Case Insensitive).
 * @param prompt The raw user prompt string
 * @returns true if prompt contains blocked words, false otherwise
 */
export function checkSafetyBlocklist(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => {
    // Check if the keyword exists as a substring or word
    return normalized.includes(keyword);
  });
}

// Manga Style Prompts (controls storytelling & aesthetic)
const MANGA_STYLE_PROMPTS: Record<MangaStyle, string> = {
  SHONEN: 'shonen manga style, bold inks, dynamic action lines, heroic energy, high-contrast values',
  SEINEN: 'seinen manga aesthetic, realistic proportions, deep ink wash, heavy cross-hatching, mature atmospheric shadows',
  SHOJO: 'shojo manga style, elegant flowing linework, delicate details, expressive emotional tone, soft floral screentone patterns',
  CHIBI: 'cute chibi style, super deformed (SD), simplified lines, big head small body, playful comic illustration'
};

// Drawing Style Prompts (controls stage of artistic development)
const DRAWING_STYLE_PROMPTS: Record<DrawingStyle, string> = {
  ROUGH_SKETCH: 'rough concept draft, graphite pencil sketch, loose lines, unfinished sketch, pencil texture strokes',
  CLEAN_LINE_ART: 'clean digital line art, clean outlines, pure linework ink, crisp margins, minimal shading',
  INKED_MANGA: 'traditional inked manga page, G-pen nib strokes, rich black ink, sharp contrasts, screentone dot shading',
  DETAILED_ILLUSTRATION: 'highly detailed manga illustration, polished concept art, professional screentones, rich ink textures, masterwork presentation'
};

// Layer 2: Safety Injector (built into prompt to steer AI model weights away from NSFW)
const SAFETY_INJECTOR = 'safe for work, PG-13, no nudity, no explicit content, no gore';

// Global styling modifiers to enforce B&W manga aesthetics
const GLOBAL_STYLE_MODIFIERS = 'black and white, monochrome, manga ink drawing, hand-drawn linework';

/**
 * Wraps a user prompt with curated manga and drawing style modifiers, global rules, and safety guardrails.
 * @param prompt Raw user prompt
 * @param mangaStyle Selected Manga Style
 * @param drawingStyle Selected Drawing Style
 * @returns Fully compiled prompt to send to the AI image generator
 */
export function wrapPrompt(
  prompt: string,
  mangaStyle: MangaStyle,
  drawingStyle: DrawingStyle
): string {
  const stylePrompt = MANGA_STYLE_PROMPTS[mangaStyle];
  const drawingPrompt = DRAWING_STYLE_PROMPTS[drawingStyle];
  
  // Combine all layers to build the final prompt
  // Enforces style hierarchy: [Subject description] -> [Manga Genre Style] -> [Drawing Stage] -> [B&W Rule] -> [Safety]
  return `${prompt}, ${stylePrompt}, ${drawingPrompt}, ${GLOBAL_STYLE_MODIFIERS}, ${SAFETY_INJECTOR}`;
}
