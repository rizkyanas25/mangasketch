'use client';

import React, { useRef, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
} from '@mangasketch/shared';
import { MagicEdit, Lock } from 'pixelarticons/react';
import GenerateForm from '@/components/GenerateForm';
import { useAuth } from '@/providers/AuthProvider';
import { generateSketchAction } from './actions';
import MangaCanvas from '@/components/MangaCanvas';
import { useUiStore } from '@/store/uiStore';
import { GoogleIcon } from '@/components/GoogleIcon';
import { HankoStamp } from '@/components/HankoStamp';
import { LoginButton } from '@/components/LoginButton';
import { FadeInImage } from '@/components/FadeInImage';

export default function Home() {
  const { session, user, login } = useAuth();
  const setIsGenerating = useUiStore((state) => state.setIsGenerating);
  const showToast = useUiStore((state) => state.showToast);
  const canvasRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [state, formAction, isPending] = useActionState(generateSketchAction, {
    data: null,
    error: null,
  });

  const wasPending = useRef(isPending);
  useEffect(() => {
    setIsGenerating(isPending);
    wasPending.current = isPending;
  }, [isPending, setIsGenerating]);

  // Trigger global success toast & refresh data when sketch is successfully generated
  useEffect(() => {
    if (state.data?.imageUrl) {
      // Invalidate quota for both guest and auth users on successful generation
      queryClient.invalidateQueries({ queryKey: ['quota'] });

      if (user) {
        showToast('success', 'SKETCH SECURED! Saved to sketchbook.', true);
        queryClient.invalidateQueries({ queryKey: ['sketches', user?.id] });
      }
    }
  }, [state.data?.imageUrl, user, showToast, queryClient]);

  // Auto-scroll to canvas when generation starts (centered in viewport)
  useEffect(() => {
    if (isPending && canvasRef.current) {
      canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isPending]);

  const handleGenerateSubmit = (formData: {
    prompt: string;
    mangaStyle: MangaStyle;
    drawingStyle: DrawingStyle;
    watermarkText: string;
    watermarkPosition: WatermarkPosition;
    lockSeed: boolean;
  }) => {
    const fd = new FormData();
    fd.append('token', session?.access_token || '');
    fd.append('prompt', formData.prompt);
    fd.append('mangaStyle', formData.mangaStyle);
    fd.append('drawingStyle', formData.drawingStyle);
    if (formData.watermarkText) {
      fd.append('watermarkText', formData.watermarkText);
      fd.append('watermarkPosition', formData.watermarkPosition);
    }
    React.startTransition(() => {
      formAction(fd);
    });
  };

  // Auto-cache anonymous sketch data to localStorage immediately upon generation
  useEffect(() => {
    if (state.data?.imageUrl && !state.data.saved && !user) {
      localStorage.setItem(
        'mangasketch_pending_upload',
        JSON.stringify({
          prompt: state.data.prompt,
          mangaStyle: state.data.mangaStyle,
          drawingStyle: state.data.drawingStyle,
          seed: state.data.seed,
          imageUrl: state.data.imageUrl,
          watermarkText: state.data.watermarkText,
          watermarkPosition: state.data.watermarkPosition,
        }),
      );
    }
  }, [state.data, user]);

  return (
    <div className='flex flex-col gap-6 md:gap-10'>
      {/* 1. Hero Header Panel */}
      <section className='bg-background border-4 border-foreground p-6 md:p-8 neo-shadow relative overflow-visible'>
        {/* Screentone background */}
        <div className='absolute inset-0 bg-screentone pointer-events-none opacity-50' />
        {/* Speed lines for drama */}
        <div className='manga-speedlines absolute inset-0 pointer-events-none' />

        <div className='relative z-10 text-left max-w-3xl pr-[95px] sm:pr-[150px] md:pr-0 md:max-w-[70%] lg:max-w-[72%] xl:max-w-3xl'>
          <h1 className='font-display text-4xl md:text-6xl tracking-wide uppercase mb-3 leading-[0.95]'>
            TURN YOUR MANGA IDEAS INTO{' '}
            <span className='bg-foreground text-background px-2 py-0.5 inline-block'>
              VISUAL CONCEPTS
            </span>{' '}
            IN SECONDS
          </h1>
          <p className='font-sans text-sm md:text-base text-neutral font-medium max-w-lg'>
            AI manga panel generator for everyone. Turn your scene ideas into monochrome sketches, experiment with various drawing stages, and build your personal sketchbook.
          </p>
        </div>

        {/* Right: Large decorative tilted manga panel — overflows the section with strict 3:4 aspect ratio */}
        <div className='absolute -right-2 -mt-10 sm:-mt-0 md:-right-1 lg:right-6 lg:-mt-2 xl:-right-6 xl:-mt-0 top-1/2 -translate-y-1/2 w-[150px] sm:w-[170px] md:w-[220px] lg:w-[250px] xl:w-[220px] aspect-[3/4] z-20 pointer-events-none'>
          <div className='w-full h-full border-4 border-foreground neo-shadow-lg bg-background rotate-[4deg] relative overflow-hidden'>
            <FadeInImage
              src='/assets/hero-panel.webp'
              alt='Manga Panel Concept'
              duration={500}
              className='w-full h-full object-cover relative z-0'
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Tilted panel Hanko Stamp signature */}
            <HankoStamp className='absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 md:bottom-2 md:right-2 lg:bottom-2.5 lg:right-2.5 xl:bottom-3 xl:right-3 w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 z-20 opacity-95' />
          </div>
        </div>
      </section>

      {/* 2. Main Workspace: Flex Row (Form Left, Canvas Right) */}
      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Left: Input Form Panel */}
        <GenerateForm
          mode='create'
          sketch={state.data ? {
            id: state.data.id,
            prompt: state.data.prompt,
            manga_style: state.data.mangaStyle,
            drawing_style: state.data.drawingStyle,
            image_url: state.data.imageUrl,
            seed: state.data.seed,
          } as any : null}
          isGenerating={isPending}
          hasExistingImage={!!state.data?.imageUrl}
          onSubmit={handleGenerateSubmit}
        />

        <section
          ref={canvasRef}
          className='lg:flex-[7] flex flex-col bg-background border-4 border-foreground neo-shadow aspect-[3/4] p-4'
        >
          <MangaCanvas
            imageUrl={state.data?.imageUrl}
            isPending={isPending}
            error={state.error}
            prompt={state.data?.prompt || ''}
            sketchId={state.data?.id}
            mangaStyle={state.data?.mangaStyle}
            drawingStyle={state.data?.drawingStyle}
            seed={state.data?.seed}
            saved={state.data?.saved}
          />

          {/* Iterate CTA (Only shown to authenticated users after generating a sketch) */}
          {state.data?.imageUrl && user && (
            <Link
              href={`/sketches/${state.data.id}`}
              className='mt-4 w-full font-display text-lg md:text-xl py-4 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all uppercase flex items-center justify-center gap-2'
            >
              <MagicEdit className='w-5 h-5' />
              ITERATE & RESKETCH THIS PANEL
            </Link>
          )}
        </section>
      </div>

      {/* 3. Anonymous CTA Banner (shown after successful generation, if not logged in) */}
      {state.data?.imageUrl && !user && !isPending && (
        <section className='bg-background border-4 border-foreground p-6 neo-shadow relative overflow-hidden'>
          <div className='absolute inset-0 bg-screentone pointer-events-none opacity-30' />
          <div className='relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6'>
            <Lock className='w-10 h-10 text-foreground flex-shrink-0' />
            <div className='flex-1 text-center md:text-left'>
              <h3 className='font-display text-xl uppercase tracking-wide mb-1'>
                SAVE THIS TO YOUR SKETCHBOOK
              </h3>
              <p className='font-mono text-[10px] text-neutral uppercase'>
                Your sketch will vanish when you leave this page. Sign in to keep
                it forever. It's FREE!
              </p>
            </div>
            <LoginButton />
          </div>
        </section>
      )}
    </div>
  );
}
