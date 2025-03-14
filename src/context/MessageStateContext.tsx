import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define types for streaming message state
interface MessageStreamingState {
  showWebSearch: boolean;
  webSearchComplete: boolean;
  showThinking: boolean;
  thinkingComplete: boolean;
  showAIResponse: boolean;
  responseComplete: boolean;
  currentPhase: 'search' | 'thinking' | 'response' | 'complete';
  hasWebSearchResults: boolean;
  hasThinkingContent: boolean;
  id: string;
}

// Context interface
interface StreamingContextType {
  // Message streaming state
  messageState: MessageStreamingState | null;
  
  // Methods to initialize and update streaming state
  initializeMessageStreaming: (hasWebSearch: boolean, hasThinking: boolean) => void;
  completeWebSearch: () => void;
  completeThinking: () => void;
  completeAIResponse: () => void;
  
  // Helper methods
  resetStreaming: () => void;
  id: string;
  setId: (id: string) => void;
  currentPhase: 'search' | 'thinking' | 'response' | 'complete';
  
  // Streaming state indicator
  isStreaming: boolean;
}

// Default context state
const defaultContextValue: StreamingContextType = {
  messageState: null,
  initializeMessageStreaming: () => {},
  completeWebSearch: () => {},
  completeThinking: () => {},
  completeAIResponse: () => {},
  resetStreaming: () => { },
  id: '',
  setId: () => { },
  currentPhase: 'search',
  isStreaming: false
};

// Create the context
const MessageStateContext = createContext<StreamingContextType>(defaultContextValue);

// Default state for a new message
const createDefaultMessageState = (
  hasWebSearch: boolean, 
  hasThinking: boolean,
): MessageStreamingState => ({
  id: '',
  showWebSearch: hasWebSearch,
  webSearchComplete: false,
  showThinking: false, // Start hidden, shown after web search completes
  thinkingComplete: false,
  showAIResponse: false, // Start hidden, shown after thinking completes
  responseComplete: false,
  currentPhase: hasWebSearch ? 'search' : hasThinking ? 'thinking' : 'response',
  hasWebSearchResults: hasWebSearch,
  hasThinkingContent: hasThinking,
});

// Provider component
export const StreamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messageState, setMessageState] = useState<MessageStreamingState | null>(null);
  const [id, setId] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<MessageStreamingState['currentPhase']>('search');

  // Reset streaming state
  const resetStreaming = useCallback(() => {
    setMessageState(null);
    setCurrentPhase('search');
    setId('');
  }, []);

  // Initialize streaming for a new message
  const initializeMessageStreaming = useCallback((
    hasWebSearch: boolean, 
    hasThinking: boolean,
  ) => {
    console.log(`Initializing streaming:`, { hasWebSearch, hasThinking });

    const initialPhase = hasWebSearch ? 'search' : hasThinking ? 'thinking' : 'response';
    
    const newState = createDefaultMessageState(hasWebSearch, hasThinking);
    
    // Skip directly to response if there's no web search or thinking
    if (!hasWebSearch && !hasThinking) {
      newState.showAIResponse = true;
      newState.currentPhase = 'response';
    }
    
    setMessageState(newState);
    setCurrentPhase(newState.currentPhase);
    
    // Dispatch an event to notify components that streaming has started
    const event = new CustomEvent('streamingStarted', {
      bubbles: true,
      detail: { phase: initialPhase }
    });
    document.dispatchEvent(event);
    
    // If there's no web search or thinking, immediately go to response phase
    if (!hasWebSearch && !hasThinking) {
      const responseReadyEvent = new CustomEvent('aiResponseReady', { 
        bubbles: true,
        detail: { complete: true }
      });
      document.dispatchEvent(responseReadyEvent);
    }
  }, []);

  // Complete web search phase and transition to thinking
  const completeWebSearch = useCallback(() => {
    console.log(`Completing web search`);
    
    // Determine next phase outside of setMessageState
    let nextPhase: MessageStreamingState['currentPhase'] = 'thinking';
    
    setMessageState(prevState => {
      if (!prevState) {
        console.warn(`No message state found in completeWebSearch`);
        return prevState;
      }

      // Update the state to complete web search and start thinking if available
      nextPhase = prevState.hasThinkingContent ? 'thinking' : 'response';
      
      const updatedState: MessageStreamingState = {
        ...prevState,
        webSearchComplete: true,
        showThinking: prevState.hasThinkingContent,
        currentPhase: nextPhase,
        showAIResponse: !prevState.hasThinkingContent // Skip to response if no thinking
      };
      
      console.log(`Transitioning from search to ${updatedState.currentPhase}`);
      
      return updatedState;
    });
    
    // Update currentPhase outside the callback so it runs even if messageState is null
    console.log(`Setting currentPhase to ${nextPhase}`);
    setCurrentPhase(nextPhase);
    
    // Move event dispatching outside the render cycle with setTimeout
    setTimeout(() => {
      // Dispatch event for web search completion
      const event = new CustomEvent('webSearchComplete', {
        bubbles: true,
        detail: {}
      });
      document.dispatchEvent(event);
      
      // If there's no thinking content in the message state, also trigger AI response ready
      if (messageState && !messageState.hasThinkingContent) {
        setTimeout(() => {
          const responseReadyEvent = new CustomEvent('aiResponseReady', { 
            bubbles: true,
            detail: { complete: true }
          });
          document.dispatchEvent(responseReadyEvent);
        }, 300);
      }
    }, 0);
  }, [messageState]);

  // Complete thinking phase and transition to AI response
  const completeThinking = useCallback(() => {
    console.log(`Completing thinking`);
    
    setMessageState(prevState => {
      if (!prevState) {
        console.warn(`No message state found in completeThinking`);
        return prevState;
      }

      // Update the state to complete thinking and start AI response
      const updatedState: MessageStreamingState = {
        ...prevState,
        thinkingComplete: true,
        showAIResponse: true,
        currentPhase: 'response'
      };
      
      console.log(`Transitioning from thinking to response`);
      
      return updatedState;
    });
    
    // Update currentPhase outside the callback so it runs even if messageState is null
    console.log(`Setting currentPhase to response`);
    setCurrentPhase('response');
    
    // Move event dispatching outside the render cycle with setTimeout
    setTimeout(() => {
      // Dispatch event for thinking completion
      const event = new CustomEvent('thinkingComplete', {
        bubbles: true,
        detail: {}
      });
      document.dispatchEvent(event);
      
      // Also trigger AI response ready
      setTimeout(() => {
        const responseReadyEvent = new CustomEvent('aiResponseReady', { 
          bubbles: true,
          detail: { complete: true }
        });
        document.dispatchEvent(responseReadyEvent);
      }, 300);
    }, 0);
  }, []);

  // Complete AI response phase
  const completeAIResponse = useCallback(() => {
    console.log(`Completing AI response`);
    
    setMessageState(prevState => {
      if (!prevState) {
        console.warn(`No message state found in completeAIResponse`);
        return prevState;
      }

      // Update the state to complete AI response
      const updatedState: MessageStreamingState = {
        ...prevState,
        responseComplete: true,
        currentPhase: 'complete'
      };
      
      console.log(`Transitioning from response to complete`);
      
      return updatedState;
    });
    
    // Update currentPhase outside the callback so it runs even if messageState is null
    console.log(`Setting currentPhase to complete`);
    setCurrentPhase('complete');
    
    // Move event dispatching outside the render cycle
    setTimeout(() => {
      // Dispatch event for response completion
      const event = new CustomEvent('responseComplete', {
        bubbles: true,
        detail: {}
      });
      document.dispatchEvent(event);
      
      // Reset streaming state after a short delay to allow animations to complete
      setTimeout(() => {
        resetStreaming();
        setId('');
      }, 500);
    }, 0);
  }, [resetStreaming, setId]);

  // Listen for events from components to track phase transitions
  useEffect(() => {
    // This handles events dispatched by the components when phases complete
    const handleSearchStreamComplete = () => {
      if (messageState && messageState.currentPhase === 'search') {
        completeWebSearch();
      }
    };
    
    const handleThinkingStreamComplete = () => {
      if (messageState && messageState.currentPhase === 'thinking') {
        completeThinking();
      }
    };
    
    const handleResponseComplete = () => {
      if (messageState && messageState.currentPhase === 'response') {
        completeAIResponse();
      }
    };
    
    // Add event listeners
    document.addEventListener('searchStreamComplete', handleSearchStreamComplete);
    document.addEventListener('thinkingStreamComplete', handleThinkingStreamComplete);
    document.addEventListener('aiResponseComplete', handleResponseComplete);
    
    // Clean up listeners
    return () => {
      document.removeEventListener('searchStreamComplete', handleSearchStreamComplete);
      document.removeEventListener('thinkingStreamComplete', handleThinkingStreamComplete);
      document.removeEventListener('aiResponseComplete', handleResponseComplete);
    };
  }, [messageState, completeWebSearch, completeThinking, completeAIResponse]);


  const contextValue: StreamingContextType = {
    currentPhase,
    messageState,
    initializeMessageStreaming,
    completeWebSearch,
    completeThinking,
    completeAIResponse,
    resetStreaming,
    id,
    setId,
    isStreaming: !!messageState
  };

  return (
    <MessageStateContext.Provider value={contextValue}>
      {children}
    </MessageStateContext.Provider>
  );
};

// Custom hook to use the streaming context
export const useStreaming = () => useContext(MessageStateContext);

export default MessageStateContext; 