"use client";

import { useState, useEffect, useRef } from 'react';

// Types
interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  isComplete: boolean;
}

interface ConversationGroup {
  user: Message;
  ai: Message | null;
  isLatest: boolean;
}

export default function ChatBot() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentAIResponse, setCurrentAIResponse] = useState<string | null>(null);
  
  // UI state
  const [isTyping, setIsTyping] = useState(false);
  const [userScroll, setUserScroll] = useState(false);
  const [justScrolled, setJustScrolled] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // Sample AI responses to simulate streaming
  const aiResponses = [
    "Hello! How can I help you today?",
    "That's an interesting question. Let me think about it for a moment... Based on my understanding, the best approach would be to consider multiple factors before making a decision.",
    "I understand your concern. It's important to remember that technology is constantly evolving, and what works today might need adjustment tomorrow. Let's explore some options that could address your needs both in the short and long term.",
    "Great question! The concept you're asking about has several dimensions to it. First, we need to consider the technical aspects. Second, there are usability concerns to address. And finally, we should think about scalability for future growth."
  ];

  // Force scroll to bottom
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Simulate AI typing with streaming effect
  const simulateAIResponse = async () => {
    setIsTyping(true);
    
    // Select random response
    const responseIndex = Math.floor(Math.random() * aiResponses.length);
    const fullResponse = aiResponses[responseIndex];
    
    // Stream the response character by character
    setCurrentAIResponse('');
    for (let i = 0; i < fullResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setCurrentAIResponse(prev => prev + fullResponse[i]);
    }
    
    // Add completed message
    const newMessage: Message = {
      id: Date.now(),
      sender: 'ai',
      text: fullResponse,
      isComplete: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setCurrentAIResponse(null);
    setIsTyping(false);
    setJustScrolled(false);
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      isComplete: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setJustScrolled(true);
    
    // Ensure DOM is updated before scrolling
    await new Promise(resolve => setTimeout(resolve, 0));
    scrollToBottom();
    
    // Generate AI response
    simulateAIResponse();
  };

  // Handle scroll events to detect manual scrolling
  const handleScroll = () => {
    if (justScrolled) return;
    
    if (chatMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      // Using a smaller threshold of 20 pixels to ensure we detect when very close to bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 20;
      setUserScroll(!isNearBottom);
    }
  };

  // Auto-scroll on message changes
  useEffect(() => {
    const shouldAutoScroll = !isTyping && !userScroll && !justScrolled;
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, userScroll, justScrolled]);

  // Reset the justScrolled flag after a delay
  useEffect(() => {
    if (justScrolled) {
      const timer = setTimeout(() => setJustScrolled(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justScrolled]);

  // Group messages into conversation pairs
  const groupMessages = (): ConversationGroup[] => {
    const groups: ConversationGroup[] = [];
    let i = 0;
    
    while (i < messages.length) {
      if (messages[i].sender === 'user') {
        // Find AI response that follows
        const aiResponse = (i + 1 < messages.length && messages[i + 1].sender === 'ai') 
          ? messages[i + 1] 
          : null;
        
        // Check if this is the latest conversation
        const isLatest = i === messages.length - 1 || 
                        (aiResponse !== null && i + 1 === messages.length - 1);
        
        groups.push({
          user: messages[i],
          ai: aiResponse,
          isLatest
        });
        
        // Skip the AI message in next iteration if it exists
        i += aiResponse ? 2 : 1;
      } else {
        // Skip orphaned AI messages
        i++;
      }
    }
    
    return groups;
  };

  // Prepare data for rendering
  const conversationGroups = groupMessages();
  const hasCurrentResponse = currentAIResponse !== null && 
                           messages.length > 0 && 
                           messages[messages.length - 1].sender === 'user';

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={chatMessagesRef} onScroll={handleScroll}>
        <div className="conversation-container">
          {conversationGroups.map((group) => (
            <div 
              key={group.user.id} 
              className={`message-block ${group.isLatest ? 'current-block' : 'completed-block'}`}
            >
              <div className="block-content">
                {/* User message */}
                <div className="user-message">
                  <div className="message-content user">
                    {group.user.text}
                  </div>
                </div>
                
                {/* AI message or streaming response */}
                <div className="ai-message">
                  {group.isLatest && hasCurrentResponse && !group.ai ? (
                    <div className="message-content ai typing">
                      {currentAIResponse}
                    </div>
                  ) : group.ai ? (
                    <div className="message-content ai">
                      {group.ai.text}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={isTyping}
        />
        <button type="submit" disabled={isTyping || !inputValue.trim()}>
          Send
        </button>
      </form>
      
      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: white;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 10px;
          scroll-behavior: smooth;
        }
        
        .conversation-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          background-color: transparent;
        }
        
        .message-block {
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: transparent;
          padding: 5px 0;
          border-radius: 0;
          margin-bottom: 10px;
        }
        
        .block-content {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          justify-content: flex-start;
        }
        
        .completed-block {
          min-height: auto;
          height: auto;
        }
        
        .current-block {
          /* Always maintain 80vh height for latest conversation block */
          min-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        
        .current-block .block-content {
          align-items: stretch;
          justify-content: flex-start;
          flex-grow: 1;
        }
        
        .user-message {
          display: flex;
          justify-content: flex-end;
          padding: 10px;
          background-color: transparent;
          width: 100%;
          align-self: flex-start;
        }
        
        .ai-message {
          display: flex;
          justify-content: flex-start;
          padding: 10px;
          width: 100%;
          align-self: flex-start;
        }
        
        .current-block .ai-message {
          margin-top: 0;
        }
        
        .message-content {
          max-width: 80%;
          padding: 10px 0;
          word-wrap: break-word;
        }
        
        .message-content.user {
          color: #444;
          text-align: right;
        }
        
        .message-content.ai {
          color: #444;
          text-align: left;
        }
        
        .message-content.ai.typing::after {
          content: '▌';
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .chat-input {
          display: flex;
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
          position: sticky;
          bottom: 0;
          background-color: white;
          z-index: 2;
          padding-bottom: 10px;
        }
        
        .chat-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 16px;
          outline: none;
        }
        
        .chat-input button {
          margin-left: 10px;
          padding: 10px 20px;
          background-color: #0084ff;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .chat-input button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
