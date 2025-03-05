import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCardProps } from "./types";

const PricingCard: React.FC<PricingCardProps> = ({ plan, onUpgrade }) => {
  const { id, title, price, duration, features, best, color, bgColor } = plan;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="relative h-full"
    >
      {best && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-500 hover:to-amber-500 text-white font-medium px-4 py-1 flex items-center gap-1 shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <Card 
        className={`relative h-full overflow-hidden border-border/40 ${best ? 'border-primary/50 dark:border-primary/30 shadow-lg' : ''} transition-all duration-300 bg-card/50 backdrop-blur-sm`}
        style={{
          backgroundImage: best ? `radial-gradient(circle at 100% 0%, ${bgColor}40 0%, transparent 25%)` : ''
        }}
      >
        <div 
          className="absolute top-0 left-0 w-full h-1"
          style={{ 
            backgroundImage: `linear-gradient(to right, ${bgColor}, ${color})` 
          }}
        />
        
        <CardHeader className="text-center pb-0 pt-8">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <div className="mt-3 flex items-baseline justify-center">
            <span
              className="text-4xl font-extrabold" 
              style={{ color: best ? undefined : bgColor }}
            >
              ${price}
            </span>
            <span className="ml-1 text-muted-foreground">{duration}</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {features.map((feature: string, index: number) => (
              <motion.li 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                viewport={{ once: true }}
                className="flex items-start gap-3"
              >
                <div className="mt-1">
                  <CheckCircle 
                    className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" 
                    style={{ color: best ? undefined : bgColor }}
                  />
                </div>
                <span className="text-muted-foreground text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
        
        <CardFooter className="pt-4 pb-8">
          <Button 
            onClick={() => onUpgrade(id)}
            variant={best ? "default" : "outline"}
            className="w-full group relative overflow-hidden"
            style={{ 
              ...(best ? { 
                backgroundImage: `linear-gradient(45deg, ${bgColor}, ${color})`,
                borderColor: "transparent"
              } : { 
                borderColor: `${bgColor}60`
              })
            }}
          >
            <span className="relative z-10">Choose {title}</span>
            <span 
              className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${best ? "from-primary to-primary/80" : `from-${bgColor} to-${color}`}`}
            />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PricingCard; 