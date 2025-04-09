import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const HeroSection: React.FC<{ onChatOpen: () => void }> = ({ onChatOpen }) => {
  const router = useRouter();
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

          <motion.div 
            variants={buttonVariants}
            className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center"
          >
            {/* Try it Now button with Link component for better performance */}
            <Link href="/chat" passHref className="w-full sm:w-auto">
              <Button 
                size="lg"
                className="group relative text-lg px-8 py-6 text-white rounded-xl font-semibold overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 w-full"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Try it Now <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </span>
                {!prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                    style={{ willChange: "transform" }}
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                )}
              </Button>
            </Link>

            {/* Enhanced Chat with AI button */}
            <Link href="/chat" passHref className="w-full sm:w-auto">
              <Button 
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-xl font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 w-full"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="text-blue-600 dark:text-blue-400" size={20} />
                  <span>Chat with AI</span>
                </span>
              </Button>
            </Link>
          </motion.div>

          {/* Added Feature Navigation Cards */}
          <motion.div
            variants={buttonVariants}
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
          >
            {/* Agent Card */}
            <Link href="/agent" passHref>
              <div className="group p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-gray-800 dark:hover:to-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors">
                    <Zap size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">WordPress Agent</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI-powered site optimization</p>
                  </div>
                  <ArrowRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Community Card */}
            <Link href="/community" passHref>
              <div className="group p-6 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-gray-800/50 dark:to-gray-900/50 hover:from-purple-100 hover:to-fuchsia-100 dark:hover:from-gray-800 dark:hover:to-gray-900 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Community</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Join discussions & share ideas</p>
                  </div>
                  <ArrowRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </Container>

      {/* Floating Chat Button for Mobile */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="sm:hidden fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onChatOpen}
          size="icon"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      </motion.div>

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