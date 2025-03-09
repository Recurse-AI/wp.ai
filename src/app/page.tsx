"use client";

import React, { useState, Suspense } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import useAuth from "@/lib/useAuth";
import dynamic from "next/dynamic";

// Import HeroSection directly as it's critical for initial render
import { HeroSection } from "@/components/landing-page";

// Lazy load all other components
const ParticlesBackground = dynamic(
  () => import("@/components/landing-page/ParticlesBackground"),
  { ssr: false, loading: () => null }
);

const VideoSection = dynamic(
  () => import("@/components/landing-page/VideoSection"),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const FeaturesSection = dynamic(
  () => import("@/components/landing-page/FeaturesSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const PricingSection = dynamic(
  () => import("@/components/landing-page/PricingSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const FeedbackSection = dynamic(
  () => import("@/components/landing-page/FeedbackSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const ChatBotSection = dynamic(
  () => import("@/components/landing-page/ChatBotSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const TestimonialsSection = dynamic(
  () => import("@/components/landing-page/TestimonialsSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

const ServicesSection = dynamic(
  () => import("@/components/landing-page/ServicesSection"),
  { loading: () => <div className="h-96 flex items-center justify-center">Loading...</div> }
);

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="h-96 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function LandingPage() {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  // Handle plan upgrade
  const handleUpgrade = (planId: string) => {
    // Simplified version without API call
    toast.success(`Plan ${planId} selected! Upgrade functionality is disabled.`);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedback.trim() === "") {
      toast.error("Please enter your feedback!");
      return;
    }
    toast.success("Thanks for your feedback!");
    setFeedback(""); // Clear input after submission
  };

  // Toggle chat open/close
  const handleChatOpen = () => {
    setIsChatOpen(true);
    router.push("/chat");
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === "dark" ? "bg-[#0A0F1C] text-white" : "bg-[#F8FAFC] text-gray-900"}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-30" />
        
        {/* Glowing Orbs */}
        <div className="absolute -top-[10%] -left-[5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-[10%] left-[30%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-3xl" />
        
        {/* Particles - client-side only */}
        <ParticlesBackground />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero section is loaded immediately */}
        <HeroSection onChatOpen={handleChatOpen} />
        
        {/* Lazy load all other sections */}
        <Suspense fallback={<LoadingFallback />}>
          <VideoSection />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <FeaturesSection />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <ServicesSection onChatOpen={handleChatOpen} />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <ChatBotSection onChatOpen={handleChatOpen} />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <TestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <PricingSection onUpgrade={handleUpgrade} />
        </Suspense>
        
        <Suspense fallback={<LoadingFallback />}>
          <FeedbackSection 
            feedback={feedback} 
            setFeedback={setFeedback} 
            onSubmit={handleFeedbackSubmit} 
          />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="relative py-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">© 2025 WP.ai - All rights reserved.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}