// Shared TypeScript Types & Constants for MangaSketch

// --- 1. Style Presets ---
export const MANGA_STYLES = ['SHONEN', 'SEINEN', 'SHOJO', 'CHIBI'] as const;
export type MangaStyle = typeof MANGA_STYLES[number];

export const DRAWING_STYLES = [
  'ROUGH_SKETCH',
  'CLEAN_LINE_ART',
  'INKED_MANGA',
  'DETAILED_ILLUSTRATION'
] as const;
export type DrawingStyle = typeof DRAWING_STYLES[number];

// --- 2. Constraints ---
export const MAX_PROMPT_LENGTH = 500;

// --- 3. Safety (SFW / PG-13 protection) ---
export const BLOCKED_KEYWORDS = [
  'porn', 'nsfw', 'hentai', 'naked', 'nudity', 'nude', 'sex', 
  'orgy', 'rape', 'dildo', 'boobs', 'vagina', 'penis', 'asshole',
  'gore', 'torture', 'mutilation', 'pedophile', 'incest'
];

// --- 4. Errors ---
export const STANDARD_ERRORS = [
  'INVALID_PROMPT',
  'PROHIBITED_PROMPT',
  'AI_TIMEOUT',
  'AI_PROVIDER_ERROR',
  'RATE_LIMITED',
  'UNKNOWN_ERROR'
] as const;
export type ApiErrorCode = typeof STANDARD_ERRORS[number];

// Standard payload for API error responses
export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
}

// --- 5. Data Transmission Payloads ---

// API request payload for generating/re-inking sketches
export interface GenerateSketchRequest {
  prompt: string;
  mangaStyle: MangaStyle;
  drawingStyle: DrawingStyle;
  parentId?: string; // Present when regenerating/re-inking from an existing sketch version
  seed?: number;     // Optional: lock the seed for composition/character consistency
}

// API response payload returned upon successful generation
export interface GenerateSketchResponse {
  id: string;             // UUID in database, or temporary client-generated ID for anonymous
  prompt: string;
  mangaStyle: MangaStyle;
  drawingStyle: DrawingStyle;
  imageUrl: string;       // Permanent Supabase CDN URL, or base64 data URL for anonymous
  saved: boolean;         // true if persisted to DB (logged-in), false if temp in React state (anon)
  seed: number;           // The seed used to generate this sketch
  parentId?: string;
  createdAt: string;
}

// Model representing a row in the Supabase PostgreSQL 'sketches' table
export interface Sketch {
  id: string;
  parent_id: string | null;
  user_id: string;
  prompt: string;
  manga_style: string; // Stored as snake_case in PostgreSQL
  drawing_style: string;
  image_url: string;
  seed: number;
  created_at: string;
}
