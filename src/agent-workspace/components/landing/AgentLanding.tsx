"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '@/context/ThemeProvider';
import { AIService } from '../../types';
import { AGENT_SERVICES } from '../../constants';
import { Send } from 'lucide-react';

interface AgentLandingProps {
  onFirstPrompt: (prompt: string, sessionId: string) => void;
}

const AgentLanding: React.FC<AgentLandingProps> = ({ onFirstPrompt }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedService, setSelectedService] = useState<AIService | null>(null);

  // Set Plugin Development as the default service
  useEffect(() => {
    const pluginService = AGENT_SERVICES.find(service => service.id === 'plugins');
    if (pluginService) {
      setSelectedService(pluginService);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // Generate a new session ID
      const sessionId = uuidv4();
      onFirstPrompt(prompt, sessionId);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen max-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">Welcome to WP.AI Workspace</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Your intelligent WordPress development assistant</p>
          </div>

          {/* Services Section - Horizontally Scrollable */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-5 flex items-center">
              <span className="mr-2">🚀</span>
              Choose a Service
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
            </h2>
            
            <div className="overflow-x-auto pb-2 no-scrollbar">
              <div className="flex space-x-4">
                {AGENT_SERVICES.map((service) => {
                  // Dynamically create the icon element
                  const IconComponent = service.icon;
                  
                  return (
                    <div
                      key={service.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] flex-shrink-0 w-56
                        ${selectedService?.id === service.id 
                          ? `ring-2 ring-offset-1 shadow-md ${isDark ? 'ring-blue-500 bg-gray-800' : 'ring-blue-600 bg-white'}` 
                          : isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-100 shadow'
                        }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start">
                        <div 
                          className={`w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br ${service.color}`}
                        >
                          {IconComponent && <IconComponent size={16} className="text-white" />}
                        </div>
                        <div className="ml-2 flex-1">
                          <h3 className="font-medium text-sm">{service.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Input Form - Fixed Position */}
          <form onSubmit={handleSubmit} className="sticky bottom-4">
            <div>
              <label htmlFor="prompt" className="block text-xl font-medium mb-3 flex items-center">
                <span className="mr-2">💬</span>
                What would you like help with today?
              </label>
              <div>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  className={`w-full rounded-lg p-4 text-base ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 text-white' 
                      : 'bg-white border-gray-300 focus:border-blue-600 text-gray-900'
                  } border-2 focus:ring-2 focus:ring-blue-500 outline-none shadow-md resize-none`}
                  placeholder="Enter your question or request (e.g., 'Help me create a custom WordPress plugin for a contact form')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    // Submit on Enter without Shift
                    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  required
                />
              </div>
              
             
              
              <div className={`mt-3 flex ${selectedService ? 'justify-between' : 'justify-end'}`}>
                {selectedService && (
                  <div className={`rounded-lg ${isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                    <p className="text-sm">
                      <span className="font-medium">Selected service:</span> {selectedService.title}
                    </p>
                    {selectedService.example && (
                      <p className="text-xs mt-1 italic">
                        Example: "{selectedService.example}"
                      </p>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02] ${
                    prompt.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-lg'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  <span>Send</span>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
          
          {/* Bottom slogan */}
          <div className="text-center mt-12 mb-6">
            <p className={`text-base italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              "Building WordPress solutions with the power of AI"
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <footer className={`py-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Powered by WP.AI - Your intelligent WordPress development assistant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AgentLanding; 