import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '@/lib/store/chatStore';
import { ChatMessage } from '@/lib/types/chat';

export const useChatNavigation = () => {
  const router = useRouter();
  const { 
    activeSession, 
    recentSessions, 
    setSession, 
    updateSession,
    updateMessages
  } = useChatStore();

  /**
   * Start a new chat session
   * @param mode The chat mode ('agent' or 'default')
   * @param embedding_enabled Whether vector search is enabled
   * @param initialMessages Optional initial messages
   */
  const startNewChat = (
    mode: 'agent' | 'default' = 'default',
    embedding_enabled: boolean = false,
    prompt: string = ""
  ) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Create a new session in the store
    setSession({
      id,
      mode,
      embedding_enabled,
      title: 'New Chat',
      created_at: now,
      updated_at: now,
      isNewChat: true,
      prompt
    });
    
  
    // Navigate to the new chat
    router.push(`/chat/${id}`);
  };

  /**
   * Navigate to an existing chat session
   * @param id The ID of the conversation to navigate to
   */
  const navigateToChat = (id: string) => {
    // Find the session in recentSessions
    const existingSession = recentSessions.find(session => session.id === id);
    
    if (existingSession) {
      // If we have the session in recentSessions, create a full session object
      setSession({
        id,
        mode: 'default',
        embedding_enabled: false,
        created_at: existingSession.created_at,
        updated_at: existingSession.updated_at,
        isNewChat: false,
        title: existingSession.title
      });
    } else {
      // If the conversation doesn't exist in our store, create a placeholder
      const now = new Date().toISOString();
      // Create a placeholder session while we load
      setSession({
        id,
        mode: 'default',
        embedding_enabled: false,
        title: 'Loading...',
        created_at: now,
        updated_at: now,
        isNewChat: true
      });
    }
    
    // Navigate to the chat page
    router.push(`/chat/${id}`);
  };

  /**
   * Update the title of the current chat conversation
   * @param title The new title
   */
  const updateChatTitle = (title: string) => {
    if (activeSession) {
      updateSession({ title });
    }
  };

  return {
    activeSessionId: activeSession?.id,
    startNewChat,
    navigateToChat,
    updateChatTitle,
    currentSession: activeSession
  };
}; 