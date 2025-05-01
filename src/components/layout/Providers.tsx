"use client";

import { ThemeProvider } from '@/context/ThemeProvider';
import { SessionProvider } from 'next-auth/react';
import ToasterProvider from '@/components/ToasterProvider';
import Header from '@/components/layout/Header';
import AuthProvider from '@/context/AuthProvider';
import { useEffect, useState } from 'react';

const excludedPaths = [
  '/signin', 
  '/login', 
  '/signup', 
  '/register', 
  '/reset-password', 
  '/forgot-password', 
  '/chat',
  '/verify-email',
  '/verify-email/:uidb64',
  '/verify-email/:uidb64/:token',
  '/community',
  '/agent-workspace',
];

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (err) {
      console.error("Error during mounting:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl text-red-500 mb-4">Something went wrong</h1>
        <p className="text-sm mb-2">Please try refreshing the page</p>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-w-full">{error.message}</pre>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToasterProvider />
          <div className="flex flex-col min-h-screen">
            <Header excludedPaths={excludedPaths} />
            <main className="flex-1 relative">{children}</main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 