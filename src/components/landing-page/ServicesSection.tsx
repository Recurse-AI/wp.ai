import React from "react";
import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AI_SERVICES } from "./data";
import ServiceCard from "./ServiceCard";
import { ServicesSectionProps } from "./types";

const ServicesSection = ({ onChatOpen }: ServicesSectionProps) => {
  return (
    <section id="services" className="relative py-24">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/5 dark:to-blue-950/10 -z-10"></div>
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
      <div className="absolute bottom-0 right-0 -mb-16 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-blue-600/60"></span>
            <span className="mx-3 text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
              <Sparkles className="w-4 h-4 mr-1" /> AI POWERED
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-blue-600/60"></span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            WordPress AI Agent <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Services</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how our WordPress AI can transform your website development
            workflow with intelligent automation and expert guidance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {AI_SERVICES.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onChatOpen={onChatOpen}
            />
          ))}
        </div>
        
        {/* Interactive hint */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            Click on any service card to try it with our AI chat assistant
          </p>
        </motion.div>
      </Container>
    </section>
  );
};

export default ServicesSection; 