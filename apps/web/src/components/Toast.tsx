'use client';

import React from 'react';
import { useUiStore } from '@/store/uiStore';

export default function Toast() {
  const toast = useUiStore((state) => state.toast);
  const hideToast = useUiStore((state) => state.hideToast);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || toast.type === 'recovered';

  return (
    <div
      onClick={hideToast}
      className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-50 border-4 border-foreground bg-background p-4 neo-shadow-sm flex items-center gap-3 transition-all duration-300 ease-out transform cursor-pointer select-none max-w-[calc(100vw-3rem)] sm:max-w-md ${
        toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
      }`}
    >
      {isSuccess ? (
        <>
          <span className="font-mono text-lg font-bold">[✓]</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            {toast.message}
          </span>
        </>
      ) : (
        <>
          <span className="font-mono text-lg font-bold text-destructive">[✗]</span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-destructive">
            {toast.message}
          </span>
        </>
      )}
    </div>
  );
}
