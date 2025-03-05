"use client";

import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeProvider";
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
  const pathname = usePathname();

  // ✅ Hide Navbar for specific pages EXCEPT if the path starts with "/chat/"
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={twMerge(
          `${geistSans.variable} ${geistMono.variable} theme-transition overflow-x-hidden relative w-full`
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SessionProvider>
            {/* Remove relative positioning and width from this div */}
            <div className="z-[100]">{shouldShowNavbar && <Navbar />}</div>

            {/* Remove relative positioning and width from this div */}
            <div className="z-0">{children}</div>

            <Toaster position="bottom-right" reverseOrder={false} />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
