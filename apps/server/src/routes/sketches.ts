import { Router } from 'express';
import crypto from 'crypto';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { AiService } from '../services/aiService';
import { SketchService } from '../services/sketchService';
import { wrapPrompt, checkSafetyBlocklist } from '../utils/promptHelper';
import { applyWatermark } from '../utils/watermark';
import {
  MangaStyle,
  DrawingStyle,
  GenerateSketchResponse,
  MAX_PROMPT_LENGTH,
  MANGA_STYLES,
  DRAWING_STYLES,
  STANDARD_ERRORS,
  WatermarkPosition,
  WATERMARK_POSITIONS,
  MAX_WATERMARK_LENGTH
} from '@mangasketch/shared';

const router = Router();

// Regex to validate UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      prompt,
      mangaStyle,
      drawingStyle,
      parentId,
      seed,
      watermarkText,
      watermarkPosition
    } = req.body;

    // 1. Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        code: 'INVALID_PROMPT',
        message: 'Please enter a valid prompt.'
      });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        code: 'INVALID_PROMPT',
        message: `Prompt is too long. Keep it under ${MAX_PROMPT_LENGTH} characters.`
      });
    }

    if (!(MANGA_STYLES as readonly string[]).includes(mangaStyle)) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid Manga Style selected.'
      });
    }

    if (!(DRAWING_STYLES as readonly string[]).includes(drawingStyle)) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid Drawing Style selected.'
      });
    }

    if (parentId && (typeof parentId !== 'string' || !UUID_REGEX.test(parentId))) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid parent ID format.'
      });
    }

    if (seed !== undefined && seed !== null && (typeof seed !== 'number' || isNaN(seed) || seed < 0)) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid seed value.'
      });
    }

    // Custom Watermark Validation
    if (watermarkText !== undefined && watermarkText !== null) {
      if (typeof watermarkText !== 'string') {
        return res.status(400).json({
          code: 'UNKNOWN_ERROR',
          message: 'Watermark text must be a string.'
        });
      }
      
      const trimmed = watermarkText.trim();
      if (trimmed !== '') {
        if (trimmed.length > MAX_WATERMARK_LENGTH) {
          return res.status(400).json({
            code: 'UNKNOWN_ERROR',
            message: `Watermark name is too long. Max ${MAX_WATERMARK_LENGTH} characters.`
          });
        }
        // Alphanumeric + spaces only to avoid HTML/SVG injection
        const alphanumericRegex = /^[a-zA-Z0-9 ]+$/;
        if (!alphanumericRegex.test(trimmed)) {
          return res.status(400).json({
            code: 'UNKNOWN_ERROR',
            message: 'Watermark name can only contain letters, numbers, and spaces.'
          });
        }
      }
    }

    if (watermarkPosition !== undefined && watermarkPosition !== null) {
      if (!(WATERMARK_POSITIONS as readonly string[]).includes(watermarkPosition)) {
        return res.status(400).json({
          code: 'UNKNOWN_ERROR',
          message: 'Invalid watermark position selected.'
        });
      }
    }

    // 2. Safety Blocklist Check (Layer 1 Safety)
    if (checkSafetyBlocklist(prompt)) {
      return res.status(400).json({
        code: 'PROHIBITED_PROMPT',
        message: 'Prohibited ink! Keep your prompt PG-13.'
      });
    }

    // 3. Wrap prompt with modifiers and safety guidelines (Layer 2 Safety)
    const wrappedPrompt = wrapPrompt(prompt, mangaStyle, drawingStyle);

    // 4. Generate Image via AI Service
    const { buffer: rawBuffer, seedUsed } = await AiService.generateMangaPanel(wrappedPrompt, seed);

    // 4.1 Apply Watermark if watermarkText is provided (can be empty string for a clean stamp)
    let finalBuffer = rawBuffer;
    if (watermarkText !== undefined && watermarkText !== null) {
      finalBuffer = await applyWatermark(
        rawBuffer,
        watermarkText,
        watermarkPosition || 'BOTTOM_RIGHT'
      );
    }

    // 5. Handle authenticated vs anonymous persistence
    if (req.user) {
      const userId = req.user.id;
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(3).toString('hex'); // 6 hex chars for uniqueness
      
      // Opsi 3: user_id/timestamp_suffix.png
      const filepath = `${userId}/${timestamp}_${randomSuffix}.png`;

      // Upload generated buffer to storage
      const imageUrl = await SketchService.uploadSketchToStorage(finalBuffer, filepath);

      // Save sketch record to database
      const savedSketch = await SketchService.saveSketchToDatabase({
        userId,
        prompt,
        mangaStyle,
        drawingStyle,
        imageUrl,
        seed: seedUsed,
        parentId: parentId || null
      });

      const responsePayload: GenerateSketchResponse = {
        id: savedSketch.id,
        prompt: savedSketch.prompt,
        mangaStyle: savedSketch.manga_style as MangaStyle,
        drawingStyle: savedSketch.drawing_style as DrawingStyle,
        imageUrl: savedSketch.image_url,
        saved: true,
        seed: savedSketch.seed,
        parentId: savedSketch.parent_id || undefined,
        createdAt: savedSketch.created_at,
        watermarkText: watermarkText !== undefined ? watermarkText : undefined,
        watermarkPosition: watermarkPosition || undefined
      };

      return res.status(201).json(responsePayload);
    } else {
      // Anonymous user: return image as a Base64 data URL
      const base64Image = finalBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;
      const tempId = crypto.randomUUID();

      const responsePayload: GenerateSketchResponse = {
        id: tempId,
        prompt,
        mangaStyle,
        drawingStyle,
        imageUrl: dataUrl,
        saved: false,
        seed: seedUsed,
        parentId: parentId || undefined,
        createdAt: new Date().toISOString(),
        watermarkText: watermarkText !== undefined ? watermarkText : undefined,
        watermarkPosition: watermarkPosition || undefined
      };

      return res.status(200).json(responsePayload);
    }
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const errorCode = error.message || 'UNKNOWN_ERROR';

    const finalCode = (STANDARD_ERRORS as readonly string[]).includes(errorCode)
      ? (errorCode as any)
      : 'UNKNOWN_ERROR';
    let finalMessage = 'An unexpected server error occurred.';

    if (finalCode === 'AI_TIMEOUT') {
      finalMessage = 'Image generation timed out. Please try again.';
    } else if (finalCode === 'AI_PROVIDER_ERROR') {
      finalMessage = 'Unexpected response from AI service.';
    } else if (finalCode === 'PROHIBITED_PROMPT') {
      finalMessage = 'Prohibited ink! Keep your prompt PG-13.';
    } else if (finalCode === 'INVALID_PROMPT') {
      finalMessage = error.message || 'Please enter a valid prompt.';
    }

    return res.status(statusCode).json({
      code: finalCode,
      message: finalMessage
    });
  }
});

export default router;
