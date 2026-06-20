'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { MagicEdit } from 'pixelarticons/react';
import { apiFetch } from '@/lib/api';
import { useUiStore } from '@/store/uiStore';
import { GenerateSketchResponse } from '@mangasketch/shared';

export default function AuthCallback() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const [status, setStatus] = useState(
    'Stabilizing ink flow. Authenticating mangaka.',
  );
  const [submitting, setSubmitting] = useState(false);
  const uploadStarted = useRef(false);
  const uploadSucceeded = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const pendingDataStr = localStorage.getItem('mangasketch_pending_upload');
    if (!pendingDataStr || uploadStarted.current) {
      if (!submitting && !uploadSucceeded.current) {
        router.push('/');
      }
      return;
    }

    const recoverSketch = async () => {
      uploadStarted.current = true;
      setSubmitting(true);
      setStatus('RECOVERING PREVIOUS SKETCH... SAVING TO SKETCHBOOK.');

      try {
        const pendingData = JSON.parse(pendingDataStr);

        await apiFetch<GenerateSketchResponse>('/api/sketches', {
          method: 'POST',
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

        localStorage.removeItem('mangasketch_pending_upload');
        uploadSucceeded.current = true;
        router.push('/sketches?toast=recovered');
      } catch (err: unknown) {
        console.error('Error recovering sketch:', err);
        const errMsg =
          err instanceof Error ? err.message : 'Failed to recover sketch.';

        // Safeguard: do not delete the pending sketch if it was a connection error, so they can try again later.
        const isOffline = errMsg.includes('SERVER UNREACHABLE');
        if (!isOffline) {
          localStorage.removeItem('mangasketch_pending_upload');
        }

        showToast('error', errMsg);
        router.push('/');
      } finally {
        setSubmitting(false);
      }
    };

    recoverSketch();
  }, [loading, user, session, router, submitting, showToast]);

  return (
    <div className='min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center p-6 text-foreground'>
      <div className='bg-background border-4 border-foreground p-8 max-w-md w-full text-center neo-shadow'>
        <div className='flex justify-center mb-4 text-foreground'>
          <MagicEdit className='w-12 h-12 animate-sketch' />
        </div>
        <h1 className='font-display text-2xl mb-2 tracking-wide uppercase'>
          {submitting ? 'SECURING ARTWORK...' : 'INKING IDENTITY...'}
        </h1>
        <p className='font-mono text-sm text-neutral'>{status}</p>
      </div>
    </div>
  );
}
