import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import FeatureCard from "./FeatureCard";
import { FEATURES } from "./data";

const FeaturesSection: React.FC = () => {
  return (
    <section className="relative py-24" id="features">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60"></span>
            <span className="mx-3 text-sm font-medium text-primary">WP PLATFORM</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/60"></span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">WP.ai?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform helps you optimize your WordPress site with cutting-edge AI technology 
            that learns from the latest WordPress trends and best practices.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
        
        {/* Visual separator after features */}
        <div className="mt-24 flex justify-center">
          <div className="h-px w-40 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 