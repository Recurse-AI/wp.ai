import React, { useState, useEffect } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { MessageSquare, Bot, Zap, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { Card, CardContent } from "@/components/ui/card";
import { ChatBotSectionProps } from "./types";

const ChatBotSection: React.FC<ChatBotSectionProps> = ({ onChatOpen }) => {
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  
  // Only enable animations after component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: prefersReducedMotion ? 0 : -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        delay: custom * 0.2
      }
    })
  };
  
  return (
    <section 
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 sm:px-6" 
      id="chatbot"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate={isInView && isMounted ? "visible" : "hidden"}
            variants={containerVariants}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
            <Card className={`relative border-0 overflow-hidden ${theme === "dark" ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-sm shadow-xl rounded-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl`}>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Enhanced Header */}
                  <div className={`w-full py-3 px-4 ${theme === "dark" ? "bg-gray-700/80" : "bg-blue-50"} border-b ${theme === "dark" ? "border-gray-600" : "border-blue-100"} rounded-t-xl flex items-center justify-between`}>
                    <div className="flex items-center">
                      <div className="flex space-x-2 mr-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-2">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="text-gray-800 dark:text-gray-100 font-medium">WP.ai Chat Assistant</div>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${theme === "dark" ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"} flex items-center`}>
                      <Sparkles size={10} className="mr-1" />
                      <span>WordPress Expert</span>
                    </div>
                  </div>
                  
                  {/* Chat Messages - Only animate if in view and not reduced motion */}
                  <div className={`flex flex-col space-y-4 p-6 ${theme === "dark" ? "bg-gray-800/80" : "bg-gray-50/80"}`}>
                    <motion.div 
                      custom={0}
                      variants={messageVariants}
                      className="flex items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div className="ml-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200 dark:border-blue-900/40 px-4 py-3 rounded-r-xl rounded-bl-xl max-w-[85%] shadow-md">
                        <p className="text-gray-800 dark:text-gray-200">Hello! I'm your WordPress AI assistant. How can I help optimize your site today?</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      custom={1}
                      variants={messageVariants}
                      className="flex items-start justify-end"
                    >
                      <div className="mr-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 px-4 py-3 rounded-l-xl rounded-br-xl max-w-[85%] shadow-md border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-800 dark:text-gray-200">I need to improve my site's loading speed. Can you help?</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      custom={2}
                      variants={messageVariants}
                      className="flex items-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div className="ml-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200 dark:border-blue-900/40 px-4 py-3 rounded-r-xl rounded-bl-xl max-w-[85%] shadow-md">
                        <p className="text-gray-800 dark:text-gray-200">Absolutely! I've analyzed your site and found that optimizing your images and enabling browser caching could improve your speed by 45%. Would you like me to help implement these changes?</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Image Optimization</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Browser Caching</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">+45% Speed</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Enhanced Input Area */}
                  <div className={`border-t ${theme === "dark" ? "border-gray-700 bg-gray-800/90" : "border-gray-200 bg-white"} p-4 rounded-b-xl`}>
                    <div className="flex items-center">
                      <div className={`flex-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"} rounded-full px-4 py-3 flex items-center`}>
                        <input 
                          type="text" 
                          placeholder="Ask about WordPress..." 
                          className={`bg-transparent border-none outline-none w-full ${theme === "dark" ? "text-gray-200 placeholder:text-gray-400" : "text-gray-700 placeholder:text-gray-400"}`}
                          disabled
                        />
                        <Button size="sm" variant="ghost" className="mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Sparkles size={16} />
                        </Button>
                      </div>
                      <Button size="icon" className="ml-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md">
                        <Send size={16} className="text-white" />
                      </Button>
                    </div>
                    <div className="mt-2 text-center">
                      <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        Powered by advanced WordPress AI technology
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Chat with Our AI WordPress Expert
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Get instant answers to all your WordPress questions, troubleshoot issues, and receive personalized optimization recommendations in real-time.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Zap className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Real-time Assistance</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Get immediate answers and solutions to your WordPress challenges.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Smart Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Receive AI-powered suggestions tailored to your specific WordPress setup.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="text-pink-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">24/7 Support</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Our AI assistant is available around the clock to help with any WordPress issue.</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onChatOpen}
              className="mt-6 px-8 py-4 text-white text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg flex items-center gap-2"
            >
              <MessageSquare size={20} /> Start Chatting Now
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChatBotSection; 