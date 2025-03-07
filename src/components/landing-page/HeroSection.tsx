import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const HeroSection: React.FC<{ onChatOpen: () => void }> = ({ onChatOpen }) => {
  const router = useRouter();
  
  return (
    <section className="relative flex flex-col items-center justify-center text-center py-16 sm:py-24 min-h-[calc(100vh-80px)]">
      {/* Network Grid Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="network-grid"></div>
        
        {/* Animated Network Nodes */}
        <div className="network-nodes">
          {Array(10).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="node"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        
        {/* Connection Lines */}
        <svg className="connections" width="100%" height="100%">
          <line x1="20%" y1="30%" x2="40%" y2="50%" className="connection-line" style={{ animationDelay: '0.5s' }} />
          <line x1="40%" y1="50%" x2="70%" y2="30%" className="connection-line" style={{ animationDelay: '1.5s' }} />
          <line x1="70%" y1="30%" x2="80%" y2="60%" className="connection-line" style={{ animationDelay: '2.5s' }} />
          <line x1="30%" y1="70%" x2="60%" y2="80%" className="connection-line" style={{ animationDelay: '3.5s' }} />
          <line x1="40%" y1="50%" x2="30%" y2="70%" className="connection-line" style={{ animationDelay: '4.5s' }} />
          <line x1="60%" y1="80%" x2="80%" y2="60%" className="connection-line" style={{ animationDelay: '5.5s' }} />
          <line x1="20%" y1="30%" x2="70%" y2="30%" className="connection-line" style={{ animationDelay: '6.5s' }} />
          <line x1="60%" y1="20%" x2="40%" y2="50%" className="connection-line" style={{ animationDelay: '7.5s' }} />
        </svg>
      </div>
      
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              AI-Powered WordPress Optimization
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            WP.ai supercharges your WordPress site with <span className="font-semibold text-blue-600 dark:text-blue-400">AI automation</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">SEO enhancements</span>, making your website smarter and faster.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center"
          >
            <Button 
              onClick={() => router.push("/chat")} 
              size="lg"
              className="group relative text-lg px-8 py-6 text-white rounded-xl font-semibold overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
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
            </Button>

            <Button 
              onClick={onChatOpen} 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-xl font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 w-full sm:w-auto"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="text-blue-600" size={20} />
                Chat with AI
              </span>
            </Button>
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