import { describe, it, expect } from 'vitest';
import { checkSafetyBlocklist, wrapPrompt } from '../utils/promptHelper';

describe('Prompt Helper', () => {
  describe('checkSafetyBlocklist', () => {
    it('should flag prohibited keywords case-insensitively', () => {
      expect(checkSafetyBlocklist('a simple drawing')).toBe(false);
      expect(checkSafetyBlocklist('some NSFW content')).toBe(true);
      expect(checkSafetyBlocklist('hentai manga panel')).toBe(true);
      expect(checkSafetyBlocklist('detailed portrait of a hero')).toBe(false);
    });
  });

  describe('wrapPrompt', () => {
    it('should correctly format and front-load B&W constraints', () => {
      const prompt = 'cyberpunk warrior';
      const result = wrapPrompt(prompt, 'SHONEN', 'INKED_MANGA');

      // Verify B&W modifiers are at the very beginning
      expect(result.startsWith('black and white, monochrome, grayscale')).toBe(
        true,
      );

      // Verify all components are included
      expect(result).toContain(prompt);
      expect(result).toContain('shonen manga style');
      expect(result).toContain('traditional inked manga page');
      expect(result).toContain('safe for work, PG-13');
    });
  });
});
