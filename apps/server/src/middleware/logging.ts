import { Request, Response, NextFunction } from 'express';

/**
 * Recursively traverses a payload object to sanitize and truncate base64 data URLs
 * and extremely long strings to prevent log size bloat and dashboard lag.
 */
function scrubPayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Truncate base64 data URLs often returned for anonymous users
    if (obj.startsWith('data:') && obj.includes(';base64,')) {
      return `[BASE64_IMAGE_DATA_TRUNCATED: ${obj.substring(0, 30)}...]`;
    }
    // Truncate other generic long strings
    if (obj.length > 500) {
      return `${obj.substring(0, 500)}... [TRUNCATED ${obj.length} chars]`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(scrubPayload);
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = scrubPayload(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}

/**
 * Custom HTTP logging middleware that intercepts request and response payloads.
 * Only active if the DEBUG_HTTP environment variable is set to 'true'.
 */
export function httpLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only intercept logs when debug mode is explicitly enabled
  if (process.env.DEBUG_HTTP !== 'true') {
    return next();
  }

  const start = Date.now();

  // 1. Scrub and format request body and query parameters
  const reqBody = Object.keys(req.body).length ? JSON.stringify(scrubPayload(req.body)) : '-';
  const reqQuery = Object.keys(req.query).length ? JSON.stringify(scrubPayload(req.query)) : '';
  const queryStr = reqQuery ? ` | Query: ${reqQuery}` : '';

  // 2. Intercept response chunks
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks: Buffer[] = [];

  res.write = function (chunk: any, ...args: any[]) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    return oldWrite.apply(res, [chunk, ...args] as any);
  };

  res.end = function (chunk: any, ...args: any[]) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    const responseTime = Date.now() - start;
    const rawBody = Buffer.concat(chunks).toString('utf8');
    let resBodyFormatted = '-';

    if (rawBody) {
      try {
        const parsedJson = JSON.parse(rawBody);
        resBodyFormatted = JSON.stringify(scrubPayload(parsedJson));
      } catch (err) {
        // Fallback for non-JSON responses (HTML, text, etc.)
        resBodyFormatted = rawBody.length > 200 ? `${rawBody.substring(0, 200)}...` : rawBody;
      }
    }

    // 3. Print clean aggregated HTTP transaction log to stdout (Railway Deploy Logs)
    // Only log API endpoints to keep static assets/other logs clean
    if (req.path.startsWith('/api')) {
      console.log(
        `[API_DEBUG] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${responseTime}ms${queryStr}\n` +
        `  ↳ Req Body: ${reqBody}\n` +
        `  ↳ Res Body: ${resBodyFormatted}\n` +
        `--------------------------------------------------------------------------------`
      );
    }

    return oldEnd.apply(res, [chunk, ...args] as any);
  };

  next();
}
