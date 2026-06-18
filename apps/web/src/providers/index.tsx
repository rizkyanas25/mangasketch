'use client';

import React from 'react';
import QueryProvider from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import Toast from '@/components/Toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toast />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
