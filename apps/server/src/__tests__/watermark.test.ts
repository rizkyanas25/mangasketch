import { describe, it, expect } from 'vitest';
import { generateWatermarkSvg, applyWatermark } from '../utils/watermark';
import sharp from 'sharp';

describe('Watermark Utility', () => {
  describe('generateWatermarkSvg', () => {
    it('should generate valid SVG content without banner if userName is empty or undefined', () => {
      const svg = generateWatermarkSvg(undefined, 'BOTTOM_RIGHT');
      expect(svg).toContain('<svg');
      expect(svg).not.toContain('<path'); // Path is the banner red chord
      expect(svg).toContain('cx="688"'); // BOTTOM_RIGHT x
      expect(svg).toContain('cy="944"'); // BOTTOM_RIGHT y
    });

    it('should generate SVG with banner and initials if userName is provided', () => {
      const svg = generateWatermarkSvg('NY', 'BOTTOM_RIGHT');
      expect(svg).toContain('<svg');
      expect(svg).toContain('<path'); // Path is the banner red chord
      expect(svg).toContain('NY');
      expect(svg).toContain('font-size="12px"'); // font-size for <=2 chars
    });

    it('should truncate and uppercase initials longer than 4 chars', () => {
      const svg = generateWatermarkSvg('nyhello', 'BOTTOM_RIGHT');
      expect(svg).toContain('NYHE'); // truncated to 4 uppercase characters
      expect(svg).toContain('font-size="10px"'); // font-size for >2 chars
    });

    it('should calculate coordinates correctly for all corners', () => {
      const svgTopLeft = generateWatermarkSvg('NY', 'TOP_LEFT');
      expect(svgTopLeft).toContain('cx="80"');
      expect(svgTopLeft).toContain('cy="80"');

      const svgTopRight = generateWatermarkSvg('NY', 'TOP_RIGHT');
      expect(svgTopRight).toContain('cx="688"');
      expect(svgTopRight).toContain('cy="80"');

      const svgBottomLeft = generateWatermarkSvg('NY', 'BOTTOM_LEFT');
      expect(svgBottomLeft).toContain('cx="80"');
      expect(svgBottomLeft).toContain('cy="944"');
    });
  });

  describe('applyWatermark', () => {
    it('should successfully apply watermark to an image buffer', async () => {
      // Create a dummy 768x1024 PNG image buffer using sharp to match SVG size
      const dummyImage = await sharp({
        create: {
          width: 768,
          height: 1024,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toBuffer();

      const result = await applyWatermark(dummyImage, 'NY', 'BOTTOM_RIGHT');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify the output is a valid image buffer using sharp metadata
      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(768);
      expect(metadata.height).toBe(1024);
      expect(metadata.format).toBe('png');
    });
  });
});
