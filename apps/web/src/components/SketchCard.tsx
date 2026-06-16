import React from 'react';
import Link from 'next/link';
import { Sketch } from '@mangasketch/shared';
import { ArrowRight, Trash } from 'pixelarticons/react';
import { formatDate } from '@/lib/utils';

interface SketchCardProps {
  rootId: string;
  sketches: Sketch[];
  latest: Sketch;
  onSelect: (id: string) => void;
  onDeleteClick: (latest: Sketch) => void;
}

export default function SketchCard({
  rootId,
  sketches,
  latest,
  onSelect,
  onDeleteClick,
}: SketchCardProps) {
  return (
    <div
      onClick={() => onSelect(latest.id)}
      className='border-4 border-foreground bg-background rounded-none neo-shadow-sm hover:-translate-x-1 hover:-translate-y-1 hover:neo-shadow cursor-pointer transition-all flex flex-col group/card'
    >
      {/* Image Section */}
      <div className='aspect-[3/4] border-b-4 border-foreground overflow-hidden relative bg-screentone-dense'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={latest.image_url}
          alt={latest.prompt}
          className='w-full h-full object-cover transition-transform duration-350 group-hover/card:scale-102'
        />
        {/* Version Count Badge */}
        <div className='absolute top-3 right-3 font-mono text-[10px] font-bold border-2 border-foreground bg-background text-foreground px-2 py-1 select-none'>
          [ {sketches.length} {sketches.length === 1 ? 'VERSION' : 'VERSIONS'} ]
        </div>
      </div>

      {/* Details Section */}
      <div className='p-4 flex flex-col gap-2 bg-background text-foreground flex-1 justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between text-[10px] font-mono font-bold text-neutral'>
            <span>{`${latest.manga_style} • ${latest.drawing_style.replace(/_/g, ' ')}`}</span>
            <span>{formatDate(latest.created_at)}</span>
          </div>
          <p className='font-sans text-xs line-clamp-2 uppercase font-medium min-h-[2.5rem] mt-1 text-foreground leading-relaxed'>
            {latest.prompt}
          </p>
        </div>

        <div className='flex items-center justify-between mt-3 pt-3 border-t-2 border-foreground/10'>
          <Link
            href={`/sketches/${latest.id}`}
            onClick={(e) => e.stopPropagation()}
            className='font-mono text-[11px] font-bold flex items-center gap-1 hover:underline group/link'
          >
            DETAILS
            <ArrowRight className='w-4 h-4 transition-transform group-hover/link:translate-x-1' />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDeleteClick(latest);
            }}
            className='p-1 text-neutral hover:text-destructive hover:scale-120 cursor-pointer transition-all duration-150 flex items-center justify-center'
            title='Delete sketch family'
          >
            <Trash className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
