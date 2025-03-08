"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { CheckCircle, DollarSign, Clock, Zap, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ParticlesBackground } from "@/components/landing-page";

const plans = [
  {
    id: "monthly",
    title: "Starter",
    price: 15,
    duration: "per month",
    features: [
      "Access to core features",
      "Basic AI support",
      "10 WordPress optimizations",
      "24/7 Email support",
      "1 Website",
      "Basic Analytics"
    ],
    icon: <Zap className="w-6 h-6 text-blue-500" />,
    color: "blue"
  },
  {
    id: "quarterly",
    title: "Professional",
    price: 40,
    duration: "per 3 months",
    features: [
      "Everything in Starter",
      "Advanced AI suggestions",
      "Priority support",
      "3 Websites",
      "Advanced Analytics",
      "Custom Integrations"
    ],
    icon: <Star className="w-6 h-6 text-purple-500" />,
    color: "purple",
    best: true
  },
  {
    id: "yearly",
    title: "Enterprise",
    price: 120,
    duration: "per year",
    features: [
      "Everything in Professional",
      "Unlimited WordPress optimizations",
      "Exclusive WP plugins",
      "Unlimited Websites",
      "Custom AI Training",
      "Dedicated Support Team"
    ],
    icon: <Shield className="w-6 h-6 text-green-500" />,
    color: "green"
  }
];

export default function PricingPage() {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    // Your plan selection logic here
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
        
        {/* Particles */}
        <ParticlesBackground />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Header Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock the full potential of WordPress with our AI-powered solutions
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative p-8 rounded-2xl backdrop-blur-lg border group transition-all duration-300
                ${selectedPlan === plan.id 
                  ? `border-${plan.color}-500 bg-${plan.color}-500/10` 
                  : "border-gray-200/20 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/50"}
                ${plan.best ? "lg:-mt-4" : ""}`}
              whileHover={{
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
                transform: "translateY(-8px)"
              }}
            >
              {/* Best Value Badge */}
              {plan.best && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Best Value
                </div>
              )}

              {/* Plan Icon */}
              <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                {plan.icon}
              </div>

              {/* Plan Details */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-${plan.color}-500 transition-colors duration-300">
                  {plan.title}
                </h3>
                <div className="flex items-center justify-center gap-1 text-4xl font-bold mb-2">
                  <span className="text-2xl">$</span>
                  {plan.price}
                </div>
                <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                  <Clock size={16} /> {plan.duration}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-gray-600 dark:text-gray-300"
                  >
                    <CheckCircle className={`flex-shrink-0 w-5 h-5 text-${plan.color}-500`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-semibold relative overflow-hidden transition-all duration-300
                  ${selectedPlan === plan.id
                    ? `bg-${plan.color}-600 text-white`
                    : `bg-${plan.color}-500/10 text-${plan.color}-600 hover:bg-${plan.color}-500 hover:text-white`}
                  group-hover:shadow-lg
                `}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ or Additional Info */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <a
            href="/contact"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Need help choosing? Contact our team
          </a>
        </motion.div>
      </div>
    </div>
  );
}
