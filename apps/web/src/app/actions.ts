'use server';

import { GenerateSketchResponse, DeleteSketchResponse } from "@mangasketch/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ActionState {
  data: GenerateSketchResponse | null;
  error: string | null;
}

export async function generateSketchAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const prompt = formData.get("prompt") as string;
  const mangaStyle = formData.get("mangaStyle") as string;
  const drawingStyle = formData.get("drawingStyle") as string;
  const watermarkText = formData.get("watermarkText") as string;
  const watermarkPosition = formData.get("watermarkPosition") as string;
  const token = formData.get("token") as string;

  if (!prompt || prompt.trim() === "") {
    return { data: null, error: "Please enter a valid prompt." };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/sketches`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        mangaStyle,
        drawingStyle,
        watermarkText: watermarkText || undefined,
        watermarkPosition: watermarkPosition || undefined,
      }),
    });

    if (!response.ok) {
      let errorMsg = "Failed to generate sketch.";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      return { data: null, error: errorMsg };
    }

    const data = await response.json() as GenerateSketchResponse;
    return { data, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unknown network error occurred.";
    return { data: null, error: errorMsg };
  }
}

export async function deleteSketchAction(
  sketchId: string,
  token: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sketches/${sketchId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMsg = "Failed to erase sketch.";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      return { success: false, error: errorMsg };
    }

    await response.json() as DeleteSketchResponse;
    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unknown network error occurred.";
    return { success: false, error: errorMsg };
  }
}

