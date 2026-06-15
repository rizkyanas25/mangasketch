// Shared TypeScript Types & Constants for MangaSketch

export type MangaStyle = 'SHONEN' | 'SEINEN' | 'SHOJO' | 'CHIBI';

export type DrawingStyle = 'ROUGH_SKETCH' | 'CLEAN_LINE_ART' | 'INKED_MANGA' | 'DETAILED_ILLUSTRATION';

// API request payload for generating/re-inking sketches
export interface GenerateSketchRequest {
  prompt: string;
  mangaStyle: MangaStyle;
  drawingStyle: DrawingStyle;
  parentId?: string; // Present when regenerating/re-inking from an existing sketch version
}

// API response payload returned upon successful generation
export interface GenerateSketchResponse {
  id: string;             // UUID in database, or temporary client-generated ID for anonymous
  prompt: string;
  mangaStyle: MangaStyle;
  drawingStyle: DrawingStyle;
  imageUrl: string;       // Permanent Supabase CDN URL, or base64 data URL for anonymous
  saved: boolean;         // true if persisted to DB (logged-in), false if temp in React state (anon)
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
  created_at: string;
}

// Standard payload for API error responses
export interface ApiErrorResponse {
  code: 'INVALID_PROMPT' | 'PROHIBITED_PROMPT' | 'AI_TIMEOUT' | 'AI_PROVIDER_ERROR' | 'RATE_LIMITED' | 'UNKNOWN_ERROR';
  message: string;
}
