"use client"; // ✅ Mark as a Client Component

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeProvider"; // ✅ Import ThemeProvider
import "./globals.css";
import Navbar from "@/components/Navbar";
// import { metadata } from "./metadata";


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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased theme-transition`}>
        <ThemeProvider> {/* ✅ Dark Mode System */}
          <SessionProvider>
            <Navbar />
            {children}
            <Toaster position="bottom-right" reverseOrder={false} />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
