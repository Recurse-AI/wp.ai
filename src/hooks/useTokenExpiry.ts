"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useTokenExpiry() {
  const router = useRouter();
  const pathname = usePathname();

  const checkTokenExpiry = () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    
    if (token && tokenExpiry) {
      const expiryTime = new Date(tokenExpiry).getTime();
      const currentTime = new Date().getTime();
      
      if (currentTime > expiryTime) {
        // Token has expired, clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        localStorage.removeItem("userData");
        
        // Redirect to home if on a protected route
        if (pathname !== "/" && !pathname.startsWith("/signin") && !pathname.startsWith("/signup")) {
          router.push("/");
        }
        return false;
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Check token expiry on route changes
    checkTokenExpiry();
  }, [pathname]);

  return { checkTokenExpiry };
} 