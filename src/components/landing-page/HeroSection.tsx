import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Zap, Code } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import OptimizedNavLink from "@/components/OptimizedNavLink";

const HeroSection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  
  // Only enable animations after component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  // Reduced number of nodes for better performance
  const nodeCount = prefersReducedMotion ? 4 : 8;
  
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-16 sm:py-24 min-h-[calc(100vh-80px)]">
      {/* Network Grid Pattern - Only render if mounted and not reduced motion */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="network-grid"></div>
          
          {/* Animated Network Nodes - Reduced count */}
          <div className="network-nodes">
            {!prefersReducedMotion && Array(nodeCount).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="node"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${15 + Math.random() * 70}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${8 + Math.random() * 5}s`
                }}
              />
            ))}
          </div>
          
          {/* Connection Lines - Only render if not reduced motion */}
          {!prefersReducedMotion && (
            <svg className="connections" width="100%" height="100%">
              <line x1="20%" y1="30%" x2="40%" y2="50%" className="connection-line" style={{ animationDelay: '0.5s' }} />
              <line x1="40%" y1="50%" x2="70%" y2="30%" className="connection-line" style={{ animationDelay: '1.5s' }} />
              <line x1="70%" y1="30%" x2="80%" y2="60%" className="connection-line" style={{ animationDelay: '2.5s' }} />
              <line x1="30%" y1="70%" x2="60%" y2="80%" className="connection-line" style={{ animationDelay: '3.5s' }} />
            </svg>
          )}
        </div>
      )}
      
      <Container>
        <motion.div
          initial="hidden"
          animate={isMounted ? "visible" : "hidden"}
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              AI-Powered WordPress Optimization
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Enhance your content with <span className="font-semibold text-blue-600 dark:text-blue-400">AI-powered analysis</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">smart optimization</span>, making your writing more impactful and engaging.
          </motion.p>

          {/* Feature Navigation - Redesigned */}
          <motion.div
            variants={buttonVariants}
            className="mt-14 max-w-4xl mx-auto"
          >
            {/* Main Action Button */}
            <div className="flex flex-col items-center mb-10">
              <OptimizedNavLink 
                href="/agent-workspace" 
                className="px-6 py-3 text-lg rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                trackPerformance={true}
                prefetch={true}
                priority={true}
              >
                <Zap className="w-4 h-4" />
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </OptimizedNavLink>
              <p className="text-muted-foreground text-sm mt-4">No credit card required • Instant access</p>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <OptimizedNavLink 
                href="/agent-workspace" 
                className="group relative flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-gray-800/60 dark:to-gray-900/60 shadow-md hover:shadow-lg transition-all duration-300 border border-cyan-200/20 dark:border-cyan-900/20 hover:border-cyan-200/50 dark:hover:border-cyan-900/50"
                trackPerformance={true}
                prefetch={true}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/80 to-blue-500/80 dark:from-cyan-600/30 dark:to-blue-700/30 text-white dark:text-cyan-400 shadow-inner">
                  <Code className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-gray-800 dark:text-gray-100">WordPress Agent</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Build plugins & themes</p>
                </div>
                <div className="ml-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight size={14} className="text-cyan-500 dark:text-cyan-400" />
                </div>
              </OptimizedNavLink>
              
              <OptimizedNavLink 
                href="/chat" 
                className="group relative flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-br from-violet-50/80 to-fuchsia-50/80 dark:from-gray-800/60 dark:to-gray-900/60 shadow-md hover:shadow-lg transition-all duration-300 border border-violet-200/20 dark:border-violet-900/20 hover:border-violet-200/50 dark:hover:border-violet-900/50"
                trackPerformance={true}
                prefetch={true}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400/80 to-fuchsia-500/80 dark:from-violet-600/30 dark:to-fuchsia-700/30 text-white dark:text-violet-400 shadow-inner">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-medium text-gray-800 dark:text-gray-100">AI Chat</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Interact with our AI</p>
                </div>
                <div className="ml-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight size={14} className="text-violet-500 dark:text-violet-400" />
                </div>
              </OptimizedNavLink>
              
              <Link href="/community" className="group relative flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-gray-800/60 dark:to-gray-900/60 shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200/20 dark:border-purple-900/20 hover:border-purple-200/50 dark:hover:border-purple-900/50">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-400/80 to-pink-500/80 dark:from-purple-600/30 dark:to-pink-700/30 text-white dark:text-purple-400 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-medium text-gray-800 dark:text-gray-100">Community</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Join discussions</p>
                </div>
                <div className="ml-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight size={14} className="text-purple-500 dark:text-purple-400" />
                </div>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Add animation keyframe for pulse-slow */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>

      {/* CSS for Network Grid */}
      <style jsx>{`
        .network-grid {
          position: absolute;
          inset: -10%;
          width: 120%;
          height: 120%;
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.12) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1.5px, transparent 1.5px);
          mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 80%);
        }

        /* Animated dots at grid intersections */
        .network-grid::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at center, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 60%);
          background-size: 40px 40px;
          background-position: 0 0;
          opacity: 0.8;
          animation: pulse 4s infinite ease-in-out;
        }

        /* Connection lines animation */
        .network-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(45deg, rgba(99, 102, 241, 0.15) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(99, 102, 241, 0.15) 25%, transparent 25%);
          background-size: 80px 80px;
          opacity: 0.5;
          animation: move 120s infinite linear;
        }

        .network-nodes {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        
        .node {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(124, 58, 237, 0.7);
          border-radius: 50%;
          filter: blur(1px);
          box-shadow: 0 0 8px rgba(124, 58, 237, 0.5);
          animation: float linear infinite;
        }
        
        .connections {
          position: absolute;
          inset: 0;
        }
        
        .connection-line {
          stroke: rgba(124, 58, 237, 0.4);
          stroke-width: 1.5;
          stroke-dasharray: 6 4;
          filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.5));
          animation: dash 6s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }

        @keyframes move {
          0% { background-position: 0 0; }
          100% { background-position: 1000px 1000px; }
        }
        
        @keyframes float {
          0% { transform: translate(0, 0); opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translate(30px, -30px); opacity: 0; }
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection; 