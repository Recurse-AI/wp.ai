import React from "react";
import { motion } from "framer-motion";
import { ServiceCardProps } from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const ServiceCard = ({ service, index }: ServiceCardProps) => {
  const { title, description, icon: Icon, example, color } = service;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col h-full"
    >
      <Card className="relative overflow-hidden h-full flex flex-col border-border/40 dark:border-border/20 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div 
            className="w-12 h-12 flex items-center justify-center rounded-lg mb-4"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <p className="text-sm italic">"{example}"</p>
          </div>
          
          <Link href={`/chat?service=${encodeURIComponent(title)}`} passHref>
            <Button 
              className="w-full mt-auto group relative overflow-hidden"
              variant="outline"
              style={{ borderColor: `${color}40` }}
            >
              <span className="relative z-10 transition-colors duration-300 text-foreground group-hover:text-white">
                Try it now
              </span>
              <span 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(to right, ${color.split(' ')[0].replace('from-', '')}, ${color.split(' ')[1]?.replace('to-', '') || color.split(' ')[0].replace('from-', '')})` }}
              ></span>
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default ServiceCard; 