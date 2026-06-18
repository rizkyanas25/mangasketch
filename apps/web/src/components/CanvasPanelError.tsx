'use client';

import { WarningDiamond, Close, Unlink } from 'pixelarticons/react';

interface CanvasPanelErrorProps {
  error: string;
}

type ErrorVariant = 'CONNECTION_SEVERED' | 'DATA_CORRUPTION' | 'GENERIC';

function detectVariant(error: string): ErrorVariant {
  const lower = error.toLowerCase();
  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('not responding') ||
    lower.includes('network') ||
    lower.includes('connect') ||
    lower.includes('fetch')
  ) {
    return 'CONNECTION_SEVERED';
  }
  if (
    lower.includes('corrupt') ||
    lower.includes('distort') ||
    lower.includes('unexpected') ||
    lower.includes('provider') ||
    lower.includes('malform') ||
    lower.includes('broken')
  ) {
    return 'DATA_CORRUPTION';
  }
  return 'GENERIC';
}

function ConnectionSevered({ error }: { error: string }) {
  return (
    <div className='manga-speedlines manga-speedlines-dense relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center'>
        <Unlink className='w-16 h-16 mb-4 text-foreground opacity-60' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          CONNECTION SEVERED!
        </h2>
        <p className='font-sans text-sm text-neutral max-w-sm mb-2'>
          The ink has dried up. The server is not responding. Attempting to
          re-establish the signal.
        </p>
        <p className='font-mono text-[10px] text-neutral/60 uppercase mt-2 max-w-xs'>
          {error}
        </p>
      </div>
    </div>
  );
}

function DataCorruption({ error }: { error: string }) {
  return (
    <div className='relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full bg-foreground text-background overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center'>
        <Close className='w-16 h-16 mb-4 opacity-80' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          DATA CORRUPTION
        </h2>
        <div className='border border-background/30 px-4 py-2 mb-4 max-w-sm'>
          <p className='font-sans text-sm opacity-80'>
            Inconsistent panel generated. The drawing board is distorted.
          </p>
        </div>
        <p className='font-mono text-[10px] opacity-50 uppercase max-w-xs'>
          {error}
        </p>
      </div>
    </div>
  );
}

function GenericError({ error }: { error: string }) {
  return (
    <div className='manga-speedlines relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center'>
        <WarningDiamond className='w-16 h-16 mb-4 text-foreground opacity-60' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          BLANK PAGE!
        </h2>
        <p className='font-sans text-sm text-neutral max-w-sm mb-2'>
          Every great manga starts with a prompt. Something went wrong with this
          one.
        </p>
        <p className='font-mono text-[10px] text-neutral/60 uppercase mt-2 max-w-xs'>
          {error}
        </p>
      </div>
    </div>
  );
}

export default function CanvasPanelError({ error }: CanvasPanelErrorProps) {
  const variant = detectVariant(error);

  switch (variant) {
    case 'CONNECTION_SEVERED':
      return <ConnectionSevered error={error} />;
    case 'DATA_CORRUPTION':
      return <DataCorruption error={error} />;
    default:
      return <GenericError error={error} />;
  }
}
