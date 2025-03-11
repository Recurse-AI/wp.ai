"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "react-hot-toast";
import ClientWrapper from "@/components/ClientWrapper";
import { useState, useEffect } from "react";

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a simple loading state while mounting
  // if (!mounted) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-pulse flex flex-col items-center space-y-4">
  //         <div className="w-12 h-12 bg-blue-400/20 rounded-full"></div>
  //         <div className="h-4 w-24 bg-blue-400/20 rounded"></div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <ThemeProvider>
      <SessionProvider>
        <AuthProvider>
          <ClientWrapper>{children}</ClientWrapper>
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
} 