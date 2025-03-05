import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ParticlesBackground: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  if (!isMounted) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-60">
      {/* Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${(i * 7)}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -1000],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Glowing Lines */}
      <div className="absolute inset-0">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
            style={{
              width: '100%',
              top: `${(i + 1) * 25}%`,
              left: 0,
            }}
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10"
          style={{
            width: `${120 + i * 30}px`,
            height: `${120 + i * 30}px`,
            left: `${10 + (i * 20)}%`,
            top: `${10 + (i * 15)}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180],
          }}
          transition={{
            duration: 12 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default ParticlesBackground; 