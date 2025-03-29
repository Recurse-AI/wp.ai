"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ActiveSessionProvider } from '@/context/ActiveSessionContext';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/layout/Header';
import ToasterProvider from '@/components/ToasterProvider'; 
import { useSyntaxHighlighting } from '@/lib/init';
import AuthProvider from '@/context/AuthProvider';
const inter = Inter({ subsets: ['latin'] });

// Combined array for all paths that need special handling
const hideNavbarPaths = [
  '/signin', 
  '/login', 
  '/signup', 
  '/register', 
  '/reset-password', 
  '/forgot-password',
  '/otp-check',
  '/chat',
  '/verify-email',
  '/verify-email/:uidb64',
  '/verify-email/:uidb64/:token',
];

// Client component wrapper to use React hooks
function RootLayoutClient({ children }: { children: React.ReactNode }) {
  useSyntaxHighlighting();

  return (
    <ThemeProvider>
       <SessionProvider>
          <ActiveSessionProvider>
            <AuthProvider>
                <ToasterProvider />
                <div className="flex flex-col min-h-screen">
                    <Header 
                      excludedPaths={hideNavbarPaths}
                    />
                  <main className="flex-1 relative">{children}</main>
                </div>
            </AuthProvider>
          </ActiveSessionProvider>
      </SessionProvider>
    </ThemeProvider>
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
