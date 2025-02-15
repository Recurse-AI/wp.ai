"use client"; // ✅ Mark as a Client Component

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeProvider"; // ✅ Import ThemeProvider
import { usePathname } from "next/navigation"; // ✅ Import usePathname
import "./globals.css";
import Navbar from "@/components/Navbar";
import { twMerge } from "tailwind-merge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname(); // ✅ Get the current page route

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setIsAuthenticated(false);
        return;
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  // ✅ Pages that should NOT show the Navbar
  const hideNavbarPages = ["/signin", "/signup", "/forgot-password", "/reset-password", "/otp-check", "/chat"];

  return (
    <html lang="en">
      <body className={twMerge(`${geistSans.variable} ${geistMono.variable} theme-transition overflow-x-hidden`)}>
        <ThemeProvider> {/* ✅ Dark Mode System */}
          <SessionProvider>
            {/* ✅ Show Navbar only if the page is NOT in the hideNavbarPages list */}
            {!hideNavbarPages.includes(pathname) && <Navbar />}
            
            {isAuthenticated === null ? (
              <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg font-semibold">Checking authentication...</p>
              </div>
            ) : (
              <>{children}</>
            )}
            
            <Toaster position="bottom-right" reverseOrder={false} />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
