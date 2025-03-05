import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TestimonialCard from "./TestimonialCard";
import { TESTIMONIALS } from "./data";

const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % TESTIMONIALS.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay]);

  // Pause autoplay on hover
  const pauseAutoplay = () => setAutoplay(false);
  const resumeAutoplay = () => setAutoplay(true);

  const nextTestimonial = () => {
    setActiveIndex((current) => (current + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((current) => (current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <section 
      className="relative py-20 sm:py-28 px-4 sm:px-6" 
      id="testimonials"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              What Our Users Say
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover how WP.ai is helping WordPress users optimize their sites and achieve better results.
          </p>
        </motion.div>

        <div className="relative">
          {/* Desktop view - show all testimonials */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          {/* Mobile view - carousel */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out" 
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {TESTIMONIALS.map((testimonial) => (
                  <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={prevTestimonial}
              >
                <ChevronLeft size={20} />
              </Button>
              
              <div className="flex items-center gap-2 mx-4">
                {TESTIMONIALS.map((_, index) => (
                  <button 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${index === activeIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={nextTestimonial}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 