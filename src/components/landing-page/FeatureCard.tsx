import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureCardProps } from "./types";

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const { icon: Icon, title, description } = feature;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden border-border/40 dark:border-border/20 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        
        <CardContent className="p-6">
          <div className="mb-5 p-3 inline-flex items-center justify-center rounded-lg bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{title}</h3>
          
          <p className="text-muted-foreground">{description}</p>
          
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-300 delay-100" />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeatureCard; 