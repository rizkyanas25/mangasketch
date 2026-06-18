import { ApiErrorCode } from '@mangasketch/shared';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export class ApiError extends Error {
  status: number;
  code?: ApiErrorCode;

  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  // Construct final URL with optional query parameters
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      searchParams.append(key, String(val));
    });
    url += `?${searchParams.toString()}`;
  }

  // Get current active session to inject JWT token automatically (safely on client-side)
  let token = undefined;
  if (typeof window !== 'undefined') {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (err) {
      console.warn('Failed to retrieve client session:', err);
    }
  }

  const requestHeaders = new Headers(headers);
  if (
    !requestHeaders.has('Content-Type') &&
    !(restOptions.body instanceof FormData)
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });
  } catch (err: unknown) {
    const isOffline =
      err instanceof Error &&
      (err.message.toLowerCase().includes('fetch failed') ||
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('networkerror') ||
        err.message.toLowerCase().includes('econnrefused'));
    if (isOffline) {
      throw new Error('CONNECTION ERROR: SERVER UNREACHABLE. PLEASE TRY AGAIN LATER.');
    }
    throw err;
  }

  if (!response.ok) {
    let errorData: { message?: string; code?: ApiErrorCode } = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'An unknown network error occurred.' };
    }
    throw new ApiError(
      errorData.message || 'Request failed',
      response.status,
      errorData.code,
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as Promise<T>;
}
