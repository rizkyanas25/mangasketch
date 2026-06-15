import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { AiService } from '../services/aiService';
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

describe('Sketches API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(res.body.imageUrl).toContain('data:image/png;base64,');
      expect(res.body.watermarkText).toBe('NY');
      expect(res.body.watermarkPosition).toBe('BOTTOM_RIGHT');
      
      // Verify mock was called correctly
      expect(AiService.generateMangaPanel).toHaveBeenCalledTimes(1);
    });
  });
});
