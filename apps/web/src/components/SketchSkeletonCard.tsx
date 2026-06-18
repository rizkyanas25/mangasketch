import React from 'react';

interface SketchSkeletonCardProps {
  variant?: 'gallery' | 'timeline';
}

export default function SketchSkeletonCard({ variant = 'gallery' }: SketchSkeletonCardProps) {
  if (variant === 'timeline') {
    return (
      <div className='w-28 md:w-32 flex-shrink-0 border-2 border-foreground bg-background rounded-none neo-shadow-sm flex flex-col animate-pulse'>
        {/* Image Section Skeleton */}
        <div className='aspect-[3/4] border-b-2 border-foreground bg-screentone-dense' />
        
        {/* Info Section Skeleton (matches actual vertical layout) */}
        <div className='p-2 flex flex-col gap-0.5 bg-background justify-between flex-1 w-full border-t border-foreground/10'>
          {/* Version label */}
          <div className='h-2.5 w-8 bg-foreground/10 rounded-sm' />
          {/* Manga Style */}
          <div className='h-2.5 w-12 bg-foreground/10 rounded-sm mt-0.5' />
          {/* Drawing Style */}
          <div className='h-2.5 w-16 bg-foreground/10 rounded-sm' />
          {/* Created date/time */}
          <div className='h-2 w-14 bg-foreground/10 rounded-sm mt-1' />
        </div>
      </div>
    );
  }

  return (
    <div className='border-4 border-foreground bg-background rounded-none neo-shadow-sm flex flex-col'>
      {/* Image Section Skeleton */}
      <div className='aspect-[3/4] border-b-4 border-foreground bg-screentone-dense animate-pulse relative' />
      
      {/* Details Section Skeleton */}
      <div className='p-4 flex flex-col gap-2 bg-background flex-1 justify-between'>
        <div className='flex flex-col gap-1'>
          {/* Metadata Placeholder (Height aligned to 14px / h-3.5) */}
          <div className='flex items-center justify-between animate-pulse'>
            <div className='h-3.5 w-24 bg-foreground/10 rounded-sm' />
            <div className='h-3.5 w-16 bg-foreground/10 rounded-sm' />
          </div>
          
          {/* Prompt Placeholder (Aligned to min-h-[2.5rem] mt-1) */}
          <div className='min-h-[2.5rem] mt-1 flex flex-col justify-center gap-1.5 animate-pulse'>
            <div className='h-3 w-full bg-foreground/10 rounded-sm' />
            <div className='h-3 w-3/4 bg-foreground/10 rounded-sm' />
          </div>
        </div>

        {/* Action Row Placeholder (Borders & sizing aligned with Details + Trash) */}
        <div className='flex items-center justify-between mt-3 pt-3 border-t-2 border-foreground/10 select-none animate-pulse'>
          {/* Details Link Placeholder (Height aligned to 16px / h-4) */}
          <div className='h-4 w-16 bg-foreground/10 rounded-sm' />
          {/* Trash Button Placeholder (Height aligned to 24px / h-6) */}
          <div className='h-6 w-6 bg-foreground/10 rounded-sm' />
        </div>
      </div>
    </div>
  );
}
