"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { CheckCircle, ArrowRight, MessageSquare, DollarSign, Rocket, Gauge, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

// Pricing Plans
const plans = [
  {
    id: "quarterly",
    title: "Quarterly Plan",
    price: 40,
    duration: "per 3 months",
    features: ["Advanced AI suggestions", "Priority support", "Exclusive WP plugins"],
    best: true,
  },
  {
    id: "monthly",
    title: "Monthly Plan",
    price: 15,
    duration: "per month",
    features: ["Core AI features", "Basic support", "10 WP optimizations"],
  },
  {
    id: "yearly",
    title: "Yearly Plan",
    price: 120,
    duration: "per year",
    features: ["Unlimited AI optimizations", "Dedicated WP consultant", "Exclusive plugins"],
  },
];

// Unique features for "Why Choose WP.ai?"
const features = [
  {
    title: "AI-Powered SEO",
    description: "Automatically optimizes your content and metadata for better Google rankings.",
    icon: Rocket,
  },
  {
    title: "Faster Load Times",
    description: "Reduce WordPress page load times with intelligent caching and asset optimization.",
    icon: Gauge,
  },
  {
    title: "Auto Optimization",
    description: "Detects issues and fixes them instantly to keep your site running at peak performance.",
    icon: Wrench,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState("");

  const handleUpgrade = async (planId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upgrade-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ planId }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success(`Successfully upgraded to ${data.planName}!`);
      } else {
        toast.error(data.message || "Upgrade failed. Please try again.");
      }
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast.error("Something went wrong. Try again later.");
    }
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

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === "dark" ? "bg-[#0A0F1C] text-white" : "bg-[#F8FAFC] text-gray-900"}`}>
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-30" />
        
        {/* Large Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl" />
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-600/30 rounded-full blur-3xl" />
        
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${(i * 5)}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -1000],
                opacity: [1, 0],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Glowing Lines */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
              style={{
                width: '100%',
                top: `${(i + 1) * 20}%`,
                left: 0,
              }}
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Floating Circles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
            style={{
              width: `${100 + i * 20}px`,
              height: `${100 + i * 20}px`,
              left: `${(i * 15)}%`,
              top: `${(i * 10)}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 180],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                AI-Powered WordPress Optimization
              </span>
            </motion.h1>
            <motion.p
              className="mt-4 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              WP.ai supercharges your WordPress site with <span className="font-semibold text-blue-600 dark:text-blue-400">AI automation</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">SEO enhancements</span>, making your website smarter and faster.
            </motion.p>

            <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                className="group relative w-44 sm:w-auto px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-white rounded-xl text-sm sm:text-base md:text-lg font-semibold overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/chat")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it Now <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                />
              </motion.button>

              <motion.button
                className="group w-48 sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/about")}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Updated Hero Image */}
          <motion.div
            className="mt-12 sm:mt-16 md:mt-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] md:w-[300px] md:h-[300px] mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30 animate-pulse" />
              <motion.div
                className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Image
                  src="/wp.webp"
                  fill
                  style={{ objectFit: 'cover' }}
                  alt="AI-powered hero"
                  className="rounded-full hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Video Section */}
        <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-4 sm:space-y-6 md:space-y-8"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Our platform provides access to the latest WordPress data.
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Anyone can learn about new plugins, themes, and everything WordPress-related right here. 
                  Ask us anything about WordPress and get the latest updates instantly.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="WP.ai Demonstration"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16 md:mb-20"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Why Choose WP.ai?
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 transition-opacity group-hover:opacity-100" />
                  <div className={`relative h-full p-6 sm:p-8 rounded-2xl backdrop-blur-sm ${theme === "dark" ? "bg-gray-800/90" : "bg-white/90"}`}>
                    <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 md:mb-8"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                We Value Your Feedback
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 md:mb-12"
            >
              Share your thoughts to help us improve WP.ai.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
              <div className="relative">
                <textarea
                  className="w-full p-4 sm:p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-base sm:text-lg min-h-[150px] sm:min-h-[200px]"
                  placeholder="Write your feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />

                <motion.button
                  onClick={handleFeedbackSubmit}
                  className="mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Submit Feedback
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
          <p className="relative text-gray-600 dark:text-gray-400">© 2024 WP.ai - All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
