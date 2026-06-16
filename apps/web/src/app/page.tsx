'use client';

import { useState, useRef, useActionState, useEffect } from 'react';
import {
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
} from '@mangasketch/shared';
import { MagicEdit, Lock } from 'pixelarticons/react';
import StyleSelector from '@/components/StyleSelector';
import { useAuth } from '@/providers/AuthProvider';
import { generateSketchAction } from './actions';
import InkLoader from '@/components/InkLoader';
import ErrorPanel from '@/components/ErrorPanel';
import { useUiStore } from '@/store/uiStore';
import { GoogleIcon } from '@/components/GoogleIcon';

export default function Home() {
  const { session, user, login } = useAuth();
  const setIsGenerating = useUiStore((state) => state.setIsGenerating);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Local state for form controls
  const [prompt, setPrompt] = useState('');
  const [mangaStyle, setMangaStyle] = useState<MangaStyle>('SHONEN');
  const [drawingStyle, setDrawingStyle] =
    useState<DrawingStyle>('ROUGH_SKETCH');

  // Hanko Watermark state (starts empty, placeholder is Your initial)
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] =
    useState<WatermarkPosition>('BOTTOM_RIGHT');

  const [state, formAction, isPending] = useActionState(generateSketchAction, {
    data: null,
    error: null,
  });

  useEffect(() => {
    setIsGenerating(isPending);
  }, [isPending, setIsGenerating]);

  // Auto-scroll to canvas on mobile when generation starts
  useEffect(() => {
    if (isPending && canvasRef.current) {
      canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isPending]);


  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) {
      setPrompt(e.target.value);
    }
  };

  return (
    <div className='flex flex-col gap-6 md:gap-10'>
      {/* 1. Hero Header Panel */}
      <section className='bg-background border-4 border-foreground p-6 md:p-8 neo-shadow relative overflow-visible'>
        {/* Screentone background */}
        <div className='absolute inset-0 bg-screentone pointer-events-none opacity-50' />
        {/* Speed lines for drama */}
        <div className='manga-speedlines absolute inset-0 pointer-events-none' />

        <div className='relative z-10 text-center md:text-left max-w-3xl'>
          <h1 className='font-display text-4xl md:text-6xl tracking-wide uppercase mb-3 leading-[0.95]'>
            TURN YOUR MANGA IDEAS INTO{' '}
            <span className='bg-foreground text-background px-2 py-0.5 inline-block'>
              VISUAL CONCEPTS
            </span>{' '}
            IN SECONDS
          </h1>
          <p className='font-sans text-sm md:text-base text-neutral font-medium max-w-lg'>
            Visualizer for mangaka. Sketch layouts, character designs, tonal ink
            and screentone aesthetics.
          </p>
        </div>

        {/* Right: Large decorative tilted manga panel — overflows the section with strict 3:4 aspect ratio */}
        <div className='hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-[220px] aspect-[3/4] z-20 pointer-events-none'>
          <div className='w-full h-full border-4 border-foreground neo-shadow-lg bg-background rotate-[4deg] relative overflow-hidden'>
            <div className='absolute inset-0 bg-screentone-dense opacity-20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='font-display text-[120px] text-foreground/[0.06] select-none leading-none'>
                漫
              </span>
            </div>
            {/* Placeholder — swap this img src with your manga panel later */}
            {/* <img src="/hero-panel.png" alt="" className="w-full h-full object-cover" /> */}
          </div>
        </div>
      </section>

      {/* 2. Main Workspace: Flex Row (Form Left, Canvas Right) */}
      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Left: Input Form Panel */}
        <form
          action={formAction}
          className='lg:flex-[5] flex flex-col gap-6 bg-background border-4 border-foreground p-6 neo-shadow'
        >
          {/* Hidden inputs to pass states to Server Action */}
          <input
            type='hidden'
            name='token'
            value={session?.access_token || ''}
          />
          <input type='hidden' name='mangaStyle' value={mangaStyle} />
          <input type='hidden' name='drawingStyle' value={drawingStyle} />
          <input type='hidden' name='watermarkText' value={watermarkText} />
          <input
            type='hidden'
            name='watermarkPosition'
            value={watermarkPosition}
          />

          {/* Prompt Textarea */}
          <div className='flex flex-col gap-2'>
            <label className='font-mono text-xs font-bold uppercase tracking-wider flex justify-between'>
              <span>DESCRIBE YOUR SCENE</span>
              <span className='text-neutral'>{prompt.length}/500</span>
            </label>
            <textarea
              name='prompt'
              value={prompt}
              disabled={isPending}
              onChange={handlePromptChange}
              placeholder='E.G., YOUNG PIRATE CAPTAIN DESCENDING FROM THE SKY ABOVE A BATTLEFIELD, SOLDIERS LOOKING UP IN SHOCK, THE FINAL WAR ABOUT TO BEGIN...'
              className={`w-full min-h-[120px] p-3 border-2 border-foreground bg-background text-foreground font-mono text-sm placeholder:font-mono placeholder:text-sm placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all resize-none rounded-none uppercase ${
                isPending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
            disabled={isPending}
          />

          {/* Full-Width Generate Button */}
          <button
            type='submit'
            disabled={isPending || !prompt.trim()}
            className='w-full font-display text-lg md:text-xl py-4 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-none uppercase flex items-center justify-center gap-2'
          >
            <MagicEdit className='w-6 h-6' />
            SKETCH THIS IDEA
          </button>
        </form>

        <section
          ref={canvasRef}
          className='lg:flex-[7] flex flex-col bg-background border-4 border-foreground neo-shadow aspect-[3/4] p-4'
        >
          <div className={`flex-1 w-full flex flex-col items-center justify-center border-4 border-dashed relative transition-colors overflow-hidden ${state.data?.imageUrl ? 'border-foreground' : 'border-foreground/30'}`}>
            {isPending ? (
              <InkLoader />
            ) : state.error ? (
              <ErrorPanel error={state.error} />
            ) : state.data?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={state.data.imageUrl}
                alt='Generated Manga Panel'
                className='w-full h-full object-cover'
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
        </section>
      </div>

      {/* 3. Anonymous CTA Banner (shown after successful generation, if not logged in) */}
      {state.data?.imageUrl && !user && (
        <section className='bg-background border-4 border-foreground p-6 neo-shadow relative overflow-hidden'>
          <div className='absolute inset-0 bg-screentone pointer-events-none opacity-30' />
          <div className='relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6'>
            <Lock className='w-10 h-10 text-foreground flex-shrink-0' />
            <div className='flex-1 text-center md:text-left'>
              <h3 className='font-display text-xl uppercase tracking-wide mb-1'>
                SAVE THIS TO YOUR SKETCHBOOK
              </h3>
              <p className='font-mono text-[10px] text-neutral uppercase'>
                Your sketch will vanish when you leave this page. Login to keep
                it forever.
              </p>
            </div>
            <button
              type='button'
              onClick={() => login()}
              className='font-display px-6 py-2 text-sm border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase flex-shrink-0 flex items-center gap-2'
            >
              <GoogleIcon className='w-5 h-5' />
              LOGIN
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
