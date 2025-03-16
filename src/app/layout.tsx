"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ActiveSessionProvider } from '@/context/ActiveSessionContext';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/layout/Header';
import ToasterProvider from '@/components/ToasterProvider'; 
import { StreamingProvider } from '@/context/MessageStateContext';
import { useSyntaxHighlighting } from '@/lib/init';
import AuthProvider from '@/context/AuthProvider';
const inter = Inter({ subsets: ['latin'] });

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

// Client component wrapper to use React hooks
function RootLayoutClient({ children }: { children: React.ReactNode }) {
  // Initialize syntax highlighting on client only
  useSyntaxHighlighting();
  
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}