import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { fadeInLeft, fadeInRight } from "./data";
import Image from "next/image";

const VideoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <section className="relative py-20 sm:py-28">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={fadeInLeft.initial}
            whileInView={fadeInLeft.animate}
            transition={fadeInLeft.transition}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Our platform provides access to the latest WordPress data.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Anyone can learn about new plugins, themes, and everything WordPress-related right here. 
              Ask us anything about WordPress and get the latest updates instantly.
            </p>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={handlePlayClick}
              className="flex items-center gap-2 mt-6 font-medium"
            >
              <Play size={20} className="text-primary" /> Watch Overview
            </Button>
          </motion.div>

          <motion.div
            initial={fadeInRight.initial}
            whileInView={fadeInRight.animate}
            transition={fadeInRight.transition}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/40 dark:border-border/20">
              {isPlaying ? (
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="WP.ai Demonstration"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <div 
                  className="relative w-full h-full cursor-pointer group"
                  onClick={handlePlayClick}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play size={30} fill="white" className="ml-1" />
                    </div>
                  </div>
                  <Image 
                    src="/wp.webp"
                    alt="Video thumbnail" 
                    layout="fill" 
                    objectFit="cover"
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to a placeholder if image doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.src = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg";
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default VideoSection; 