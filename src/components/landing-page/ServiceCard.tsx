import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, MessageSquarePlus, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { ServiceCardProps } from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const ServiceCard = ({ service, index, onChatOpen }: ServiceCardProps) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
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
              className="w-full mt-auto group"
              variant="outline"
              style={{ borderColor: `${color}40` }}
            >
              <span className="text-foreground group-hover:text-primary transition-colors duration-300 flex items-center">
                Try it now
                <MessageSquarePlus className="ml-2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </span>
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default ServiceCard; 