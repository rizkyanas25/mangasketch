'use client';

import React, { useState } from 'react';
import { Expand, Download, Close } from 'pixelarticons/react';
import CanvasPanelLoading from './CanvasPanelLoading';
import CanvasPanelError from './CanvasPanelError';
import { FadeInImage } from './FadeInImage';

interface MangaCanvasProps {
  imageUrl?: string | null;
  isPending: boolean;
  error: string | null;
  prompt?: string;
  loadingType?: 'fetch' | 'generate';
  sketchId?: string;
  mangaStyle?: string | null;
  drawingStyle?: string | null;
  seed?: number;
  saved?: boolean;
}

export default function MangaCanvas({
  imageUrl,
  isPending,
  error,
  prompt = 'Generated Manga Panel',
  loadingType = 'generate',
  sketchId,
  mangaStyle,
  drawingStyle,
  seed,
  saved = false,
}: MangaCanvasProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasImage = !!imageUrl;

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!imageUrl) return;

    // Compile informatively structured filename
    const prefix = saved && sketchId ? sketchId.slice(0, 8) : 'anonymous';
    const mStyle = mangaStyle ? String(mangaStyle).toLowerCase() : 'manga';
    const dStyle = drawingStyle
      ? String(drawingStyle).toLowerCase().replace(/_/g, '-')
      : 'style';
    const seedVal = seed !== undefined ? seed : 'random';
    const fileName = `mangasketch-${prefix}-${mStyle}-${dStyle}-${seedVal}.png`;

    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error('Fetch failed');
      const webpBlob = await res.blob();

      // Load into offscreen Image
      const img = new Image();
      const objectUrl = URL.createObjectURL(webpBlob);
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Create offscreen canvas matching exact dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          console.warn('PNG conversion failed, downloading WebP fallback');
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = fileName.replace('.png', '.webp');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(objectUrl);
      }, 'image/png');
    } catch (err) {
      console.warn(
        'CORS or canvas error, falling back to open in new tab:',
        err,
      );
      window.open(imageUrl, '_blank');
    }
  };

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
        <div className='relative w-full h-full flex items-center justify-center group/canvas-img bg-background'>
          <FadeInImage
            src={imageUrl}
            alt={prompt}
            duration={300}
            className='w-full h-full object-contain select-none'
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
          {/* Hover Overlay */}
          <div className='absolute inset-0 bg-foreground/20 backdrop-blur-[1px] opacity-0 group-hover/canvas-img:opacity-100 transition-all duration-200 flex items-center justify-center gap-4 z-10 select-none'>
            {/* Expand Button wrapper */}
            <div className='relative group/btn'>
              <button
                type='button'
                onClick={() => setIsExpanded(true)}
                className='bg-background text-foreground border-2 border-foreground p-3 hover:bg-foreground hover:text-background hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all neo-shadow-sm flex items-center justify-center cursor-pointer'
              >
                <Expand className='w-5 h-5' />
              </button>
              {/* Brutalist speech-bubble / box tooltip */}
              <span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/btn:block bg-background border-2 border-foreground px-2 py-1 text-[10px] font-mono font-bold text-foreground neo-shadow-sm z-30 uppercase whitespace-nowrap select-none'>
                EXPAND PANEL
              </span>
            </div>

            {/* Download Button wrapper */}
            <div className='relative group/btn'>
              <button
                type='button'
                onClick={handleDownload}
                className='bg-background text-foreground border-2 border-foreground p-3 hover:bg-foreground hover:text-background hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all neo-shadow-sm flex items-center justify-center cursor-pointer'
              >
                <Download className='w-5 h-5' />
              </button>
              {/* Brutalist speech-bubble / box tooltip */}
              <span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover/btn:block bg-background border-2 border-foreground px-2 py-1 text-[10px] font-mono font-bold text-foreground neo-shadow-sm z-30 uppercase whitespace-nowrap select-none'>
                DOWNLOAD PANEL
              </span>
            </div>
          </div>
        </div>
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

      {/* Fullscreen Expand Modal */}
      {isExpanded && imageUrl && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 select-none'>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-background/90 backdrop-blur-xs cursor-zoom-out'
            onClick={() => setIsExpanded(false)}
          />

          {/* Action Buttons in upper right corner of viewport */}
          <div className='absolute top-4 right-4 md:top-8 md:right-8 flex gap-2 z-20'>
            {/* Download Button */}
            <button
              type='button'
              onClick={handleDownload}
              title='DOWNLOAD PANEL'
              className='border-2 border-foreground bg-background text-foreground p-2 hover:bg-foreground hover:text-background transition-colors cursor-pointer flex items-center justify-center neo-shadow-sm'
            >
              <Download className='w-5 h-5' />
            </button>

            {/* Close Button */}
            <button
              type='button'
              onClick={() => setIsExpanded(false)}
              title='CLOSE'
              className='border-2 border-foreground bg-background text-foreground p-2 hover:bg-foreground hover:text-background transition-colors cursor-pointer flex items-center justify-center neo-shadow-sm'
            >
              <Close className='w-5 h-5' />
            </button>
          </div>

          {/* Image Container (centered, maximized, no card structure) */}
          <div className='relative max-w-full max-h-[90vh] flex items-center justify-center z-10 bg-background'>
            <FadeInImage
              src={imageUrl}
              alt={prompt}
              duration={300}
              className='max-w-[90vw] max-h-[90vh] object-contain border-4 border-foreground neo-shadow bg-background'
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
