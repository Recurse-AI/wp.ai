"use client";

import React, { useState, Suspense, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { showStatusToast, showErrorToast } from '@/components/ui/StatusToast';
import dynamic from "next/dynamic";

// Import HeroSection directly as it's critical for initial render
import { HeroSection} from "@/components/landing-page";

// Loading component for ParticlesBackground
const LoadingBackground = () => (
  <div className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-30" />
    <div className="absolute -top-[10%] -left-[5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />
    <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-[10%] left-[30%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-3xl" />
  </div>
);

// Improved loading component with skeleton
const SectionSkeleton = ({ height = "h-96", label = "Loading section..." }) => (
  <div className={`${height} w-full flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-100/30 to-gray-200/30 dark:from-gray-800/30 dark:to-gray-900/30 backdrop-blur-sm animate-pulse`}>
    <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mb-4"></div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

// Use a visibility hook for loading components as they enter viewport
const useVisibility = (threshold = 0.1) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.disconnect();
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

// Lazy load components with consistent loading states
const ParticlesBackground = dynamic(
  () => import("@/components/landing-page/ParticlesBackground"),
  { 
    ssr: false,
    loading: () => <LoadingBackground />
  }
);

const VideoSection = dynamic(
  () => import("@/components/landing-page/VideoSection"),
  { ssr: false, loading: () => <SectionSkeleton label="Loading video demonstration..." /> }
);

const FeaturesSection = dynamic(
  () => import("@/components/landing-page/FeaturesSection"),
  { loading: () => <SectionSkeleton label="Loading features..." /> }
);

const PricingSection = dynamic(
  () => import("@/components/landing-page/PricingSection"),
  { loading: () => <SectionSkeleton label="Loading pricing options..." /> }
);

const FeedbackSection = dynamic(
  () => import("@/components/landing-page/FeedbackSection"),
  { loading: () => <SectionSkeleton label="Loading feedback form..." /> }
);

const ChatBotSection = dynamic(
  () => import("@/components/landing-page/ChatBotSection"),
  { loading: () => <SectionSkeleton label="Loading AI chat demo..." /> }
);

const TestimonialsSection = dynamic(
  () => import("@/components/landing-page/TestimonialsSection"),
  { loading: () => <SectionSkeleton label="Loading testimonials..." /> }
);

const ServicesSection = dynamic(
  () => import("@/components/landing-page/ServicesSection"),
  { loading: () => <SectionSkeleton label="Loading services..." /> }
);

const TreeNavigator = dynamic(
  () => import("@/components/landing-page/TreeNavigator"),
  { loading: () => <SectionSkeleton height="h-[850px]" label="Loading visualization..." /> }
);

export default function LandingPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  // Create visibility detectors for each section
  const treeVisibility = useVisibility(0.1);
  const videoVisibility = useVisibility(0.1);
  const featuresVisibility = useVisibility(0.1);
  const servicesVisibility = useVisibility(0.1);
  const chatbotVisibility = useVisibility(0.1);
  const testimonialsVisibility = useVisibility(0.1);
  const pricingVisibility = useVisibility(0.1);
  const feedbackVisibility = useVisibility(0.1);

  // Ensure component is mounted before accessing theme-dependent styles
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle plan upgrade
  const handleUpgrade = (planId: string) => {
    // Simplified version without API call
    showStatusToast('COMPLETED', `Plan ${planId} selected! Upgrade functionality is disabled.`);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      showErrorToast('Please enter your feedback!');
      return;
    }
    
    try {
      // In a real app, you would send this to your API
      console.log('Feedback submitted:', feedback);
      showStatusToast('COMPLETED', 'Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showErrorToast('Failed to submit feedback. Please try again.');
    }
  };

  // Determine theme-based classes - use light theme styles before mounting
  const bgClass = mounted && theme === "dark" ? "bg-[#0A0F1C] text-white" : "bg-[#F8FAFC] text-gray-900";
  
  return (
    <div className={`relative min-h-screen overflow-hidden landing-page ${bgClass}`}>
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Particles - client-side only */}
        <Suspense fallback={<LoadingBackground />}>
          <ParticlesBackground />
        </Suspense>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-14 md:pt-16">
        {/* Hero section is loaded immediately */}
        <HeroSection />
        
        {/* TreeNavigator section - load when in viewport */}
        <div ref={treeVisibility.ref}>
          {treeVisibility.isVisible && (
            <TreeNavigator />
          )}
          {!treeVisibility.isVisible && <SectionSkeleton height="h-[850px]" label="Loading visualization..." />}
        </div>
        
        {/* Video section - load when in viewport */}
        <div ref={videoVisibility.ref}>
          {videoVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading video demonstration..." />}>
              <VideoSection />
            </Suspense>
          )}
          {!videoVisibility.isVisible && <SectionSkeleton label="Loading video demonstration..." />}
        </div>
        
        {/* Features section - load when in viewport */}
        <div ref={featuresVisibility.ref}>
          {featuresVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading features..." />}>
              <FeaturesSection />
            </Suspense>
          )}
          {!featuresVisibility.isVisible && <SectionSkeleton label="Loading features..." />}
        </div>
        
        {/* Services section - load when in viewport */}
        <div ref={servicesVisibility.ref}>
          {servicesVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading services..." />}>
              <ServicesSection />
            </Suspense>
          )}
          {!servicesVisibility.isVisible && <SectionSkeleton label="Loading services..." />}
        </div>
        
        {/* ChatBot section - load when in viewport */}
        <div ref={chatbotVisibility.ref}>
          {chatbotVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading AI chat demo..." />}>
              <ChatBotSection />
            </Suspense>
          )}
          {!chatbotVisibility.isVisible && <SectionSkeleton label="Loading AI chat demo..." />}
        </div>
        
        {/* Testimonials section - load when in viewport */}
        <div ref={testimonialsVisibility.ref}>
          {testimonialsVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading testimonials..." />}>
              <TestimonialsSection />
            </Suspense>
          )}
          {!testimonialsVisibility.isVisible && <SectionSkeleton label="Loading testimonials..." />}
        </div>
        
        {/* Pricing section - load when in viewport */}
        <div ref={pricingVisibility.ref}>
          {pricingVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading pricing options..." />}>
              <PricingSection onUpgrade={handleUpgrade} />
            </Suspense>
          )}
          {!pricingVisibility.isVisible && <SectionSkeleton label="Loading pricing options..." />}
        </div>
        
        {/* Feedback section - load when in viewport */}
        <div ref={feedbackVisibility.ref}>
          {feedbackVisibility.isVisible && (
            <Suspense fallback={<SectionSkeleton label="Loading feedback form..." />}>
              <FeedbackSection 
                feedback={feedback} 
                setFeedback={setFeedback} 
                onSubmit={handleFeedbackSubmit} 
              />
            </Suspense>
          )}
          {!feedbackVisibility.isVisible && <SectionSkeleton label="Loading feedback form..." />}
        </div>
      </div>
    </div>
  );
}