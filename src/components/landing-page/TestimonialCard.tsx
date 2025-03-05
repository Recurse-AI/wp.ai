import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TestimonialProps } from "./types";

const TestimonialCard: React.FC<TestimonialProps> = ({ testimonial }) => {
  const { name, role, company, content, avatar } = testimonial;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden border-border/40 dark:border-border/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-primary/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
          
          <div className="inline-flex p-2 bg-primary/10 rounded-lg mb-4 self-start">
            <Quote className="text-primary w-5 h-5" />
          </div>
          
          <p className="text-muted-foreground mb-6 flex-grow italic leading-relaxed">"{content}"</p>
          
          <div className="flex items-center pt-4 border-t border-border/30">
            <Avatar className="h-10 w-10 mr-4 border-2 border-primary/20">
              <AvatarImage 
                src={avatar}
                alt={name}
              />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h4 className="font-medium">{name}</h4>
              <p className="text-sm text-muted-foreground">{role}, {company}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestimonialCard; 