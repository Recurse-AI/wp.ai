"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
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
    <>
      <div className="z-[100]">{shouldShowNavbar && <Navbar />}</div>
      <div className="z-0">{children}</div>
    </>
  );
} 