'use client';

import { useState } from 'react';
import {
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
} from '@mangasketch/shared';
import { MagicEdit } from 'pixelarticons/react';
import StyleSelector from '@/components/StyleSelector';

export default function Home() {
  // Local state for form controls
  const [prompt, setPrompt] = useState('');
  const [mangaStyle, setMangaStyle] = useState<MangaStyle>('SHONEN');
  const [drawingStyle, setDrawingStyle] =
    useState<DrawingStyle>('ROUGH_SKETCH');

  // Hanko Watermark state (starts empty, placeholder is Your initial)
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] =
    useState<WatermarkPosition>('BOTTOM_RIGHT');

  // Mock states for testing UI
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) {
      setPrompt(e.target.value);
    }
  };

  return (
    <div className='flex flex-col gap-6 md:gap-10'>
      {/* 1. Hero Header Panel */}
      <section className='bg-background border-4 border-foreground p-6 md:p-8 neo-shadow relative overflow-hidden'>
        {/* Subtle decorative background screentone strip */}
        <div className='absolute inset-0 bg-screentone pointer-events-none opacity-40' />

        <div className='relative z-10 text-center md:text-left max-w-4xl'>
          <h1 className='font-display text-3xl md:text-5xl tracking-wide uppercase mb-3 leading-none'>
            TURN YOUR MANGA IDEAS INTO VISUAL CONCEPTS IN SECONDS
          </h1>
          <p className='font-sans text-sm md:text-base text-neutral-dark font-medium max-w-2xl'>
            Explore characters, scenes, and creative directions through distinct
            manga styles and drawing techniques.
          </p>
        </div>
      </section>

      {/* 2. Main Workspace: 2-Column Grid (Form Left, Canvas Right) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* Left: Input Form Panel (Cols: 5) */}
        <form className='lg:col-span-5 flex flex-col gap-6 bg-background border-4 border-foreground p-6 neo-shadow'>
          {/* Prompt Textarea */}
          <div className='flex flex-col gap-2'>
            <label className='font-mono text-xs font-bold uppercase tracking-wider flex justify-between'>
              <span>DESCRIBE YOUR SCENE</span>
              <span className='text-neutral'>{prompt.length}/500</span>
            </label>
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder='E.G., YOUNG PIRATE CAPTAIN DESCENDING FROM THE SKY ABOVE A BATTLEFIELD, SOLDIERS LOOKING UP IN SHOCK, THE FINAL WAR ABOUT TO BEGIN...'
              className='w-full min-h-[120px] p-3 border-2 border-foreground bg-background text-foreground font-mono text-sm placeholder:font-mono placeholder:text-sm placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all resize-none rounded-none uppercase'
            />
          </div>

          {/* Style Selector including Hanko options */}
          <StyleSelector
            mangaStyle={mangaStyle}
            setMangaStyle={setMangaStyle}
            drawingStyle={drawingStyle}
            setDrawingStyle={setDrawingStyle}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            watermarkPosition={watermarkPosition}
            setWatermarkPosition={setWatermarkPosition}
          />

          {/* Large Generate Button */}
          <button
            type='submit'
            disabled={isLoading || !prompt.trim()}
            className='w-full font-display text-lg md:text-xl py-3 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-none uppercase flex items-center justify-center gap-2'
          >
            <MagicEdit className='w-6 h-6' />
            SKETCH THIS IDEA
          </button>
        </form>

        {/* Right: Manga Panel Canvas Workspace (Cols: 7) */}
        <section className='lg:col-span-7 flex flex-col bg-background border-4 border-foreground p-6 neo-shadow h-full min-h-[500px]'>
          <div className='flex-1 flex flex-col items-center justify-center border-4 border-dashed border-foreground/30 bg-screentone-dense/10 p-6 min-h-[400px] relative transition-colors'>
            {generatedImage ? (
              <div className='relative w-full h-full max-w-md aspect-[3/4] border-2 border-foreground bg-white neo-shadow-sm overflow-hidden'>
                {/* Image will be rendered here */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedImage}
                  alt='Manga Panel Generation'
                  className='w-full h-full object-cover'
                />
              </div>
            ) : (
              <div className='text-center max-w-sm'>
                <div className='font-display text-5xl text-foreground/25 mb-4 select-none'>
                  BLANK PAGE
                </div>
                <p className='font-mono text-[10px] text-neutral tracking-wide uppercase'>
                  DESCRIBE A SCENE ON THE LEFT.
                  <br />
                  YOUR SKETCH WILL MATERIALIZE HERE.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
