import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Lazy-loaded component with no SSR to ensure it only runs on client
const ParticlesBackground: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);
    
    setIsMounted(true);
    
    // Cleanup function
    return () => setIsMounted(false);
  }, []);
  
  // Don't render anything on server or if not mounted
  if (!isMounted) return null;
  
  // Reduce the number of particles based on reduced motion preference
  const particleCount = reducedMotion ? 5 : 10;
  const orbCount = reducedMotion ? 2 : 4;
  const lineCount = reducedMotion ? 2 : 4;
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-60">
      {/* Particles - reduced count and optimized animations */}
      <div className="absolute inset-0">
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${(i * 10)}%`,
              top: `${Math.random() * 100}%`,
              willChange: "transform, opacity", // Optimize for animation
            }}
            initial={{ y: 0, opacity: 0.7 }}
            animate={{
              y: -1000,
              opacity: 0,
            }}
            transition={{
              duration: 10 + Math.random() * 5, // Reduced variation
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Glowing Lines - reduced count */}
      <div className="absolute inset-0">
        {[...Array(lineCount)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
            style={{
              width: '100%',
              top: `${(i + 1) * 30}%`,
              left: 0,
              willChange: "transform, opacity", // Optimize for animation
            }}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{
              x: '100%',
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              delay: i * 3,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Orbs - reduced count and simplified animations */}
      {[...Array(orbCount)].map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10"
          style={{
            width: `${150 + i * 50}px`,
            height: `${150 + i * 50}px`,
            left: `${15 + (i * 25)}%`,
            top: `${15 + (i * 20)}%`,
            willChange: "transform, opacity", // Optimize for animation
          }}
          initial={{ scale: 1, opacity: 0.3, rotate: 0 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
            rotate: 180,
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Export as dynamic component with no SSR to ensure it only runs on client
export default dynamic(() => Promise.resolve(ParticlesBackground), {
  ssr: false
}); 