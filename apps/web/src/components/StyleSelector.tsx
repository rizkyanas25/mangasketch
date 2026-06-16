'use client';

import {
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
  MANGA_STYLES,
  DRAWING_STYLES,
  WATERMARK_POSITIONS,
} from '@mangasketch/shared';
import { HankoStamp } from './HankoStamp';

const MANGA_STYLE_IMAGES: Record<MangaStyle, string> = {
  SHONEN: '/assets/styles/pill-shonen.png',
  SEINEN: '/assets/styles/pill-seinen.png',
  SHOJO: '/assets/styles/pill-shojo.png',
  CHIBI: '/assets/styles/pill-chibi.png',
};

const DRAWING_STYLE_IMAGES: Record<DrawingStyle, string> = {
  ROUGH_SKETCH: '/assets/styles/pill-rough.png',
  CLEAN_LINE_ART: '/assets/styles/pill-clean.png',
  INKED_MANGA: '/assets/styles/pill-inked.png',
  DETAILED_ILLUSTRATION: '/assets/styles/pill-detailed.png',
};

interface StyleSelectorProps {
  mangaStyle: MangaStyle;
  setMangaStyle: (style: MangaStyle) => void;
  drawingStyle: DrawingStyle;
  setDrawingStyle: (style: DrawingStyle) => void;
  watermarkText: string;
  setWatermarkText: (text: string) => void;
  watermarkPosition: WatermarkPosition;
  setWatermarkPosition: (pos: WatermarkPosition) => void;
  disabled?: boolean;
}


export default function StyleSelector({
  mangaStyle,
  setMangaStyle,
  drawingStyle,
  setDrawingStyle,
  watermarkText,
  setWatermarkText,
  watermarkPosition,
  setWatermarkPosition,
  disabled = false,
}: StyleSelectorProps) {
  const handleWatermarkTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (val.length <= 4) {
      setWatermarkText(val);
    }
  };

  return (
    <div className='flex flex-col gap-4 flex-1'>
      {/* Left: Manga Style + Drawing Style (stacked) */}
      <div className='flex flex-col gap-4 flex-1'>
        {/* 1. Manga Style Dimension */}
        <div className='flex flex-col gap-2'>
          <label className='font-mono text-xs font-bold uppercase tracking-wider'>
            MANGA STYLE
          </label>
          <div className='grid grid-cols-2 gap-2 flex-1'>
            {MANGA_STYLES.map((style) => {
              const isSelected = mangaStyle === style;
              return (
                <button
                  type='button'
                  key={style}
                  disabled={disabled}
                  onClick={() => setMangaStyle(style)}
                  className={`relative overflow-hidden font-mono text-xs font-bold px-3 py-5 border-2 border-foreground uppercase text-left rounded-none transition-all ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground ' +
                        (disabled ? '' : 'hover:bg-screentone')
                  }`}
                >
                  <span className='relative z-10'>{style}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={MANGA_STYLE_IMAGES[style]}
                    alt=''
                    aria-hidden='true'
                    className={`absolute right-[-4px] bottom-[-4px] w-[70px] h-[70px] object-contain pointer-events-none z-0 pill-watermark ${
                      isSelected ? 'pill-watermark-selected' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Drawing Style Dimension (2 rows, 2 options each row) */}
        <div className='flex flex-col gap-2'>
          <label className='font-mono text-xs font-bold uppercase tracking-wider'>
            DRAWING STYLE
          </label>
          <div className='grid grid-cols-2 gap-2 flex-1'>
            {DRAWING_STYLES.map((style) => {
              const isSelected = drawingStyle === style;
              return (
                <button
                  type='button'
                  key={style}
                  disabled={disabled}
                  onClick={() => setDrawingStyle(style)}
                  className={`relative overflow-hidden font-mono text-xs font-bold px-3 py-5 border-2 border-foreground uppercase text-left rounded-none transition-all ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'bg-background text-foreground ' +
                        (disabled ? '' : 'hover:bg-screentone')
                  }`}
                >
                  <span className='relative z-10'>{style.replace(/_/g, ' ')}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={DRAWING_STYLE_IMAGES[style]}
                    alt=''
                    aria-hidden='true'
                    className={`absolute right-[-4px] bottom-[-4px] w-[70px] h-[70px] object-contain pointer-events-none z-0 pill-watermark ${
                      isSelected ? 'pill-watermark-selected' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Hanko Watermark Section */}
      <div className='border-2 border-foreground p-4 bg-background flex-1'>
        <div className='flex justify-between h-full'>
          {/* Left Column: Stamp Initials (Top) + Live Preview (Bottom) */}
          <div className='flex flex-col gap-3'>
            {/* Stamp Initials */}
            <div className='flex flex-col gap-1.5'>
              <label className='font-mono text-[10px] font-bold uppercase tracking-wider'>
                SIGNATURE STAMP
              </label>
              <input
                type='text'
                value={watermarkText}
                onChange={handleWatermarkTextChange}
                disabled={disabled}
                placeholder='Your initial'
                className={`p-2 h-10 border-2 border-foreground bg-background text-foreground font-display text-xs tracking-wider uppercase focus:outline-none focus:ring-1 focus:ring-foreground rounded-none w-full ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Live Preview */}
            <div className='flex flex-col gap-1.5 w-fit'>
              <label className='font-mono text-[10px] font-bold uppercase tracking-wider text-neutral'>
                PREVIEW
              </label>
              <div className='border-2 border-foreground border-dashed p-2 bg-neutral-light/5 flex items-center justify-center'>
                <HankoStamp text={watermarkText} className='w-24 h-24' />
              </div>
            </div>
          </div>

          {/* Right Column: Stamp Placement 2x2 Grid — height matches left column, keeps 3:4 ratio */}
          <div className='flex flex-col gap-1.5 items-end self-stretch'>
            <label className='font-mono text-[10px] font-bold uppercase tracking-wider text-left'>
              POSITION
            </label>
            <div className='grid grid-cols-2 gap-1 border-2 border-foreground p-1 bg-neutral-light/5 flex-1 aspect-[3/4] w-auto'>
              {WATERMARK_POSITIONS.map((pos) => {
                const isActive = watermarkPosition === pos;

                // Determine corner border and stamp positions
                let borderClasses = '';
                let stampPosition = '';

                switch (pos) {
                  case 'TOP_LEFT':
                    borderClasses =
                      'border-t-2 border-l-2 border-r-transparent border-b-transparent';
                    stampPosition = 'top-1 left-1';
                    break;
                  case 'TOP_RIGHT':
                    borderClasses =
                      'border-t-2 border-r-2 border-l-transparent border-b-transparent';
                    stampPosition = 'top-1 right-1';
                    break;
                  case 'BOTTOM_LEFT':
                    borderClasses =
                      'border-b-2 border-l-2 border-r-transparent border-t-transparent';
                    stampPosition = 'bottom-1 left-1';
                    break;
                  case 'BOTTOM_RIGHT':
                    borderClasses =
                      'border-b-2 border-r-2 border-l-transparent border-t-transparent';
                    stampPosition = 'bottom-1 right-1';
                    break;
                }

                return (
                  <button
                    type='button'
                    key={pos}
                    disabled={disabled}
                    onClick={() => setWatermarkPosition(pos)}
                    title={`Place stamp at ${pos.replace('_', ' ')}`}
                    className={`w-full h-full relative p-0.5 focus:outline-none transition-all ${
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer group'
                    } ${
                      isActive
                        ? ''
                        : 'bg-transparent ' +
                          (disabled ? '' : 'hover:bg-neutral-light/10')
                    }`}
                  >
                    <div
                      className={`w-full h-full relative transition-all ${borderClasses} ${
                        isActive
                          ? 'border-red-500'
                          : 'border-foreground/30 ' +
                            (disabled ? '' : 'group-hover:border-foreground/60')
                      }`}
                    >
                      <HankoStamp
                        text={watermarkText}
                        className={`w-5 h-5 absolute transition-all ${stampPosition} ${
                          isActive
                            ? 'scale-100 opacity-100'
                            : 'scale-75 opacity-0 ' +
                              (disabled ? '' : 'group-hover:opacity-40')
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
