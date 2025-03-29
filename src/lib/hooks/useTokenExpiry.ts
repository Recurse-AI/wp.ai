"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import TokenManager from "../tokenManager";

export function useTokenExpiry() {
  const router = useRouter();
  const pathname = usePathname();

  const checkTokenExpiry = () => {
    // Use TokenManager to check if the user is authenticated
    const isAuthenticated = TokenManager.isAuthenticated();
    
    if (!isAuthenticated) {
      // If user is not authenticated, clear tokens and redirect if on protected route
      TokenManager.clearTokens();
      
      // Redirect to home if on a protected route
      if (pathname !== "/" && !pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
        router.push("/signin?reason=session_expired");
      }
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // Check token expiry on route changes
    checkTokenExpiry();
  }, [pathname]);

  return { checkTokenExpiry };
} 