"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeProvider';
import { AGENT_SERVICES } from '../../constants';
import { Send } from 'lucide-react';

interface AgentLandingProps {
  onFirstPrompt: (prompt: string, sessionId?: string) => void;
}

const AgentLanding: React.FC<AgentLandingProps> = ({ onFirstPrompt }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedService, setSelectedService] = useState<AIService | null>(null);
  const [placeholderText, setPlaceholderText] = useState("Enter your question or request (e.g., 'Help me create a custom WordPress plugin for a contact form')");

  // Set Plugin Development as the default service
  useEffect(() => {
    const pluginService = AGENT_SERVICES.find(service => service.id === 'plugins');
    if (pluginService) {
      setSelectedService(pluginService);
      setPlaceholderText(pluginService.example || placeholderText);
    }
  }, []);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    // Update the placeholder text with the example from the selected service
    if (service.example) {
      setPlaceholderText(service.example);
    }
    // You could also pre-fill the prompt with a template based on the service
    // setPrompt(`Help me with ${service.title.toLowerCase()}: `);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // Include the selected service in the prompt for context, but don't restrict future prompts
      let fullPrompt = prompt;
      if (selectedService) {
        // Add service context only if it's not already mentioned in the prompt
        if (!prompt.toLowerCase().includes(selectedService.title.toLowerCase())) {
          fullPrompt = `[Task: ${selectedService.title}] ${prompt}`;
        }
      }
      onFirstPrompt(fullPrompt);
    }
  };

  return (
    <div className={`flex flex-col h-screen min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col h-full">
          <div className="text-center mb-14 pt-4">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">Welcome to WP.AI Workspace</h1>
            <p className="text-xl font-medium text-gray-700 dark:text-gray-200 mt-3">Your intelligent WordPress development assistant</p>
          </div>

          {/* Services Section - Horizontally Scrollable */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-5 flex items-center">
              <span className="mr-2">🚀</span>
              Choose a Task Type
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">(Optional - helps provide context)</span>
            </h2>
            
            <div className="overflow-x-auto py-2 custom-scrollbar-x">
              <div className="flex space-x-4 pb-1">
                {AGENT_SERVICES.map((service) => {
                  // Dynamically create the icon element
                  const IconComponent = service.icon;
                  
                  return (
                    <div
                      key={service.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] flex-shrink-0 w-56
                        ${selectedService?.id === service.id 
                          ? `ring-2 ring-offset-2 shadow-lg ${isDark ? 'ring-blue-500 bg-gray-800' : 'ring-blue-600 bg-white'}` 
                          : isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-100 shadow-md'
                        }`}
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex items-start">
                        <div 
                          className={`w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br ${service.color}`}
                        >
                          {IconComponent && <IconComponent size={18} className="text-white" />}
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="font-medium text-sm">{service.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mb-10">
            <div>
              <label htmlFor="prompt" className="block text-xl font-medium mb-2 flex items-center">
                <span className="mr-2">💬</span>
                What would you like help with today?
              </label>
              <div className="shadow-md rounded-lg">
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  className={`w-full rounded-lg p-5 text-base ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 focus:border-blue-500 text-white' 
                      : 'bg-white border-gray-300 focus:border-blue-600 text-gray-900'
                  } border-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all duration-200`}
                  placeholder={placeholderText}
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
              
                  
              
              <div className={`mt-6 flex ${selectedService ? 'justify-between' : 'justify-end'} items-center`}>
                {selectedService && (
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                    <p className="text-sm">
                      <span className="font-medium">Selected task:</span> {selectedService.title}
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
                  className={`px-8 py-4 rounded-lg font-medium flex items-center transition-all duration-200 transform hover:scale-[1.03] ${
                    prompt.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-xl'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">Send</span>
                  <Send size={20} className="ml-3" />
                </button>
              </div>
            </div>
          </form>
      </div>

      <div className="text-center mt-auto mb-4">  
        <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          "Building WordPress solutions with the power of AI"
        </p>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#cbd5e1'};
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#94a3b8'};
        }
        
        .custom-scrollbar-x::-webkit-scrollbar {
          height: 6px;
        }
        
        .custom-scrollbar-x::-webkit-scrollbar-track {
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border-radius: 10px;
        }
        
        .custom-scrollbar-x::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#cbd5e1'};
          border-radius: 10px;
        }
        
        .custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#94a3b8'};
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <footer className={`py-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto text-center">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Powered by WP.AI - Your intelligent WordPress development assistant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AgentLanding; 