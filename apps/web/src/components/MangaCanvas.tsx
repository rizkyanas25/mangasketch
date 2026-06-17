'use client';

import React from 'react';
import CanvasPanelLoading from './CanvasPanelLoading';
import CanvasPanelError from './CanvasPanelError';

interface MangaCanvasProps {
  imageUrl?: string | null;
  isPending: boolean;
  error: string | null;
  prompt?: string;
  loadingType?: 'fetch' | 'generate';
}

export default function MangaCanvas({
  imageUrl,
  isPending,
  error,
  prompt = 'Generated Manga Panel',
  loadingType = 'generate',
}: MangaCanvasProps) {
  const hasImage = !!imageUrl;

  return (
    <div
      className={`flex-1 w-full flex flex-col items-center justify-center border-4 border-dashed relative transition-colors overflow-hidden ${
        hasImage ? 'border-foreground' : 'border-foreground/30'
      }`}
    >
      {isPending ? (
        <CanvasPanelLoading loadingType={loadingType} />
      ) : error ? (
        <CanvasPanelError error={error} />
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={prompt}
          className='w-full h-full object-contain'
        />
      ) : (
        <div className='text-center max-w-sm p-6'>
          <div className='font-display text-5xl text-foreground/20 mb-4 select-none'>
            BLANK PAGE
          </div>
          <p className='font-mono text-[10px] text-neutral tracking-wide uppercase'>
            DESCRIBE A SCENE ON THE LEFT.
            <br />
            YOUR CONCEPT WILL MATERIALIZE HERE.
          </p>
        </div>
      )}
    </div>
  );
}
