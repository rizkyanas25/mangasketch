'use client';

import { useState, useEffect } from 'react';
import { MagicEdit } from 'pixelarticons/react';

const SUBTITLES = [
  'Sharpening nib. Laying down guidelines.',
  'Inking outlines with sumi ink.',
  'Applying screentone dot patterns.',
  'Brushing shadows and contrast gradients.',
  'Finalizing draft. Cleaning ink smudges.',
];

const QUOTES = [
  '"Patience is the tool of the master mangaka."',
  '"A single ink stroke can carry a thousand emotions."',
  '"The blank page is not empty — it is full of possibility."',
];

export default function InkLoader() {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [quoteIndex] = useState(() =>
    Math.floor(Math.random() * QUOTES.length),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % SUBTITLES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='manga-speedlines relative flex flex-col items-center justify-center text-center p-8 min-h-[350px] w-full overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center max-w-md'>
        {/* Animated Pen Icon */}
        <div className='mb-6'>
          <MagicEdit className='w-14 h-14 animate-sketch text-foreground' />
        </div>

        {/* Dramatic Main Title */}
        <h2 className='font-display text-3xl md:text-4xl italic tracking-wide mb-4 leading-tight'>
          Sketching your idea...
        </h2>

        {/* Rotating Status Subtitle */}
        <p className='font-mono text-[10px] text-neutral tracking-widest uppercase min-h-[1.5rem] animate-pulse-slow'>
          {SUBTITLES[subtitleIndex]}
        </p>

        {/* Manga Wisdom Quote */}
        <p className='font-sans text-xs text-neutral/50 italic mt-6 max-w-xs'>
          {QUOTES[quoteIndex]}
        </p>
      </div>
    </div>
  );
}
