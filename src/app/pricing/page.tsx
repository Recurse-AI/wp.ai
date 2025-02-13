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
      className={`min-h-screen flex flex-col items-center justify-center px-6 py-12 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Page Header */}
      <motion.h1
        className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Choose Your Plan
      </motion.h1>
      <motion.p
        className="text-lg text-gray-500 dark:text-gray-400 mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Get the best AI-powered WordPress solutions with <strong>WP.ai</strong>
      </motion.p>

      {/* Pricing Cards */}
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
            className={`relative p-6 border rounded-2xl shadow-lg transition-all duration-300 ${
              selectedPlan === plan.id
                ? "scale-105 border-blue-500 shadow-xl"
                : "border-gray-300 dark:border-gray-700"
            } ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Plan Title & Price */}
            <h2 className="text-2xl font-semibold mb-3">{plan.title}</h2>
            <p className="flex items-center gap-2 text-4xl font-bold mb-4">
              <DollarSign size={24} /> {plan.price}
            </p>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock size={18} /> {plan.duration}
            </p>

            {/* Features List */}
            <ul className="mt-4 space-y-2">
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

            {/* Select Plan Button */}
            <motion.button
              onClick={() => handleSelectPlan(plan.id)}
              className="mt-6 w-full p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
