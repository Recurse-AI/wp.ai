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
    <div className={`relative min-h-screen bg-transparent ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      
      {/* <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://www.google.com/url?sa=i&url=https%3A%2F%2Fpicsvg.com%2F&psig=AOvVaw3uh8dXkfw57q-_E8xxMz1L&ust=1739881446717000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCJj2q9LZyosDFQAAAAAdAAAAABAJ')",
          opacity: 0.2,
        }}
      /> */}

      {/* ✅ Fixed Background Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* 🔵 Large Circles */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-blue-400 opacity-100 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 right-20 w-96 h-96 bg-purple-800 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-pink-500 opacity-100 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute top-2/4 right-1/4 w-80 h-80 bg-yellow-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>


      {/* ✅ Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-6">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          AI-Powered WordPress Optimization
        </motion.h1>
        <motion.p
          className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          WP.ai supercharges your WordPress site with <strong>AI automation</strong> and <strong>SEO enhancements</strong>, making your website smarter and faster.
        </motion.p>
        <div className="mt-8 flex gap-4">
        <motion.button
            className="relative px-6 py-3 text-white rounded-lg text-lg font-semibold flex items-center gap-2 overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push("/chat")}
          >
            {/* Flowing Effect Layer */}
            <motion.div
              className="absolute inset-0 bg-white opacity-10"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
            />
            
            Try it Now <ArrowRight size={18} />
          </motion.button>

          <motion.button
            className="relative px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-lg font-semibold overflow-hidden"
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push("/about")}
          >
            {/* Flowing Effect Layer */}
            <motion.div
              className="absolute inset-0 bg-white opacity-10"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
            />
            
            Learn More
          </motion.button>

        </div>

        {/* ✅ Animated Hero Image (Slow Rotation Fix) */}
        <motion.div
          className="mt-12"
          animate={{ rotate: 360 }} // ✅ Corrected rotation
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }} // ✅ Slower rotation speed
        >
          <Image src="/wp.webp" width={600} height={400} alt="AI-powered hero" className="rounded-lg" />
        </motion.div>
      </section>

      {/* ✅ Video Section */}
      <section className="flex flex-col lg:flex-row items-center justify-center py-16 px-6 ">
        {/* Centered content with 10% free space on both sides */}
        <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto lg:space-x-10">
          {/* Left Column (Title + Description, 30% width) */}
          <div className="w-full lg:w-[30%] text-center lg:text-left flex flex-col justify-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Our platform provides access to the latest WordPress data.
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 shadow-md p-4 rounded-lg bg-white dark:bg-gray-800">
              Anyone can learn about new plugins, themes, and everything WordPress-related right here. 
              Ask us anything about WordPress and get the latest updates instantly.
            </p>
          </div>

          {/* Right Column (Video, 70% width) */}
          <div className="w-full lg:w-[70%]">
            <div className="w-full aspect-video">
              <iframe
                className="w-full h-full rounded-lg shadow-lg"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="WP.ai Demonstration"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Features Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center">Why Choose WP.ai?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`relative p-6 border rounded-2xl shadow-lg transition-all duration-300 overflow-hidden
                ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
                transition: { duration: 0.3 },
              }}
            >
              {/* ✅ Line Drawing Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none"
                initial={{ borderColor: "transparent", clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ borderColor: "#3b82f6", clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 10, ease: "easeInOut" }}
                whileHover={{ borderWidth: "4px", transition: { duration: 0.3 } }}
              />

              {/* ✅ Background Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-blue-500 opacity-10 scale-125 blur-2xl"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.3 }}
                transition={{ duration: 0.3 }}
              />

              {/* ✅ Feature Content */}
              <div className="relative z-10">
                <feature.icon className="text-blue-500" size={36} />
                <h3 className="text-xl font-semibold mt-2">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>



      {/* ✅ Pricing Section - Added Star Badge & Upgrade Now Button */}
      {/* <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              className={`relative p-6 border rounded-2xl shadow-lg transition-all duration-300
                ${plan.best ? "border-blue-500 scale-105 shadow-xl" : "border-gray-300 dark:border-gray-700"}
                ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
              whileHover={{ scale: 1.05 }}
            >
              
              {plan.best && (
                <motion.div
                  className="absolute top-2 right-2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  ⭐ Best Popular
                </motion.div>
              )}

              <h3 className="text-2xl font-semibold">{plan.title}</h3>
              <p className="flex items-center gap-2 text-4xl font-bold mt-3">
                <DollarSign size={24} /> {plan.price}
              </p>
              <p className="text-gray-500 dark:text-gray-400">{plan.duration}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} /> {feature}
                  </li>
                ))}
              </ul>

              
              <motion.button
                onClick={() => handleUpgrade(plan.id)}
                className="mt-6 w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
              >
                Upgrade Now
                
                <motion.div
                  className="absolute inset-0 bg-white opacity-10"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section> */}

      {/* ✅ Feedback Section */}
      <section className="py-20 px-6 text-center">
        <motion.h2
          className="text-4xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          We Value Your Feedback
        </motion.h2>
        <motion.p
          className="text-gray-500 dark:text-gray-400 mt-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Share your thoughts to help us improve WP.ai.
        </motion.p>

        <motion.div
          className="mt-6 max-w-xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* ✅ Feedback Textarea */}
          <textarea
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="Write your feedback..."
            value={feedback} // ✅ Controlled Input
            onChange={(e) => setFeedback(e.target.value)} // ✅ Handles changes correctly
          />

          {/* ✅ Submit Button with Animation */}
          <motion.button
            onClick={handleFeedbackSubmit}
            className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-semibold relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
          >
            Submit Feedback

            {/* 🔹 Flowing Light Effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-10"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </motion.button>
        </motion.div>
      </section>

      {/* ✅ Footer */}
      <footer className="py-6 text-center bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">© 2024 WP.ai - All rights reserved.</p>
      </footer>
    </div>
  );
}
