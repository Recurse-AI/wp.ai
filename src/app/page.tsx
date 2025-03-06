"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import {toast} from "react-hot-toast";

// Import all components from the landing-page directory
import {
  ParticlesBackground,
  HeroSection,
  VideoSection,
  FeaturesSection,
  PricingSection,
  FeedbackSection,
  ChatBotSection,
  TestimonialsSection,
  ServicesSection
} from "@/components/landing-page";
import { useRouter } from "next/navigation";
import useAuth from "@/lib/useAuth";

export default function LandingPage() {
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isAuthenticated, user, loading } = useAuth();
  console.log('isAuthenticated, user, loading', isAuthenticated, user, loading);
  const router = useRouter();
  // Handle plan upgrade
  const handleUpgrade = (planId: string) => {
    // Simplified version without API call
    toast.success(`Plan ${planId} selected! Upgrade functionality is disabled.`);
    // Note: Authentication and API calls have been removed as requested
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
        <HeroSection onChatOpen={handleChatOpen} />
        <VideoSection />
        <FeaturesSection />
        <ServicesSection onChatOpen={handleChatOpen} />
        <ChatBotSection onChatOpen={handleChatOpen} />
        <TestimonialsSection />
        <PricingSection onUpgrade={handleUpgrade} />
        <FeedbackSection 
          feedback={feedback} 
          setFeedback={setFeedback} 
          onSubmit={handleFeedbackSubmit} 
        />
      </div>

      {/* Footer */}
      <footer className="relative py-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">© 2024 WP.ai - All rights reserved.</p>
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