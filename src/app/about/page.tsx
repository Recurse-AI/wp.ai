"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { ChevronDown } from "lucide-react";

const faqs = [
  { question: "What is Recurse.ai?", answer: "Recurse.ai is a cutting-edge AI platform designed to optimize and enhance your digital workflow with intelligent automation and smart solutions." },
  { question: "How does Recurse.ai help businesses?", answer: "Our platform provides AI-driven tools for businesses to automate processes, analyze data, and improve efficiency, reducing costs and maximizing productivity." },
  { question: "Is Recurse.ai suitable for startups?", answer: "Absolutely! We offer scalable solutions tailored to businesses of all sizes, ensuring that startups and enterprises alike can benefit from AI-powered automation." },
  { question: "How do I get started?", answer: "Simply sign up on our platform, choose a plan that fits your needs, and start leveraging AI-driven insights to supercharge your business." },
];

export default function AboutPage() {
  const { theme } = useTheme();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* 🔹 Hero Section */}
      <motion.div
        className="w-full text-center py-20 px-4"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          Welcome to Recurse.ai
        </h1>
        <p className="mt-6 text-lg max-w-3xl mx-auto text-gray-500 dark:text-gray-400">
          At Recurse.ai, we believe in harnessing the power of <strong className="text-gray-700 dark:text-gray-300">Artificial Intelligence</strong> to revolutionize businesses. 
          Our innovative solutions empower companies to automate workflows, optimize operations, and enhance decision-making with cutting-edge AI-driven insights.
        </p>
      </motion.div>

      {/* 🔹 About Section */}
      <motion.div
        className="w-full max-w-5xl text-center py-12 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h2 className="text-3xl font-semibold">Our Mission</h2>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
            We strive to make AI <strong className="text-gray-700 dark:text-gray-300">accessible, intuitive, and transformative</strong>. 
            With state-of-the-art <strong className="text-gray-700 dark:text-gray-300">machine learning algorithms</strong> and 
            <strong className="text-gray-700 dark:text-gray-300"> automation tools</strong>, we help businesses 
            <strong className="text-gray-700 dark:text-gray-300"> streamline</strong> their operations and 
            <strong className="text-gray-700 dark:text-gray-300"> unlock new possibilities</strong> in the digital world.
        </p>

      </motion.div>

      {/* 🔹 FAQ Section */}
      <motion.div
        className="w-full max-w-4xl py-12 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <h2 className="text-3xl font-semibold text-center">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className={`border p-4 rounded-lg transition-all ${openFAQ === index ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"}`}>
              <button
                onClick={() => toggleFAQ(index)}
                className="flex justify-between items-center w-full text-lg font-medium text-left focus:outline-none"
              >
                {faq.question}
                <ChevronDown className={`transform transition-transform ${openFAQ === index ? "rotate-180" : "rotate-0"}`} />
              </button>
              {openFAQ === index && <p className="mt-2 text-gray-500 dark:text-gray-400">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
