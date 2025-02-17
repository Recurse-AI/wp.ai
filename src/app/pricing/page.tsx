"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { CheckCircle, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    id: "monthly",
    title: "Monthly Plan",
    price: 15,
    duration: "per month",
    features: ["Access to core features", "Basic AI support", "10 WordPress optimizations"],
  },
  {
    id: "quarterly",
    title: "Quarterly Plan",
    price: 40,
    duration: "per 3 months",
    features: ["Everything in Monthly", "Advanced AI suggestions", "Priority support"],
    best: true,
  },
  {
    id: "yearly",
    title: "Yearly Plan",
    price: 120,
    duration: "per year",
    features: ["Everything in Quarterly", "Unlimited WordPress optimizations", "Exclusive WP plugins"],
  },
];

export default function PricingPage() {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) throw new Error("Failed to subscribe");
      alert(`You have selected the ${planId} plan!`);
    } catch (error) {
      console.error("Error selecting plan:", error);
    }
  };

  return (
    <div
      className={`relative min-h-screen bg-transparent flex flex-col items-center justify-center px-6 py-12 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* ✅ Fixed Background Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* 🔵 Large Circles */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-blue-400 opacity-100 rounded-full blur-3xl animate-pulse" />
        {/* <div className="absolute top-60 right-20 w-96 h-96 bg-purple-800 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" /> */}
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" />
        {/* <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-pink-500 opacity-100 rounded-full blur-3xl animate-pulse delay-2000" /> */}
        {/* <div className="absolute top-2/4 right-1/4 w-80 h-80 bg-yellow-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" /> */}
      </div>
      
      {/* ✅ Page Header */}
      <motion.h1
        className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Choose the Perfect Plan
      </motion.h1>
      <motion.p
        className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-lg text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Get the best <strong>AI-powered WordPress</strong> optimization with <span className="text-blue-500 font-bold">WP.ai</span>. Choose a plan that fits your needs and elevate your website performance!
      </motion.p>

      {/* ✅ Pricing Cards with Animation */}
      <motion.div
        className="grid md:grid-cols-3 gap-6 w-full max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { delayChildren: 0.2, staggerChildren: 0.2 },
          },
        }}
      >
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            className={`relative p-6 border rounded-2xl shadow-lg transition-all duration-300 overflow-hidden
              ${
                selectedPlan === plan.id
                  ? "scale-105 border-blue-500 shadow-xl"
                  : "border-gray-300 dark:border-gray-700"
              }
              ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* ✅ "Best Popular" Badge Animation */}
            {plan.best && (
              <motion.div
                className="absolute top-1 right-1 bg-yellow-400 text-black px-2 py-0 rounded-full text-sm font-semibold flex items-center gap-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                ⭐ Best Popular
              </motion.div>
            )}

            {/* ✅ Background Glow Effect (Only for Selected Plan) */}
            {selectedPlan === plan.id && (
              <motion.div
                className="absolute inset-0 bg-blue-500 opacity-10 scale-125 blur-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 0.5 }}
              />
            )}

            {/* ✅ Plan Title & Price */}
            <h2 className="text-2xl font-semibold mb-3 text-center">{plan.title}</h2>
            <p className="flex justify-center items-center gap-2 text-4xl font-bold mb-4">
              <DollarSign size={24} /> {plan.price}
            </p>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 justify-center">
              <Clock size={18} /> {plan.duration}
            </p>

            {/* ✅ Features List with Entry Animation */}
            <ul className="mt-6 space-y-2">
              {plan.features.map((feature, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <CheckCircle className="text-green-500" size={18} /> {feature}
                </motion.li>
              ))}
            </ul>

            {/* ✅ Animated "Get Started" Button */}
            <motion.button
              onClick={() => handleSelectPlan(plan.id)}
              className="mt-6 w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
              {/* 🔹 Flowing Light Effect */}
              <motion.div
                className="absolute inset-0 bg-white opacity-10"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* ✅ Additional Call-to-Action */}
      <motion.p
        className="mt-10 text-lg text-center text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Need help choosing a plan? <a href="/contact" className="text-blue-500 font-semibold hover:underline">Contact Us</a>
      </motion.p>
    </div>

  );
}
