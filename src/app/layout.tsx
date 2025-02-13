"use client"; // ✅ Mark as a Client Component

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeProvider"; // ✅ Import ThemeProvider
import "./globals.css";
import Navbar from "@/components/Navbar";

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

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setIsAuthenticated(false);
        return;
      }
      else{
        setIsAuthenticated(true);
      }
      // try {
      //   const response = await fetch("/check", {
      //     method: "GET",
      //     headers: {
      //       Authorization: `Bearer ${authToken}`,
      //     },
      // //   });
      //   const data = await response.json();
      //   if(data.success === false) localStorage.removeItem("authToken");
      //   setIsAuthenticated(data.success);
      // } catch (error) {
      //   console.error("Error checking authentication:", error);
      //   setIsAuthenticated(false);
      // }
    };
    checkAuth();
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased theme-transition`}>
        <ThemeProvider> {/* ✅ Dark Mode System */}
          <SessionProvider>
            <Navbar />
            {isAuthenticated === null ? (
              <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg font-semibold">Checking authentication...</p>
              </div>
            ) :
              <>{children}</>}
            <Toaster position="bottom-right" reverseOrder={false} />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
