"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/context/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

function ClientContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Hide Navbar for specific pages
  const hideNavbarPages = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/otp-check",
  ];
  
  const shouldShowNavbar =
    !hideNavbarPages.includes(pathname) &&
    !pathname.startsWith("/chat/") &&
    !pathname.startsWith("/verify-email");

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('color-scheme', 'dark');
      document.documentElement.style.setProperty('background-color', '#0A0F1C');
      document.body.style.setProperty('background-color', '#0A0F1C');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.setProperty('color-scheme', 'light');
      document.documentElement.style.setProperty('background-color', '#F8FAFC');
      document.body.style.setProperty('background-color', '#F8FAFC');
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {shouldShowNavbar && (
        <div className="z-[100]">
          <Navbar />
        </div>
      )}
      <div className="z-0">{children}</div>
      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AuthProvider>
          <ClientContent>{children}</ClientContent>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
} 