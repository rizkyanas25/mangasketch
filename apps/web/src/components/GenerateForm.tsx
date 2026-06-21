'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { getQuotaAction } from '@/app/actions';
import {
  Sketch,
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
  GetQuotaResponse,
} from '@mangasketch/shared';
import StyleSelector from './StyleSelector';
import { MagicEdit } from 'pixelarticons/react';
import { useUiStore } from '@/store/uiStore';

interface GenerateFormProps {
  sketch?: Sketch | null;
  mode?: 'create' | 'edit';
  isPageLoading?: boolean;
  isGenerating: boolean;
  hasExistingImage?: boolean;
  onSubmit: (data: {
    prompt: string;
    mangaStyle: MangaStyle;
    drawingStyle: DrawingStyle;
    watermarkText: string;
    watermarkPosition: WatermarkPosition;
    lockSeed: boolean;
  }) => void;
}

export default function GenerateForm({
  sketch,
  mode = 'create',
  isPageLoading = false,
  isGenerating,
  hasExistingImage = false,
  onSubmit,
}: GenerateFormProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const showToast = useUiStore((state) => state.showToast);

  const { data: quota, error: quotaError } = useQuery<GetQuotaResponse>({
    queryKey: ['quota', user?.id],
    queryFn: async () => {
      const res = await getQuotaAction(session?.access_token || undefined);
      if (res.error) {
        throw new Error(res.error);
      }
      return res.data!;
    },
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Trigger error toast if fetching quota fails (e.g. server is offline)
  useEffect(() => {
    if (quotaError) {
      showToast('error', quotaError.message);
    }
  }, [quotaError, showToast]);

  // Track isGenerating transition to invalidate quota query
  const wasGenerating = useRef(isGenerating);
  useEffect(() => {
    if (wasGenerating.current && !isGenerating) {
      queryClient.invalidateQueries({ queryKey: ['quota'] });
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating, queryClient]);
  // Initialize state directly from the sketch prop if available, or default based on mode
  const [prompt, setPrompt] = useState(sketch?.prompt || '');
  const [mangaStyle, setMangaStyle] = useState<MangaStyle | null>(() => {
    if (sketch) return sketch.manga_style as MangaStyle;
    return mode === 'create' ? 'SHONEN' : null;
  });
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle | null>(() => {
    if (sketch) return sketch.drawing_style as DrawingStyle;
    return mode === 'create' ? 'ROUGH_SKETCH' : null;
  });
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPosition, setWatermarkPosition] =
    useState<WatermarkPosition>('BOTTOM_RIGHT');
  const [lockSeed, setLockSeed] = useState(false);

  const isPromptChanged =
    mode === 'edit' && !!sketch && prompt !== sketch.prompt;
  const isMangaStyleChanged =
    mode === 'edit' && !!sketch && mangaStyle !== sketch.manga_style;
  const isDrawingStyleChanged =
    mode === 'edit' && !!sketch && drawingStyle !== sketch.drawing_style;
  const hasChanges =
    mode === 'create' ||
    isPromptChanged ||
    isMangaStyleChanged ||
    isDrawingStyleChanged;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) {
      setPrompt(e.target.value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isPageLoading ||
      isGenerating ||
      !prompt.trim() ||
      !mangaStyle ||
      !drawingStyle ||
      (mode === 'edit' && !hasChanges)
    )
      return;

    onSubmit({
      prompt,
      mangaStyle,
      drawingStyle,
      watermarkText,
      watermarkPosition,
      lockSeed,
    });
  };

  const isDisabled = isPageLoading || isGenerating;
  const isSubmitDisabled =
    isDisabled ||
    !prompt.trim() ||
    !mangaStyle ||
    !drawingStyle ||
    (mode === 'edit' && !hasChanges);

  // Determine button text
  let buttonText = 'SKETCH THIS IDEA';
  if (isPageLoading || isGenerating) {
    buttonText = 'LOADING SKETCH';
  } else if (mode === 'edit') {
    buttonText = hasChanges ? 'SKETCH NEW VERSION' : 'NO CHANGES DETECTED';
  } else if (hasExistingImage) {
    buttonText = 'SKETCH A NEW IDEA';
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='lg:flex-[5] flex flex-col gap-6 bg-background border-4 border-foreground p-6 neo-shadow'
    >
      {/* Describe prompt textarea */}
      <div className='flex flex-col gap-2'>
        <label className='font-mono text-xs font-bold uppercase tracking-wider flex justify-between'>
          <span className='flex items-center gap-2'>
            <span>DESCRIBE YOUR SCENE</span>
            {isPromptChanged && (
              <span className='text-destructive font-mono text-[9px] font-bold tracking-widest'>
                [ CHANGED ]
              </span>
            )}
          </span>
          <span className='text-neutral'>{prompt?.length || 0}/500</span>
        </label>
        <textarea
          disabled={isDisabled}
          value={isPageLoading ? '' : prompt}
          onChange={handlePromptChange}
          placeholder={
            isPageLoading
              ? 'LOADING SKETCH'
              : 'E.G., YOUNG PIRATE CAPTAIN DESCENDING FROM THE SKY ABOVE A BATTLEFIELD, SOLDIERS LOOKING UP IN SHOCK, THE FINAL WAR ABOUT TO BEGIN...'
          }
          className='w-full min-h-[120px] p-3 border-2 border-foreground bg-background text-foreground font-mono text-sm placeholder:font-mono placeholder:text-sm placeholder:text-neutral focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 transition-all resize-none rounded-none uppercase'
        />
      </div>

      {/* Style Selector */}
      <StyleSelector
        mangaStyle={mangaStyle}
        setMangaStyle={setMangaStyle}
        drawingStyle={drawingStyle}
        setDrawingStyle={setDrawingStyle}
        watermarkText={watermarkText}
        setWatermarkText={setWatermarkText}
        watermarkPosition={watermarkPosition}
        setWatermarkPosition={setWatermarkPosition}
        disabled={isDisabled}
        isMangaStyleChanged={isMangaStyleChanged}
        isDrawingStyleChanged={isDrawingStyleChanged}
      />

      {/* Lock Seed Toggle (Only shown in edit/detail page mode) */}
      {mode === 'edit' && (
        <div className='flex items-center gap-2 font-mono text-xs border-2 border-foreground p-3 bg-background relative group/seed cursor-pointer'>
          <input
            type='checkbox'
            id='lockSeed'
            disabled={isDisabled || !sketch}
            checked={lockSeed}
            onChange={(e) => setLockSeed(e.target.checked)}
            className='w-4 h-4 cursor-pointer accent-foreground rounded-none'
          />
          <label
            htmlFor='lockSeed'
            className='cursor-pointer uppercase font-bold flex-1 flex justify-between items-center'
          >
            <span>LOCK VARIATION SEED</span>
            <span className='text-neutral relative'>
              [ SEED: {sketch?.seed || '...'} ]{/* Tooltip */}
              <span className='absolute bottom-full mb-2 right-0 hidden group-hover/seed:block bg-background border-2 border-foreground p-2 text-[10px] text-foreground w-64 neo-shadow-sm z-30 normal-case font-medium font-mono text-left'>
                Locks the composition seed to keep characters and layout
                consistent while you refine prompts or styles.
              </span>
            </span>
          </label>
        </div>
      )}

      {/* Quota Indicator */}
      <div className='flex items-center gap-2 font-mono text-xs border-2 border-foreground p-3 bg-background relative group/quota cursor-help'>
        <span className='font-bold flex-1 flex flex-wrap justify-between items-center gap-x-2 gap-y-1 select-none'>
          <span>REMAINING INK:</span>
          <span className='text-destructive font-mono font-bold tracking-wider sm:tracking-widest relative'>
            {quota?.remaining ?? '...'} / {quota?.limit ?? '...'} SKETCHES
            {/* Tooltip */}
            {quota && (
              <span className='absolute bottom-full mb-2 right-0 hidden group-hover/quota:block bg-background border-2 border-foreground p-2.5 text-[10px] text-foreground w-max max-w-[200px] sm:max-w-xs neo-shadow-sm z-30 normal-case font-medium font-mono text-left tracking-normal whitespace-normal'>
                {quota?.limit === 15
                  ? 'Authenticated limit: 15 sketches/day.'
                  : 'Guest limit: 5 sketches/day.'}
                <br />
                Quota resets daily.
              </span>
            )}
          </span>
        </span>
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={isSubmitDisabled}
        className='w-full font-display border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-none uppercase flex flex-col items-center justify-center gap-1 min-h-[76px] px-4 py-2 group'
      >
        <span className='flex items-center justify-center gap-2 text-lg md:text-xl'>
          <MagicEdit className='w-6 h-6' />
          {buttonText}
        </span>
        {mode === 'create' &&
          hasExistingImage &&
          !(isPageLoading || isGenerating) && (
            <span className='font-mono text-[9px] text-background/60 group-hover:text-foreground/60 tracking-wider lowercase normal-case select-none'>
              {user
                ? '(* starts a new sketch family in your sketchbook)'
                : '(* this will overwrite your last generated sketch)'}
            </span>
          )}
      </button>
    </form>
  );
}
