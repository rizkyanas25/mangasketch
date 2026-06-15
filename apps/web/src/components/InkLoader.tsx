'use client';

import { useState, useEffect } from "react";
import { MagicEdit } from "pixelarticons/react";

const SUBTITLES = [
  "Sharpening nib. Laying down guidelines.",
  "Inking outlines with sumi ink.",
  "Applying screentone dot patterns.",
  "Brushing shadows and contrast gradients.",
  "Finalizing draft. Cleaning ink smudges."
];

export default function InkLoader() {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % SUBTITLES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 h-full min-h-[350px] w-full">
      <div className="flex justify-center mb-4 text-foreground">
        <MagicEdit className="w-12 h-12 animate-sketch text-red-500" />
      </div>
      <h2 className="font-display text-2xl mb-2 tracking-wide uppercase">
        INKING SKETCH...
      </h2>
      <p className="font-mono text-[10px] text-neutral min-h-[1.5rem] uppercase">
        {SUBTITLES[subtitleIndex]}
      </p>
    </div>
  );
}
