'use server';

import {
  GenerateSketchResponse,
  DeleteSketchResponse,
  GetQuotaResponse,
} from '@mangasketch/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ActionState {
  data: GenerateSketchResponse | null;
  error: string | null;
}

export async function generateSketchAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const prompt = formData.get('prompt') as string;
  const mangaStyle = formData.get('mangaStyle') as string;
  const drawingStyle = formData.get('drawingStyle') as string;
  const watermarkText = formData.get('watermarkText') as string;
  const watermarkPosition = formData.get('watermarkPosition') as string;
  const parentId = formData.get('parentId') as string;
  const seedStr = formData.get('seed') as string;
  const token = formData.get('token') as string;

  const seed = seedStr ? Number(seedStr) : undefined;

  if (!prompt || prompt.trim() === '') {
    return { data: null, error: 'Please enter a valid prompt.' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/sketches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        mangaStyle,
        drawingStyle,
        watermarkText: watermarkText || undefined,
        watermarkPosition: watermarkPosition || undefined,
        parentId: parentId || undefined,
        seed: seed !== undefined && !isNaN(seed) ? seed : undefined,
      }),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to generate sketch.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      return { data: null, error: errorMsg };
    }

    const data = (await response.json()) as GenerateSketchResponse;
    return { data, error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'An unknown network error occurred.';
    return { data: null, error: errorMsg };
  }
}

export async function deleteSketchAction(
  sketchId: string,
  token: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sketches/${sketchId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMsg = 'Failed to erase sketch.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      return { success: false, error: errorMsg };
    }

    (await response.json()) as DeleteSketchResponse;
    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'An unknown network error occurred.';
    return { success: false, error: errorMsg };
  }
}

export async function getQuotaAction(
  token?: string,
): Promise<GetQuotaResponse> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/sketches/quota`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMsg = 'Failed to retrieve ink quota.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return (await response.json()) as GetQuotaResponse;
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Failed to retrieve ink quota.';
    throw new Error(errorMsg);
  }
}
