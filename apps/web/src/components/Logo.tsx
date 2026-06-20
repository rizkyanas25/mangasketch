'use client';

import React from 'react';

export interface LogoProps {
  className?: string;
  color?: string; // Hanko stamp color, default #D9383A
  textColor?: string; // Text color, default currentColor
}

export function Logo({
  className,
  color = '#D9383A',
  textColor = 'currentColor',
}: LogoProps) {
  return (
    <svg
      viewBox='0 -10 198 40'
      className={className}
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Hanko Stamp nested at the top-right of the text, overlapping the CH slightly */}
      {/* Positioned at x=158 (overlaps CH by 12px), y=-10 (extends 10px above text top) */}
      <svg x='158' y='-10' width='40' height='40' viewBox='0 0 100 100'>
        {/* 1. Theme-aware Solid background circle */}
        <circle cx='50' cy='50' r='42' fill='var(--background)' />

        {/* 2. Outer Circle Border */}
        <circle
          cx='50'
          cy='50'
          r='42'
          fill='none'
          stroke={color}
          strokeWidth='4.5'
        />

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
      </svg>
      {/* Brand Text MANGASKETCH */}
      <text
        x='0'
        y='30'
        fill={textColor}
        fontFamily="var(--font-display), 'Anton', 'Impact', 'Arial Black', sans-serif"
        fontSize='30px'
        letterSpacing='2px'
        textLength='170'
        lengthAdjust='spacing'
      >
        MANGASKETCH
      </text>
    </svg>
  );
}
