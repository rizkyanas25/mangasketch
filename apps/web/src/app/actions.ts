'use server';

import {
  GenerateSketchResponse,
  DeleteSketchResponse,
  GetQuotaResponse,
  GetSketchesResponse,
  GetSketchDetailResponse,
} from '@mangasketch/shared';
import { apiFetch } from '@/lib/api';

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
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await apiFetch<GenerateSketchResponse>('/api/sketches', {
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
    await apiFetch<DeleteSketchResponse>(`/api/sketches/${sketchId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiFetch<GetQuotaResponse>('/api/sketches/quota', {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
}

export async function getSketchesAction(
  token?: string,
): Promise<GetSketchesResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiFetch<GetSketchesResponse>('/api/sketches', {
    method: 'GET',
    headers,
  });
}

export async function getSketchDetailAction(
  sketchId: string,
  token?: string,
): Promise<GetSketchDetailResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiFetch<GetSketchDetailResponse>(`/api/sketches/${sketchId}`, {
    method: 'GET',
    headers,
  });
}
