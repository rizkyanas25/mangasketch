import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Define a local interface extending the Express Request
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Optional authentication middleware.
 * Extracts and verifies the Supabase access token (JWT) from the Authorization header.
 * - If no header is present, the request proceeds as an anonymous user (req.user remains undefined).
 * - If a header is present and valid, req.user is set to the authenticated user.
 * - If a header is present but invalid/expired, it returns a 401 Unauthorized error.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Treat as anonymous user
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid Authorization header format. Expected "Bearer <token>".'
    });
  }

  const token = parts[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('[Auth Middleware] Token verification failed:', error?.message || 'No user found');
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authorization token.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Unexpected authentication error:', error);
    return res.status(500).json({
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred during authentication.'
    });
  }
}
