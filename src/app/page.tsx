"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { CheckCircle, ArrowRight, MessageSquare, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

export default function LandingPage() {
  const router = useRouter(); // ✅ Next.js Router
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      
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
          <p>
            WP.ai supercharges your WordPress site with cutting-edge <strong>AI automation</strong> and <strong>SEO enhancements</strong>, giving you the fastest and smartest website possible.
          </p>

        </motion.p>
        <div className="mt-8 flex gap-4">
          <motion.button
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            Try it Now <ArrowRight size={18} />
          </motion.button>
          <motion.button
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push("/about")}
          >
            Learn More
          </motion.button>
        </div>

        {/* Animated Hero Image */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <Image src="/wp.webp" width={600} height={400} alt="AI-powered hero" className="rounded-lg shadow-lg" />
        </motion.div>
      </section>

      {/* ✅ Features Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center">Why Choose WP.ai?</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          {["AI-powered SEO", "Faster Load Times", "Auto Optimization"].map((feature, index) => (
            <motion.div
              key={index}
              className={`p-6 border rounded-2xl shadow-lg transition-all duration-300 ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-xl font-semibold">{feature}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                WP.ai **automatically enhances** your WordPress experience, making it **smarter, faster, and more efficient**.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ Pricing Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              className={`p-6 border rounded-2xl shadow-lg transition-all duration-300 ${
                plan.best ? "border-blue-500 scale-105 shadow-xl" : "border-gray-300 dark:border-gray-700"
              } ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
              whileHover={{ scale: 1.05 }}
            >
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
              <button className="mt-6 w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all">
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ✅ Feedback Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold">We Value Your Feedback</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Share your thoughts to help us improve WP.ai.</p>
        <div className="mt-6 max-w-xl mx-auto">
          <textarea className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Write your feedback..."></textarea>
          <button className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-semibold">Submit Feedback</button>
        </div>
      </section>

      {/* ✅ Footer */}
      <footer className="py-6 text-center bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">© 2024 WP.ai - All rights reserved.</p>
      </footer>
    </div>
  );
}
