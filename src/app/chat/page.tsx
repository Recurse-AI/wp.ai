"use client"
import React, { useState, useEffect } from "react";
import ChatInput from "@/components/chat-comp/chatInput"
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthProvider";
import useAuth from "@/lib/useAuth";
import TokenManager from "@/lib/tokenManager";

const Page = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isLoggedIn } = useAuthContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // More comprehensive auth check
    const checkAuth = async () => {
      // Get all authentication indicators
      const hasToken = !!TokenManager.getToken();
      const hasRefreshToken = !!TokenManager.getRefreshToken();
      const hasUserData = !!localStorage.getItem('userData');
      const hasAuthToken = !!localStorage.getItem('token');

      console.log("Chat page auth check:", { 
        isAuthenticated, 
        isLoggedIn, 
        user,
        authLoading,
        hasToken,
        hasRefreshToken,
        hasUserData,
        hasAuthToken
      });

      // CRITICAL FIX: Only wait if still loading auth state
      if (authLoading) {
        console.log("Chat page: Still loading auth state, waiting...");
        return; // Still loading auth state, wait for it to resolve
      }

      // If authenticated by any method, allow access
      if (isAuthenticated || isLoggedIn || hasToken || hasRefreshToken || hasUserData || hasAuthToken) {
        console.log("Chat page: Authentication confirmed, allowing access");
        setLoading(false); // Set loading to false to show the chat interface
      } else {
        // If all auth methods fail, redirect to signin
        console.log("Chat page: No valid authentication found, redirecting to signin");
        localStorage.setItem('isChat', 'true');
        router.push('/signin');
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoggedIn, authLoading, user, router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-2 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 w-full">
        <h2 className="text-xl md:text-3xl font-semibold">
          How can I help you?
        </h2>
      </div>
      <ChatInput id={""} setMessages={() => {}} fetchMessages={() => {}} /> 
    </div>
  );
};

export default Page;
