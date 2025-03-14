import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { ChatMessage } from '@/lib/types/chat';

// Simplified session structure - we only maintain one session
interface ChatSession {
  id: string;
  mode: 'agent' | 'default';
  embedding_enabled: boolean;
  title: string;
  created_at: string;
  updated_at: string;
  isNewChat?: boolean;
  prompt?: string;
}

// Define the structure for recent session summaries
interface ChatConversationSummary {
  id: string;
  title: string;
  conversation_type?: string;
  mode?: 'agent' | 'default';
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    role: string;
    created_at: string;
  };
  message_count: number;
}

// Simplified state with just one active session
interface ChatState {
  // The single active session
  activeSession: ChatSession | null;
  // Recent sessions list (just metadata, not full messages)
  recentSessions: ChatConversationSummary[];
  
  // Actions
  setSession: (session: ChatSession) => void;
  updateSession: (sessionData: Partial<ChatSession>) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessages: (messages: ChatMessage[]) => void;
  clearSession: () => void;
  setRecentSessions: (sessions: ChatConversationSummary[]) => void;
}

// Create a default empty session
const createEmptySession = (id: string): ChatSession => {
  const now = new Date().toISOString();
  return {
    id,
    mode: 'default',
    embedding_enabled: false,
    title: 'New Chat',
    created_at: now,
    updated_at: now,
    isNewChat: false,
    prompt: ''
  };
};

// Custom storage implementation that ensures immediate updates
const customStorage: PersistStorage<Pick<ChatState, 'activeSession' | 'recentSessions'>> = {
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const value = localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      localStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

// Function to manually update localStorage with current state
const updateLocalStorage = (state: Pick<ChatState, 'activeSession' | 'recentSessions'>) => {
  // Only access localStorage in browser environment
  if (typeof window === 'undefined') return;
  
  try {
    // First, try to get existing data from localStorage
    let existingData: any = {};
    try {
      const storedData = localStorage.getItem('chat-store');
      if (storedData) {
        existingData = JSON.parse(storedData);
      }
    } catch (e) {
      console.error('Error reading existing localStorage data:', e);
    }
    
    // Prepare the data to store (similar to partialize)
    let storeData: any = { 
      ...existingData,
      state: {
        ...existingData.state,
        recentSessions: state.recentSessions as ChatConversationSummary[],
        activeSession: null
      }
    };
    
    if (state.activeSession) {
      // Always update timestamp when saving
      const now = new Date().toISOString();
      
      storeData.state.activeSession = {
        ...state.activeSession,
        updated_at: now,
      };
      
      console.log('Storing session with isNewChat:', state.activeSession.isNewChat);
    }
    
    // Store in localStorage
    localStorage.setItem('chat-store', JSON.stringify(storeData));
    console.log('localStorage updated:', storeData);
  } catch (error) {
    console.error('Error updating localStorage:', error);
  }
};

// Custom middleware to ensure localStorage is updated on every state change
const withLocalStorageSync = (config: (set: any, get: any, api: any) => any) => 
  (set: any, get: any, api: any) => {
  const originalSet = set;
  
  // Override the set function to always update localStorage
  const newSet = (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>), replace?: boolean) => {
    // Call the original set function
    const result = originalSet(partial, replace);
    
    // Use requestAnimationFrame to ensure we're not updating during render
    // This schedules the update for after the current render cycle
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const state = get();
        updateLocalStorage({
          activeSession: state.activeSession,
          recentSessions: state.recentSessions
        });
      });
    }
    
    return result;
  };
  
  return config(newSet, get, api);
};

export const useChatStore = create<ChatState>()(
  persist(
    withLocalStorageSync((set: any, get: any) => ({
      activeSession: null,
      recentSessions: [],
      
      setSession: (session: ChatSession) => {
        const now = new Date().toISOString();
        const updatedSession = {
          ...session,
          updated_at: now
        };
        
        set({ activeSession: updatedSession });
      },
      
      updateSession: (sessionData: Partial<ChatSession>) => {
        set((state: ChatState) => {
          if (!state.activeSession) return state;
          
          const now = new Date().toISOString();
          const updatedSession = {
            ...state.activeSession,
            ...sessionData,
            updated_at: now
          };
          
          return { activeSession: updatedSession };
        });
      },
      
      // These message functions no longer store messages in the session
      // They should be implemented elsewhere to handle messages
      addMessage: (message: ChatMessage) => {
        set((state: ChatState) => {
          if (!state.activeSession) return state;
          
          const now = new Date().toISOString();
          const updatedSession = {
            ...state.activeSession,
            updated_at: now,
            // Set isNewChat to false when messages are added
            isNewChat: false
          };
          
          return { activeSession: updatedSession };
        });
      },
      
      updateMessages: (messages: ChatMessage[]) => {
        set((state: ChatState) => {
          if (!state.activeSession) return state;
          
          const now = new Date().toISOString();
          const updatedSession = {
            ...state.activeSession,
            updated_at: now,
            // Set isNewChat to false when messages are updated
            isNewChat: messages.length > 0 ? false : state.activeSession.isNewChat
          };
          
          return { activeSession: updatedSession };
        });
      },
      
      clearSession: () => {
        set({ activeSession: null });
      },
      
      setRecentSessions: (sessions: ChatConversationSummary[]) => {
        set({ recentSessions: sessions });
      },
    })),
    {
      name: 'chat-store',
      // Only store the active session and recent sessions list
      partialize: (state: ChatState): Pick<ChatState, 'activeSession' | 'recentSessions'> => {
        if (!state.activeSession) return { activeSession: null, recentSessions: state.recentSessions };
        
        // Always ensure updated_at is current when saving to localStorage
        const now = new Date().toISOString();
        
        const result = {
          activeSession: {
            ...state.activeSession,
            updated_at: now,
          },
          recentSessions: state.recentSessions
        };
        
        // For debugging
        console.log('partialize called, storing:', result);
        console.log('isNewChat value:', state.activeSession.isNewChat);
        
        return result;
      },
      storage: customStorage,
      // Add onRehydrateStorage to debug persistence issues
      onRehydrateStorage: (state) => {
        return (rehydratedState, error) => {
          if (error) {
            console.error('Error rehydrating state:', error);
          } else {
            console.log('State rehydrated successfully:', rehydratedState);
            
            // If we have a rehydrated state but no active session, try to recover it
            if (rehydratedState && !rehydratedState.activeSession) {
              console.log('No active session after rehydration, checking localStorage directly');
              
              try {
                // Check if we're in a browser environment before accessing localStorage
                if (typeof window !== 'undefined') {
                  const storedData = localStorage.getItem('chat-store');
                  if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    if (parsedData.state && parsedData.state.activeSession) {
                      console.log('Found session in localStorage:', parsedData.state.activeSession);
                      
                      // Use setTimeout to ensure this runs after rehydration is complete
                      setTimeout(() => {
                        useChatStore.setState({ 
                          activeSession: parsedData.state.activeSession 
                        });
                      }, 0);
                    }
                  }
                }
              } catch (error) {
                console.error('Error recovering session from localStorage:', error);
              }
            }
          }
        };
      },
    }
  )
);

// Helper function to get the current session
export const useActiveSession = () => {
  return useChatStore(state => state.activeSession);
};

// Helper function to get a session by ID (now just checks if ID matches active session)
export const useSessionById = (id: string) => {
  const activeSession = useChatStore(state => state.activeSession);
  
  // If we have an active session with the matching ID, return it
  if (activeSession && activeSession.id === id) {
    return activeSession;
  }
  
  // Only access localStorage on the client side
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const storedData = localStorage.getItem('chat-store');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.state && 
            parsedData.state.activeSession && 
            parsedData.state.activeSession.id === id) {
          // We found a matching session in localStorage, return it without setting
          return parsedData.state.activeSession;
        }
      }
    } catch (error) {
      console.error('Error checking localStorage for session:', error);
    }
  }
  
  // If we still don't have a session, create a new one but don't set it yet
  return createEmptySession(id);
}; 