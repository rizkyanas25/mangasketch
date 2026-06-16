'use client';

import React from 'react';

export interface HankoStampProps {
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
