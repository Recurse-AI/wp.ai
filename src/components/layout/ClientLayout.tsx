"use client";

import { ThemeProvider } from '@/context/ThemeProvider';
import { ActiveSessionProvider } from '@/context/ActiveSessionContext';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/layout/Header';
import ToasterProvider from '@/components/ToasterProvider'; 
import { StreamingProvider } from '@/context/MessageStateContext';
import { useSyntaxHighlighting } from '@/lib/init';
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
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useSyntaxHighlighting();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  return (
    <SessionProvider>
      <ThemeProvider>
        <StreamingProvider>
          <ActiveSessionProvider>
            <AuthProvider>
              <ToasterProvider />
              <div className="flex flex-col min-h-screen">
                <Header 
                  excludedPaths={excludedPaths}
                />
                <main className="flex-1 relative">{children}</main>
              </div>
            </AuthProvider>
          </ActiveSessionProvider>
        </StreamingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 