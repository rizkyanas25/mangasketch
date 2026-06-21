'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { WarningDiamond, Close, Unlink } from 'pixelarticons/react';
import { LoginButton } from './LoginButton';

interface CanvasPanelErrorProps {
  error: string;
}

type ErrorVariant =
  | 'CONNECTION_SEVERED'
  | 'DATA_CORRUPTION'
  | 'INK_DEPLETED'
  | 'GENERIC';

function detectVariant(error: string): ErrorVariant {
  const lower = error.toLowerCase();
  if (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limited') ||
    lower.includes('depleted')
  ) {
    return 'INK_DEPLETED';
  }
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

function InkDepleted({ error }: { error: string }) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const animId = requestAnimationFrame(() => {
      setTimeLeft(calculateTimeLeft());
    });
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className='manga-speedlines relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full overflow-hidden bg-background'>
      {/* Screentone pattern overlay (10% opacity for comic newsprint vibe) */}
      <div className='absolute inset-0 bg-screentone pointer-events-none opacity-10' />

      <div className='relative z-10 flex flex-col items-center'>
        <WarningDiamond className='w-16 h-16 mb-4 text-[#D9383A]' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3 bg-foreground text-background px-3 py-1 neo-shadow-xs'>
          INK DEPLETED!
        </h2>
        <p className='font-sans text-sm text-foreground font-bold max-w-sm mb-2 uppercase'>
          Your daily ink quota is exhausted.
        </p>
        <p className='font-sans text-xs text-neutral max-w-xs mb-3 uppercase font-semibold'>
          {user 
            ? 'Wait for the ink supply to refill:' 
            : 'Sign in to get 15 daily sketches, or wait for the ink supply to refill:'}
        </p>
        {!user && (
          <div className='mb-4'>
            <LoginButton isOnHeader={false} />
          </div>
        )}
        <div className='font-mono text-lg font-bold bg-foreground text-background px-3 py-1.5 border-2 border-foreground neo-shadow-sm mb-4 tracking-wider select-none'>
          REFILL IN: {timeLeft || '00:00:00'}
        </div>
        <p className='font-mono text-[9px] text-[#D9383A]/70 uppercase mt-2 max-w-xs border border-[#D9383A]/30 px-2 py-1 bg-[#D9383A]/5'>
          {error}
        </p>
      </div>
    </div>
  );
}

function ConnectionSevered({ error }: { error: string }) {
  return (
    <div className='manga-speedlines manga-speedlines-dense relative flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px] w-full overflow-hidden'>
      <div className='relative z-10 flex flex-col items-center'>
        <Unlink className='w-16 h-16 mb-4 text-[#D9383A]' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          CONNECTION SEVERED!
        </h2>
        <p className='font-sans text-sm text-neutral max-w-sm mb-2'>
          The ink has dried up. The server is not responding. Attempting to
          re-establish the signal.
        </p>
        <p className='font-mono text-[9px] text-[#D9383A]/70 uppercase mt-4 max-w-xs border border-[#D9383A]/30 px-2 py-1 bg-[#D9383A]/5'>
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
        <Close className='w-16 h-16 mb-4 text-[#D9383A]' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          DATA CORRUPTION
        </h2>
        <div className='border border-background/30 px-4 py-2 mb-4 max-w-sm'>
          <p className='font-sans text-sm opacity-80'>
            Inconsistent panel generated. The drawing board is distorted.
          </p>
        </div>
        <p className='font-mono text-[9px] text-[#D9383A] uppercase mt-2 max-w-xs border border-[#D9383A]/30 px-2 py-1 bg-[#D9383A]/10'>
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
        <WarningDiamond className='w-16 h-16 mb-4 text-[#D9383A]' />
        <h2 className='font-display text-3xl md:text-4xl tracking-wide uppercase mb-3'>
          BLANK PAGE!
        </h2>
        <p className='font-sans text-sm text-neutral max-w-sm mb-2'>
          Every great manga starts with a prompt. Something went wrong with this
          one.
        </p>
        <p className='font-mono text-[9px] text-[#D9383A]/70 uppercase mt-4 max-w-xs border border-[#D9383A]/30 px-2 py-1 bg-[#D9383A]/5'>
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
    case 'INK_DEPLETED':
      return <InkDepleted error={error} />;
    default:
      return <GenericError error={error} />;
  }
}
