const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

export class AiService {
  /**
   * Generates a manga panel image buffer from a wrapped prompt.
   * @param wrappedPrompt Fully wrapped prompt string
   * @param seed Optional seed for variation control
   * @returns Buffer of the generated image and the seed used
   */
  static async generateMangaPanel(
    wrappedPrompt: string,
    seed?: number,
  ): Promise<{ buffer: Buffer; seedUsed: number }> {
    if (!POLLINATIONS_API_KEY) {
      throw new Error(
        '[AI Service] POLLINATIONS_API_KEY is not defined in backend environment.',
      );
    }

    // 1. Resolve or generate a random 32-bit signed integer seed
    // Pollinations Flux API expects seed <= 2147483647 (max signed 32-bit int)
    const finalSeed =
      seed !== undefined && seed !== null
        ? seed
        : Math.floor(Math.random() * 2147483647);

    const encodedPrompt = encodeURIComponent(wrappedPrompt);
    const width = 768; // 3:4 portrait aspect ratio
    const height = 1024;
    const model = 'flux';

    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${finalSeed}&key=${POLLINATIONS_API_KEY}`;

    // 2. Setup AbortController for a 40-second timeout guard
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error(
          `[AI Service] Pollinations API returned error status ${response.status}:`,
          text,
        );
        const err = new Error('AI_PROVIDER_ERROR');
        (err as any).statusCode = 502;
        throw err;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return { buffer, seedUsed: finalSeed };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        // console.error('[AI Service] Pollinations API request timed out after 40 seconds.');
        console.error(
          '[AI Service] Pollinations API request timed out after 120 seconds.',
        );
        const err = new Error('AI_TIMEOUT');
        (err as any).statusCode = 504;
        throw err;
      }

      if (error.message === 'AI_PROVIDER_ERROR') {
        throw error;
      }

      console.error(
        '[AI Service] Unexpected error calling Pollinations API:',
        error,
      );
      const err = new Error('UNKNOWN_ERROR');
      (err as any).statusCode = 500;
      throw err;
    }
  }
}
