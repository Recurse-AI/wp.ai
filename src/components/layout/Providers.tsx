"use client";

import { ThemeProvider } from '@/context/ThemeProvider';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/context/AuthProvider';
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

const excludedPaths = [
  '/chat', 
  '/chat/*',
  '/agent-workspace',
  '/agent-workspace/*',
  '/signin', 
  '/signup',
  '/login',
  '/register',
  '/reset-password',
  '/forgot-password',
];

// Simple ToasterProvider component
function ToasterProvider() {
  return <Toaster position="top-right" />;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Get current path for conditional rendering
  const currentPath = usePathname();
  
  // Set main classes based on current path
  const mainClasses = currentPath === "/chat" || currentPath === "/agent-workspace" 
    ? "flex-1 relative" 
    : "flex-1";

  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <ToasterProvider />
          <div className="flex flex-col min-h-screen">
            <Header excludedPaths={excludedPaths} />
            <main className={`flex-grow ${mainClasses}`}>{children}</main>
            <Footer excludedPaths={excludedPaths}/>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}