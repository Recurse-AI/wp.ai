"use client";
import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeProvider"; 
import { usePathname } from "next/navigation"; 
import "./globals.css"; 
import Navbar from "@/components/Navbar";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion"; // ✅ Import Framer Motion

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname(); 

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    setIsAuthenticated(authToken ? true : false);
  }, []);

  const hideNavbarPages = ["/signin", "/signup", "/forgot-password", "/reset-password", "/otp-check", "/chat"];

  return (
    <html lang="en">
      <body className={twMerge(`${geistSans.variable} ${geistMono.variable} theme-transition overflow-x-hidden relative`)}>
        
        
        <ThemeProvider>
          <SessionProvider>
            {!hideNavbarPages.includes(pathname) && <Navbar />}
            {isAuthenticated === null ? (
              <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg font-semibold">Checking authentication...</p>
              </div>
            ) : (
              <div className="relative z-10">{children}</div>
            )}
            
            <Toaster position="bottom-right" reverseOrder={false} />
          </SessionProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
