'use client'
import React, { useState, useRef, useEffect } from 'react';

const SmoothScrollChat = () => {
  // Sample initial messages (newest first)
  const [messages, setMessages] = useState([
    { id: 4, text: "What seems to be the problem?", sender: "user" },
    { id: 3, text: "I'm having trouble with my account", sender: "ai" },
    { id: 2, text: "Hi! How can I help you today?", sender: "user" },
    { id: 1, text: "Hello there!", sender: "ai" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [newMessageInProgress, setNewMessageInProgress] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(5);
  const [showOldMessages, setShowOldMessages] = useState(false);

  // Handle scrolling to show old messages
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      
      // When scrolling down sufficiently (higher scrollTop value), show old messages
      if (scrollTop > 150 && !showOldMessages) {
        setShowOldMessages(true);
      }
      
      // When scrolling back to top, hide old messages again
      if (scrollTop < 50 && showOldMessages) {
        setShowOldMessages(false);
      }
    }
  };

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() === '' || newMessageInProgress || aiTyping) return;
    
    // Mark that we're in the middle of a new message transition
    setNewMessageInProgress(true);
    setShowOldMessages(false);
    
    // Create the new user message
    const newMessage = {
      id: nextMessageId.current++,
      text: inputValue,
      sender: "user",
      isNew: true
    };
    
    // Start the scroll animation for existing messages
    if (chatContainerRef.current) {
      const messageElements = chatContainerRef.current.querySelectorAll('.message');
      messageElements.forEach(el => {
        (el as HTMLElement).style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        (el as HTMLElement).style.transform = 'translateY(-100%)';
        (el as HTMLElement).style.opacity = '0';
      });
    }
    
    // After animation completes, update messages
    setTimeout(() => {
      setMessages(prev => [newMessage, ...prev.map(msg => ({
        ...msg,
        isNew: false
      }))]);
      setInputValue('');
      setNewMessageInProgress(false);
      
      // Simulate AI response after a short delay
      setAiTyping(true);
      setTimeout(() => {
        const aiResponse = {
          id: nextMessageId.current++,
          text: "I understand your concern. Let me help you with that.",
          sender: "ai",
          isNew: true
        };
        setMessages(prev => [aiResponse, ...prev]);
        setAiTyping(false);
      }, 1500);
    }, 500);
  };

  return (
    <div className="chat-interface" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      width: '400px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
      background: '#f5f5f5'
    }}>
      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="messages-container"
        onScroll={handleScroll}
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* AI typing indicator */}
        {aiTyping && (
          <div
            className="message ai typing"
            style={{
              alignSelf: 'flex-start',
              padding: '15px 20px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '4px',
              marginBottom: '12px'
            }}
          >
            <span className="dot" style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#aaa',
              borderRadius: '50%',
              animation: 'typing 1s infinite'
            }}></span>
            <span className="dot" style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#aaa',
              borderRadius: '50%',
              animation: 'typing 1s infinite 0.2s'
            }}></span>
            <span className="dot" style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#aaa',
              borderRadius: '50%',
              animation: 'typing 1s infinite 0.4s'
            }}></span>
            <style jsx>{`
              @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
              }
            `}</style>
          </div>
        )}
        
        {/* Messages are rendered newest first at the top */}
        {messages.map((msg, index) => {
          // Only show first two messages or if showOldMessages is true
          const isVisible = msg.isNew || index < 2 || showOldMessages;
          
          return (
            <div
              key={msg.id}
              className={`message ${msg.sender} ${msg.isNew ? 'new' : ''}`}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '10px 16px',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.sender === 'user' ? '#2b5df0' : 'white',
                color: msg.sender === 'user' ? 'white' : 'black',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                wordBreak: 'break-word',
                opacity: isVisible ? 1 : 0,
                maxHeight: isVisible ? '500px' : '0',
                padding: isVisible ? '10px 16px' : '0',
                margin: isVisible ? '0 0 8px 0' : '0',
                overflow: 'hidden',
                transition: 'opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease'
              }}
            >
              {msg.text}
            </div>
          );
        })}
        
        {/* Scroll indicator when there are hidden messages */}
        {!showOldMessages && messages.length > 2 && (
          <div 
            style={{
              textAlign: 'center',
              padding: '8px',
              color: '#2b5df0',
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: 'auto'
            }}
            onClick={() => setShowOldMessages(true)}
          >
            Scroll down to see previous messages ▼
          </div>
        )}
      </div>
      
      {/* Message input form at the BOTTOM */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          padding: '12px 16px',
          borderTop: '1px solid #e5e5e5',
          background: 'white'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={newMessageInProgress || aiTyping}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          disabled={newMessageInProgress || aiTyping}
          style={{
            marginLeft: '8px',
            padding: '0 16px',
            height: '42px',
            borderRadius: '24px',
            backgroundColor: '#2b5df0',
            color: 'white',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: newMessageInProgress || aiTyping ? 'not-allowed' : 'pointer',
            opacity: newMessageInProgress || aiTyping ? 0.7 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default SmoothScrollChat;