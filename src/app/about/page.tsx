/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

// Lazy load ParticlesBackground
const ParticlesBackground = dynamic(
  () => import("@/components/landing-page/ParticlesBackground"),
  { ssr: false, loading: () => null }
);

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=388&q=80"
  },
  {
    name: "Michael Chen",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
  },
  {
    name: "Emma Davis",
    role: "Head of AI",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=461&q=80"
  }
];

const stats = [
  { label: "Active Users", value: "10K+" },
  { label: "Countries", value: "50+" },
  { label: "AI Models", value: "25+" },
  { label: "Satisfaction", value: "99%" }
];

const faqs = [
  { 
    question: "What is WP.ai?", 
    answer: "WP.ai is an innovative AI-powered platform designed to revolutionize WordPress development and management. Our cutting-edge solutions help developers and businesses create, maintain, and optimize WordPress websites with unprecedented efficiency." 
  },
  { 
    question: "How does WP.ai enhance WordPress development?", 
    answer: "WP.ai leverages advanced artificial intelligence to automate common WordPress tasks, provide intelligent code suggestions, optimize performance, and offer predictive maintenance capabilities. This allows developers to focus on creativity while AI handles the repetitive tasks." 
  },
  { 
    question: "Is WP.ai suitable for beginners?", 
    answer: "Absolutely! WP.ai is designed to be user-friendly for all skill levels. Beginners can benefit from our intuitive interface and AI-guided assistance, while experienced developers can leverage our advanced features for complex projects." 
  },
  { 
    question: "What makes WP.ai different from other WordPress tools?", 
    answer: "WP.ai stands out through its unique combination of AI-powered automation, real-time optimization, and predictive analytics. Our platform not only helps you build websites faster but also ensures they perform better and stay secure." 
  }
];

export default function AboutPage() {
  const { theme } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
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
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
            About WP.ai
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Revolutionizing WordPress development with the power of artificial intelligence
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/20 dark:border-gray-700/20"
            >
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mission Section */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/20 dark:border-gray-700/20">
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              At WP.ai, we're committed to transforming WordPress development through innovative AI solutions. 
              Our mission is to empower developers and businesses with intelligent tools that make website 
              creation and management more efficient, intuitive, and powerful than ever before.
            </p>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/20 dark:border-gray-700/20 p-6"
                whileHover={{ y: -5 }}
              >
                <div className="aspect-square overflow-hidden rounded-xl mb-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="rounded-xl overflow-hidden bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-gray-200/20 dark:border-gray-700/20"
                initial={false}
                animate={{ backgroundColor: openFAQ === index ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)' }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex justify-between items-center w-full p-6 text-left"
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`transform transition-transform duration-200 ${
                      openFAQ === index ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
