'use client';

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { GoogleIcon } from '@/components/GoogleIcon';

interface LoginButtonProps {
  isOnHeader?: boolean;
  disabled?: boolean;
}

export function LoginButton({
  isOnHeader = false,
  disabled = false,
}: LoginButtonProps) {
  const { login } = useAuth();

  return (
    <button
      type='button'
      onClick={() => login()}
      disabled={disabled}
      className={`font-display h-9 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 text-sm ${
        isOnHeader ? 'px-2 sm:px-4' : 'px-5'
      }`}
    >
      <GoogleIcon className='w-5 h-5 flex-shrink-0' />
      <span className={isOnHeader ? 'hidden sm:inline' : 'inline'}>SIGN IN</span>
    </button>
  );
}
