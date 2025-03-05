import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { Card, CardContent } from "@/components/ui/card";
import { ChatBotSectionProps } from "./types";

const ChatBotSection: React.FC<ChatBotSectionProps> = ({ onChatOpen }) => {
  const { theme } = useTheme();
  
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6" id="chatbot">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30" />
            <Card className={`relative border-0 overflow-hidden ${theme === "dark" ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-sm shadow-xl`}>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col space-y-6">
                  <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="ml-4 text-gray-800 dark:text-gray-200 font-medium">WP.ai Chat Assistant</div>
                  </div>
                  
                  <div className="flex flex-col space-y-4 py-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div className="ml-3 bg-blue-100 dark:bg-blue-900/40 px-4 py-2 rounded-r-lg rounded-bl-lg max-w-[80%]">
                        <p className="text-gray-800 dark:text-gray-200">Hello! I'm your WordPress AI assistant. How can I help optimize your site today?</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-end">
                      <div className="mr-3 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-l-lg rounded-br-lg max-w-[80%]">
                        <p className="text-gray-800 dark:text-gray-200">I need to improve my site's loading speed. Can you help?</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={16} className="text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div className="ml-3 bg-blue-100 dark:bg-blue-900/40 px-4 py-2 rounded-r-lg rounded-bl-lg max-w-[80%]">
                        <p className="text-gray-800 dark:text-gray-200">Absolutely! I've analyzed your site and found that optimizing your images and enabling browser caching could improve your speed by 45%. Would you like me to help implement these changes?</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                        <p className="text-gray-400">Chat with our AI assistant...</p>
                      </div>
                      <Button size="icon" className="ml-2 rounded-full bg-blue-600 hover:bg-blue-700">
                        <Zap size={18} className="text-white" />
                      </Button>
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