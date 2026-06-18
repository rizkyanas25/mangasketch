'use client';

import { useState, useEffect } from 'react';
import { MagicEdit } from 'pixelarticons/react';

const SUBTITLES_GENERATE = [
  'Sharpening nib. Laying down guidelines.',
  'Inking outlines with sumi ink.',
  'Applying screentone dot patterns.',
  'Brushing shadows and contrast gradients.',
  'Finalizing draft. Cleaning ink smudges.',
];

const SUBTITLES_FETCH = [
  'Locating canvas details',
  'Loading history versions',
  'Preparing workspace',
];

const QUOTES = [
  '"Patience is the tool of the master mangaka."',
  '"A single ink stroke can carry a thousand emotions."',
  '"The blank page is not empty — it is full of possibility."',
];

interface CanvasPanelLoadingProps {
  loadingType?: 'fetch' | 'generate';
}

export default function CanvasPanelLoading({
  loadingType = 'generate',
}: CanvasPanelLoadingProps) {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);

  const subtitles = loadingType === 'fetch' ? SUBTITLES_FETCH : SUBTITLES_GENERATE;

  useEffect(() => {
    // Pick a random quote index on mount to prevent hydration mismatch
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [subtitles.length]);

  return (
    <div className='manga-speedlines relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center max-w-md'>
        {/* Animated Pen Icon */}
        <div className='mb-6'>
          <MagicEdit className='w-14 h-14 animate-sketch text-foreground' />
        </div>

        {/* Dramatic Main Title */}
        <h2 className='font-display text-3xl md:text-4xl italic tracking-wide mb-4 leading-tight'>
          {loadingType === 'fetch' ? 'Retrieving sketch' : 'Sketching your idea'}
        </h2>

        {/* Rotating Status Subtitle */}
        <p className='font-mono text-[10px] text-neutral tracking-widest uppercase min-h-[1.5rem] animate-pulse-slow'>
          {subtitles[subtitleIndex]}
        </p>

        {/* Manga Wisdom Quote */}
        {quoteIndex !== null && (
          <p className='font-sans text-xs text-neutral/50 italic mt-6 max-w-xs'>
            {QUOTES[quoteIndex]}
          </p>
        )}
      </div>
    </div>
  );
}
