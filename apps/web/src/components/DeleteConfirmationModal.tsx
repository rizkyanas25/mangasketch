'use client';

import React from 'react';
import { WarningDiamond } from 'pixelarticons/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  badgeText: string;
  imageUrl: string;
  mangaStyle: string;
  drawingStyle: string;
  prompt: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  error,
  title,
  description,
  confirmText,
  cancelText = 'KEEP SKETCH',
  badgeText,
  imageUrl,
  mangaStyle,
  drawingStyle,
  prompt,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 select-none'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-background/80 backdrop-blur-sm'
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal Box */}
      <div className='bg-background border-4 border-foreground p-6 max-w-md w-full relative z-10 neo-shadow-lg text-center flex flex-col items-center rounded-none'>
        <div className='text-destructive mb-4'>
          <WarningDiamond className='w-12 h-12' />
        </div>

        <h3 className='font-display text-2xl text-destructive uppercase tracking-wide mb-3'>
          {title}
        </h3>

        <p className='font-sans text-sm text-neutral mb-6 uppercase font-medium leading-relaxed max-w-md'>
          {description}
        </p>

        {/* Centered Horizontal Mini-Card Preview */}
        <div className='w-full border-2 border-foreground bg-background p-3 mb-6 flex gap-3 text-left relative overflow-hidden'>
          {/* Left Column: Portrait Image */}
          <div className='w-20 md:w-24 aspect-[3/4] border-2 border-foreground flex-shrink-0 relative overflow-hidden bg-screentone-dense'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt='Preview'
              className='w-full h-full object-cover select-none'
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>

          {/* Right Column: Prompt + Metadata */}
          <div className='flex-1 flex flex-col justify-between overflow-hidden'>
            <div className='flex flex-col gap-1'>
              <div className='font-mono text-[9px] font-bold text-neutral uppercase'>
                {mangaStyle} • {drawingStyle.replace(/_/g, ' ')}
              </div>
              <p className='font-sans text-[11px] font-medium text-foreground line-clamp-3 uppercase leading-normal mt-0.5'>
                {prompt}
              </p>
            </div>

            {/* Badge Indicator */}
            <div className='mt-2 w-fit font-mono text-[8px] font-bold border border-foreground bg-foreground text-background px-1.5 py-0.5 select-none uppercase'>
              {badgeText}
            </div>
          </div>
        </div>

        {/* Inline Error Alert */}
        {error && (
          <div className='w-full border-2 border-destructive bg-destructive/10 p-3 mb-6 text-left'>
            <span className='font-mono text-xs font-bold text-destructive'>
              [!] FAILURE: {error}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className='flex flex-col sm:flex-row gap-3 w-full'>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 font-display py-3 border-2 border-destructive bg-destructive text-white hover:bg-background hover:text-destructive active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer'
          >
            {isDeleting ? 'ERASING' : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className='flex-1 font-display py-3 border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer'
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
