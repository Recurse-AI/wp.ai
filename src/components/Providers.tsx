"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isClient) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SessionProvider>
        <AuthProvider>
          {shouldShowNavbar && (
            <div className="z-[100]">
              <Navbar />
            </div>
          )}
          <div className="z-0">{children}</div>
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
} 