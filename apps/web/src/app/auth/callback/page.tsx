'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

import { MagicEdit } from "pixelarticons/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AuthCallback() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("Stabilizing ink flow. Authenticating mangaka.");
  const [submitting, setSubmitting] = useState(false);
  const uploadStarted = useRef(false);
  const uploadSucceeded = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/");
      return;
    }

    const pendingDataStr = localStorage.getItem("mangasketch_pending_upload");
    if (!pendingDataStr || uploadStarted.current) {
      if (!submitting && !uploadSucceeded.current) {
        router.push("/");
      }
      return;
    }

    const recoverSketch = async () => {
      uploadStarted.current = true;
      setSubmitting(true);
      setStatus("RECOVERING PREVIOUS SKETCH... SAVING TO SKETCHBOOK.");

      try {
        const pendingData = JSON.parse(pendingDataStr);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/sketches`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            prompt: pendingData.prompt,
            mangaStyle: pendingData.mangaStyle,
            drawingStyle: pendingData.drawingStyle,
            seed: pendingData.seed,
            imageUrl: pendingData.imageUrl,
            watermarkText: pendingData.watermarkText,
            watermarkPosition: pendingData.watermarkPosition,
          }),
        });

        if (response.ok) {
          localStorage.removeItem("mangasketch_pending_upload");
          uploadSucceeded.current = true;
          router.push("/sketches?toast=recovered");
        } else {
          console.error("Failed to recover sketch:", await response.text());
          localStorage.removeItem("mangasketch_pending_upload");
          router.push("/");
        }
      } catch (err) {
        console.error("Error recovering sketch:", err);
        localStorage.removeItem("mangasketch_pending_upload");
        router.push("/");
      } finally {
        setSubmitting(false);
      }
    };

    recoverSketch();
  }, [loading, user, session, router, submitting]);

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center p-6 text-foreground">
      <div className="bg-background border-4 border-foreground p-8 max-w-md w-full text-center neo-shadow">

        <div className="flex justify-center mb-4 text-foreground">
          <MagicEdit className="w-12 h-12 animate-sketch" />
        </div>
        <h1 className="font-display text-2xl mb-2 tracking-wide uppercase">
          {submitting ? "SECURING ARTWORK..." : "INKING IDENTITY..."}
        </h1>
        <p className="font-mono text-sm text-neutral">
          {status}
        </p>
      </div>
    </div>
  );
}
