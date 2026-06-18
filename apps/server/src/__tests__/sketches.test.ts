import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { AiService } from '../services/aiService';
import { SketchService } from '../services/sketchService';
import { QuotaService } from '../services/quotaService';
import sharp from 'sharp';

// Mock AiService.generateMangaPanel
vi.mock('../services/aiService', () => {
  return {
    AiService: {
      generateMangaPanel: vi.fn().mockImplementation(async (prompt: string, seed?: number) => {
        // Create a dummy 768x1024 PNG image buffer using sharp
        const buffer = await sharp({
          create: {
            width: 768,
            height: 1024,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .png()
        .toBuffer();
        return { buffer, seedUsed: seed || 12345 };
      })
    }
  };
});

// Mock Supabase Auth client to bypass real authentication checks
vi.mock('../config/supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockImplementation(async (token: string) => {
          if (token === 'valid-token') {
            return {
              data: {
                user: { id: 'mock-user-id', email: 'test@example.com' }
              },
              error: null
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        })
      }
    }
  };
});

// Mock SketchService to bypass database access
vi.mock('../services/sketchService', () => {
  return {
    SketchService: {
      getUserSketches: vi.fn().mockImplementation(async (userId: string) => {
        return [
          {
            id: 'sketch-1-id',
            parent_id: null,
            user_id: userId,
            prompt: 'first sketch',
            manga_style: 'SHONEN',
            drawing_style: 'INKED_MANGA',
            image_url: 'http://example.com/sketch1.png',
            seed: 12345,
            created_at: new Date().toISOString()
          }
        ];
      }),
      getSketchWithHistory: vi.fn().mockImplementation(async (sketchId: string, userId: string) => {
        if (sketchId === '00000000-0000-0000-0000-000000000000') {
          throw new Error('SKETCH_NOT_FOUND');
        }
        const sketch = {
          id: sketchId,
          parent_id: null,
          user_id: userId,
          prompt: 'sketch details',
          manga_style: 'SHONEN',
          drawing_style: 'INKED_MANGA',
          image_url: 'http://example.com/sketch1.png',
          seed: 12345,
          created_at: new Date().toISOString()
        };
        return {
          sketch,
          versions: [sketch]
        };
      }),
      uploadSketchToStorage: vi.fn().mockImplementation(async (buffer: Buffer, filepath: string) => {
        return 'http://example.com/recovered-sketch.webp';
      }),
      saveSketchToDatabase: vi.fn().mockImplementation(async (sketchData: any) => {
        return {
          id: 'recovered-sketch-id',
          user_id: sketchData.userId,
          prompt: sketchData.prompt,
          manga_style: sketchData.mangaStyle,
          drawing_style: sketchData.drawingStyle,
          image_url: sketchData.imageUrl,
          seed: sketchData.seed,
          parent_id: sketchData.parentId || null,
          created_at: new Date().toISOString()
        };
      }),
      deleteSketch: vi.fn().mockImplementation(async (sketchId: string, userId: string) => {
        if (sketchId === '00000000-0000-0000-0000-000000000000') {
          throw new Error('SKETCH_NOT_FOUND');
        }
        return;
      })
    }
  };
});

describe('Sketches API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    QuotaService.reset();
  });

  describe('POST /api/sketches', () => {
    it('should return 400 with INVALID_PROMPT code if prompt is empty', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: '',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_PROMPT');
    });

    it('should return 400 with PROHIBITED_PROMPT code if prompt contains blocked keywords', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'some prohibited nsfw text',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROHIBITED_PROMPT');
    });

    it('should return 400 if watermark text is longer than 4 characters', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'cute drawing',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA',
          watermarkText: 'ABCDE',
          watermarkPosition: 'BOTTOM_RIGHT'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Watermark name is too long');
    });

    it('should return 400 if watermark text contains invalid characters', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'cute drawing',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA',
          watermarkText: 'NY<',
          watermarkPosition: 'BOTTOM_RIGHT'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('letters, numbers, and spaces');
    });

    it('should generate sketch and return 200 with base64 data for anonymous request', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'cyberpunk warrior',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA',
          watermarkText: 'NY',
          watermarkPosition: 'BOTTOM_RIGHT',
          seed: 42
        });

      expect(res.status).toBe(200);
      expect(res.body.saved).toBe(false);
      expect(res.body.seed).toBe(42);
      expect(res.body.imageUrl).toContain('data:image/webp;base64,');
      expect(res.body.watermarkText).toBe('NY');
      expect(res.body.watermarkPosition).toBe('BOTTOM_RIGHT');
      
      expect(AiService.generateMangaPanel).toHaveBeenCalledTimes(1);
    });

    it('should generate sketch with default watermark settings if none are provided', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'cyberpunk warrior',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA'
        });

      expect(res.status).toBe(200);
      expect(res.body.saved).toBe(false);
      expect(res.body.imageUrl).toContain('data:image/webp;base64,');
      expect(res.body.watermarkText).toBeUndefined();
      expect(res.body.watermarkPosition).toBe('BOTTOM_RIGHT');
      
      expect(AiService.generateMangaPanel).toHaveBeenCalledTimes(1);
    });

    it('should save pre-generated anonymous sketch without AI call if imageUrl is provided and auth is valid', async () => {
      const res = await request(app)
        .post('/api/sketches')
        .set('Authorization', 'Bearer valid-token')
        .send({
          prompt: 'recovered sketch',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA',
          imageUrl: 'data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          seed: 99
        });

      expect(res.status).toBe(201);
      expect(res.body.saved).toBe(true);
      expect(res.body.id).toBe('recovered-sketch-id');
      expect(res.body.imageUrl).toBe('http://example.com/recovered-sketch.webp');
      expect(res.body.seed).toBe(99);
      
      expect(AiService.generateMangaPanel).not.toHaveBeenCalled();
      expect(SketchService.uploadSketchToStorage).toHaveBeenCalled();
      expect(SketchService.saveSketchToDatabase).toHaveBeenCalled();
    });
  });

  describe('GET /api/sketches', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/sketches');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('logged in');
    });

    it('should return 200 and sketches list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/sketches')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.sketches).toBeDefined();
      expect(res.body.sketches.length).toBe(1);
      expect(res.body.sketches[0].prompt).toBe('first sketch');
      expect(SketchService.getUserSketches).toHaveBeenCalledWith('mock-user-id');
    });
  });

  describe('GET /api/sketches/:id', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).get('/api/sketches/11111111-1111-1111-1111-111111111111');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('logged in');
    });

    it('should return 400 if sketch ID format is not a UUID', async () => {
      const res = await request(app)
        .get('/api/sketches/invalid-uuid')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_SKETCH_ID');
      expect(res.body.message).toContain('Invalid sketch ID format');
    });

    it('should return 404 if sketch is not found', async () => {
      const res = await request(app)
        .get('/api/sketches/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SKETCH_NOT_FOUND');
      expect(res.body.message).toContain('not found or access denied');
    });

    it('should return 200 and sketch history for authenticated user and valid UUID', async () => {
      const targetId = '22222222-2222-2222-2222-222222222222';
      const res = await request(app)
        .get(`/api/sketches/${targetId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.sketch).toBeDefined();
      expect(res.body.versions).toBeDefined();
      expect(res.body.sketch.id).toBe(targetId);
      expect(SketchService.getSketchWithHistory).toHaveBeenCalledWith(targetId, 'mock-user-id');
    });
  });

  describe('DELETE /api/sketches/:id', () => {
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app).delete('/api/sketches/11111111-1111-1111-1111-111111111111');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('logged in');
    });

    it('should return 400 if sketch ID format is not a UUID', async () => {
      const res = await request(app)
        .delete('/api/sketches/invalid-uuid')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_SKETCH_ID');
      expect(res.body.message).toContain('Invalid sketch ID format');
    });

    it('should return 404 if sketch is not found', async () => {
      const res = await request(app)
        .delete('/api/sketches/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SKETCH_NOT_FOUND');
      expect(res.body.message).toContain('not found or access denied');
    });

    it('should return 200 and success status on successful deletion', async () => {
      const targetId = '22222222-2222-2222-2222-222222222222';
      const res = await request(app)
        .delete(`/api/sketches/${targetId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('erased successfully');
      expect(SketchService.deleteSketch).toHaveBeenCalledWith(targetId, 'mock-user-id');
    });
  });

  describe('GET /api/sketches/quota', () => {
    it('should return anonymous quota details if user is not authenticated', async () => {
      const res = await request(app).get('/api/sketches/quota');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.remaining).toBe(5);
      expect(res.body.resetTime).toBeDefined();
    });

    it('should return authenticated user quota details if token is valid', async () => {
      const res = await request(app)
        .get('/api/sketches/quota')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(15);
      expect(res.body.remaining).toBe(15);
      expect(res.body.resetTime).toBeDefined();
    });
  });

  describe('Rate Limiting (Ink Quota) enforcement', () => {
    it('should enforce anonymous limit of 5 requests and return 429 when exhausted', async () => {
      // Consume 5 anonymous generations
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/sketches')
          .send({
            prompt: `sketch ${i}`,
            mangaStyle: 'SHONEN',
            drawingStyle: 'INKED_MANGA'
          });
        expect(res.status).toBe(200);
      }

      // 6th generation should return 429
      const res429 = await request(app)
        .post('/api/sketches')
        .send({
          prompt: 'exhausted sketch',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA'
        });

      expect(res429.status).toBe(429);
      expect(res429.body.code).toBe('RATE_LIMITED');
      expect(res429.body.message).toContain('daily ink quota is exhausted');
    });

    it('should enforce authenticated limit of 15 requests and return 429 when exhausted', async () => {
      // Consume 15 authenticated generations
      for (let i = 0; i < 15; i++) {
        const res = await request(app)
          .post('/api/sketches')
          .set('Authorization', 'Bearer valid-token')
          .send({
            prompt: `sketch ${i}`,
            mangaStyle: 'SHONEN',
            drawingStyle: 'INKED_MANGA'
          });
        expect(res.status).toBe(201);
      }

      // 16th generation should return 429
      const res429 = await request(app)
        .post('/api/sketches')
        .set('Authorization', 'Bearer valid-token')
        .send({
          prompt: 'exhausted auth sketch',
          mangaStyle: 'SHONEN',
          drawingStyle: 'INKED_MANGA'
        });

      expect(res429.status).toBe(429);
      expect(res429.body.code).toBe('RATE_LIMITED');
      expect(res429.body.message).toContain('daily ink quota is exhausted');
    });
  });
});
