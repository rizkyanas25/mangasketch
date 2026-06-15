'use client';

import {
  MangaStyle,
  DrawingStyle,
  WatermarkPosition,
  MANGA_STYLES,
  DRAWING_STYLES,
  WATERMARK_POSITIONS,
} from '@mangasketch/shared';

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

interface HankoStampProps {
  text?: string;
  className?: string;
  color?: string;
}

export function HankoStamp({
  text,
  className,
  color = '#D9383A',
}: HankoStampProps) {
  const cleanName = text ? text.trim().toUpperCase().substring(0, 4) : '';
  const hasText = cleanName.length > 0;
  const userFontSize = cleanName.length <= 2 ? '12px' : '10px';

  return (
    <svg
      viewBox='0 0 100 100'
      className={className}
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* 1. White Solid background circle */}
      <circle cx='50' cy='50' r='42' fill='#FFFFFF' />

      {/* 2. Outer Circle Border */}
      <circle
        cx='50'
        cy='50'
        r='42'
        fill='none'
        stroke={color}
        strokeWidth='4.5'
      />

      {hasText ? (
        <>
          {/* Right Column: マ ン ガ (vertically centered above banner) */}
          <text
            x='60'
            y='34'
            fill={color}
            fontFamily="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif"
            fontWeight='900'
            fontSize='16px'
            textAnchor='middle'
            letterSpacing='-0.5px'
          >
            マ
            <tspan x='60' dy='14'>
              ン
            </tspan>
            <tspan x='60' dy='14'>
              ガ
            </tspan>
          </text>

          {/* Left Column: ス ケ ッ チ (vertically centered above banner) */}
          <text
            x='40'
            y='31'
            fill={color}
            fontFamily="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif"
            fontWeight='900'
            fontSize='13px'
            textAnchor='middle'
            letterSpacing='-0.5px'
          >
            ス
            <tspan x='40' dy='12'>
              ケ
            </tspan>
            <tspan x='40' dy='10'>
              ッ
            </tspan>
            <tspan x='40' dy='12'>
              チ
            </tspan>
          </text>

          {/* Bottom Red Segment Banner */}
          <path d='M 14.2 72 A 42 42 0 0 0 85.8 72 Z' fill={color} />

          {/* User initials/short name */}
          <text
            x='50'
            y='86'
            fill='#FFFFFF'
            fontFamily="'Impact', 'Arial Black', sans-serif"
            fontSize={userFontSize}
            fontWeight='bold'
            letterSpacing='0.5'
            textAnchor='middle'
          >
            {cleanName}
          </text>
        </>
      ) : (
        <>
          {/* Right Column: マ ン ガ (vertically centered in circle) */}
          <text
            x='60'
            y='40'
            fill={color}
            fontFamily="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif"
            fontWeight='900'
            fontSize='17px'
            textAnchor='middle'
            letterSpacing='-0.5px'
          >
            マ
            <tspan x='60' dy='16'>
              ン
            </tspan>
            <tspan x='60' dy='16'>
              ガ
            </tspan>
          </text>

          {/* Left Column: ス ケ ッ チ (vertically centered in circle) */}
          <text
            x='40'
            y='36'
            fill={color}
            fontFamily="'Noto Sans JP', 'Helvetica Neue', 'Arial Black', sans-serif"
            fontWeight='900'
            fontSize='15px'
            textAnchor='middle'
            letterSpacing='-0.5px'
          >
            ス
            <tspan x='40' dy='14'>
              ケ
            </tspan>
            <tspan x='40' dy='11'>
              ッ
            </tspan>
            <tspan x='40' dy='14'>
              チ
            </tspan>
          </text>
        </>
      )}
    </svg>
  );
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
    <div className='flex flex-col gap-6'>
      {/* 1. Manga Style Dimension */}
      <div className='flex flex-col gap-2'>
        <label className='font-mono text-xs font-bold uppercase tracking-wider'>
          MANGA STYLE
        </label>
        <div className='flex flex-wrap gap-2'>
          {MANGA_STYLES.map((style) => (
            <button
              type='button'
              key={style}
              disabled={disabled}
              onClick={() => setMangaStyle(style)}
              className={`font-mono text-xs font-bold px-3 py-1.5 border-2 border-foreground uppercase rounded-none transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                mangaStyle === style
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground ' +
                    (disabled ? '' : 'hover:bg-screentone')
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Drawing Style Dimension (2 rows, 2 options each row) */}
      <div className='flex flex-col gap-2'>
        <label className='font-mono text-xs font-bold uppercase tracking-wider'>
          DRAWING STYLE
        </label>
        <div className='grid grid-cols-2 gap-2'>
          {DRAWING_STYLES.map((style) => (
            <button
              type='button'
              key={style}
              disabled={disabled}
              onClick={() => setDrawingStyle(style)}
              className={`font-mono text-xs font-bold px-3 py-2 border-2 border-foreground uppercase text-center rounded-none transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                drawingStyle === style
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground ' +
                    (disabled ? '' : 'hover:bg-screentone')
              }`}
            >
              {style.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Hanko Watermark Options */}
      <div className='border-2 border-foreground p-4 bg-background'>
        <div className='flex justify-between h-auto'>
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
                <HankoStamp text={watermarkText} className='w-20 h-20' />
              </div>
            </div>
          </div>

          {/* Right Column: Stamp Placement 2x2 Grid with 3:4 Aspect Ratio */}
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
                        className={`w-4 h-4 absolute transition-all ${stampPosition} ${
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
