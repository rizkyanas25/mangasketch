import { Router } from 'express';
import crypto from 'crypto';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { AiService } from '../services/aiService';
import { SketchService } from '../services/sketchService';
import { QuotaService } from '../services/quotaService';
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
  MAX_WATERMARK_LENGTH,
  GetSketchesResponse,
  GetSketchDetailResponse,
  DeleteSketchResponse,
  GetQuotaResponse,
} from '@mangasketch/shared';

const router = Router();

// Generation Quota Limits
const LIMIT_ANON = 5;
const LIMIT_AUTH = 15;

// regex to validate uuid format
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      prompt,
      mangaStyle,
      drawingStyle,
      parentId,
      seed,
      watermarkText,
      watermarkPosition,
      imageUrl,
    } = req.body;

    // 1. do input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        code: 'INVALID_PROMPT',
        message: 'Please enter a valid prompt.',
      });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        code: 'INVALID_PROMPT',
        message: `Prompt is too long. Keep it under ${MAX_PROMPT_LENGTH} characters.`,
      });
    }

    if (!(MANGA_STYLES as readonly string[]).includes(mangaStyle)) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid Manga Style selected.',
      });
    }

    if (!(DRAWING_STYLES as readonly string[]).includes(drawingStyle)) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid Drawing Style selected.',
      });
    }

    if (
      parentId &&
      (typeof parentId !== 'string' || !UUID_REGEX.test(parentId))
    ) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid parent ID format.',
      });
    }

    if (
      seed !== undefined &&
      seed !== null &&
      (typeof seed !== 'number' || isNaN(seed) || seed < 0)
    ) {
      return res.status(400).json({
        code: 'UNKNOWN_ERROR',
        message: 'Invalid seed value.',
      });
    }

    // do custom watermark validation
    if (watermarkText !== undefined && watermarkText !== null) {
      if (typeof watermarkText !== 'string') {
        return res.status(400).json({
          code: 'UNKNOWN_ERROR',
          message: 'Watermark text must be a string.',
        });
      }

      const trimmed = watermarkText.trim();
      if (trimmed !== '') {
        if (trimmed.length > MAX_WATERMARK_LENGTH) {
          return res.status(400).json({
            code: 'UNKNOWN_ERROR',
            message: `Watermark name is too long. Max ${MAX_WATERMARK_LENGTH} characters.`,
          });
        }
        // alphanumeric only to prevent html svg injection
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        if (!alphanumericRegex.test(trimmed)) {
          return res.status(400).json({
            code: 'UNKNOWN_ERROR',
            message:
              'Watermark name can only contain letters and numbers.',
          });
        }
      }
    }

    if (watermarkPosition !== undefined && watermarkPosition !== null) {
      if (
        !(WATERMARK_POSITIONS as readonly string[]).includes(watermarkPosition)
      ) {
        return res.status(400).json({
          code: 'UNKNOWN_ERROR',
          message: 'Invalid watermark position selected.',
        });
      }
    }

    // 1.5 Handle post-auth recovery upload of a pre-generated anonymous sketch
    if (
      imageUrl &&
      typeof imageUrl === 'string' &&
      imageUrl.startsWith('data:image/webp;base64,')
    ) {
      if (!req.user) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to save sketches.',
        });
      }

      const base64Data = imageUrl.replace(/^data:image\/webp;base64,/, '');
      const finalBuffer = Buffer.from(base64Data, 'base64');
      const userId = req.user.id;
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      const filepath = `${userId}/${timestamp}_${randomSuffix}.webp`;

      // Upload directly to storage (no AI call)
      const storageUrl = await SketchService.uploadSketchToStorage(
        finalBuffer,
        filepath,
      );

      // Save sketch metadata to database
      const savedSketch = await SketchService.saveSketchToDatabase({
        userId,
        prompt,
        mangaStyle,
        drawingStyle,
        imageUrl: storageUrl,
        seed: Number(seed) || 0,
        parentId: parentId || null,
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
        watermarkText: watermarkText || undefined,
        watermarkPosition: watermarkPosition || 'BOTTOM_RIGHT',
      };

      return res.status(201).json(responsePayload);
    }

    // 2. check safety blocklist (layer 1 safety)
    if (checkSafetyBlocklist(prompt)) {
      return res.status(400).json({
        code: 'PROHIBITED_PROMPT',
        message: 'Prohibited ink! Keep your prompt PG-13.',
      });
    }

    // 2.5 Check and consume daily ink quota
    const isAuth = !!req.user;
    const limit = isAuth ? LIMIT_AUTH : LIMIT_ANON;
    const key = isAuth ? req.user!.id : req.ip || 'anonymous';
    const quotaAllowed = QuotaService.consumeQuota(key, limit);
    if (!quotaAllowed) {
      return res.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Ink Depleted! Your daily ink quota is exhausted.',
      });
    }

    // 3. wrap prompt with style and safety (layer 2 safety)
    const wrappedPrompt = wrapPrompt(prompt, mangaStyle, drawingStyle);

    // 4. generate image from ai service
    const { buffer: rawBuffer, seedUsed } = await AiService.generateMangaPanel(
      wrappedPrompt,
      seed,
    );

    // 4.1 always apply watermark
    const finalBuffer = await applyWatermark(
      rawBuffer,
      watermarkText || undefined,
      watermarkPosition || 'BOTTOM_RIGHT',
    );

    // 5. handle auth vs anonymous save
    if (req.user) {
      const userId = req.user.id;
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(3).toString('hex');

      // option 3: format name user_id/timestamp_suffix.webp
      const filepath = `${userId}/${timestamp}_${randomSuffix}.webp`;

      // upload generated buffer to storage
      const imageUrl = await SketchService.uploadSketchToStorage(
        finalBuffer,
        filepath,
      );

      // save sketch metadata to database
      const savedSketch = await SketchService.saveSketchToDatabase({
        userId,
        prompt,
        mangaStyle,
        drawingStyle,
        imageUrl,
        seed: seedUsed,
        parentId: parentId || null,
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
        watermarkText: watermarkText || undefined,
        watermarkPosition: watermarkPosition || 'BOTTOM_RIGHT',
      };

      return res.status(201).json(responsePayload);
    } else {
      // anonymous user: return image as base64 data url
      const base64Image = finalBuffer.toString('base64');
      const dataUrl = `data:image/webp;base64,${base64Image}`;
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
        watermarkText: watermarkText || undefined,
        watermarkPosition: watermarkPosition || 'BOTTOM_RIGHT',
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
      message: finalMessage,
    });
  }
});

// GET /api/sketches/quota - get the current user's generation quota
router.get('/quota', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const isAuth = !!req.user;
    const limit = isAuth ? LIMIT_AUTH : LIMIT_ANON;
    const key = isAuth ? req.user!.id : req.ip || 'anonymous';
    const quotaInfo = QuotaService.getQuota(key, limit);
    return res.status(200).json(quotaInfo);
  } catch (error) {
    console.error('[Sketches Router] Error fetching quota:', error);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to retrieve ink quota.',
    });
  }
});

// GET /api/sketches - get all sketch for logged in user
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view your sketchbook.',
      });
    }

    const sketches = await SketchService.getUserSketches(req.user.id);
    const responsePayload: GetSketchesResponse = { sketches };
    return res.status(200).json(responsePayload);
  } catch (error: any) {
    console.error('[Sketches Router] Error fetching sketches:', error);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to fetch your sketchbook.',
    });
  }
});

// GET /api/sketches/:id - get detail sketch and all history version
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view sketch details.',
      });
    }

    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({
        code: 'INVALID_SKETCH_ID',
        message: 'Invalid sketch ID format.',
      });
    }

    const history = await SketchService.getSketchWithHistory(id, req.user.id);
    const responsePayload: GetSketchDetailResponse = history;
    return res.status(200).json(responsePayload);
  } catch (error: any) {
    if (error.message === 'SKETCH_NOT_FOUND') {
      return res.status(404).json({
        code: 'SKETCH_NOT_FOUND',
        message: 'Sketch not found or access denied.',
      });
    }

    console.error('[Sketches Router] Error fetching sketch detail:', error);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to fetch sketch details.',
    });
  }
});

// DELETE /api/sketches/:id - delete sketch and all its history versions if it's a parent
router.delete('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to delete sketches.',
      });
    }

    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({
        code: 'INVALID_SKETCH_ID',
        message: 'Invalid sketch ID format.',
      });
    }

    await SketchService.deleteSketch(id, req.user.id);
    const responsePayload: DeleteSketchResponse = {
      success: true,
      message: 'Sketch erased successfully.',
    };
    return res.status(200).json(responsePayload);
  } catch (error: any) {
    if (error.message === 'SKETCH_NOT_FOUND') {
      return res.status(404).json({
        code: 'SKETCH_NOT_FOUND',
        message: 'Sketch not found or access denied.',
      });
    }

    console.error('[Sketches Router] Error deleting sketch:', error);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to erase sketch.',
    });
  }
});

export default router;
