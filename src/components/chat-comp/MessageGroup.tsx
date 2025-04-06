import React, { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "@/context/ThemeProvider";
import "@fontsource/inter";
import "./MessageGroup.css";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import { MessageGroup as MessageGroupType } from "@/lib/types/chat";
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { useChatSocket } from "@/context/ChatSocketContext";
import ResultsPanel from "@/components/ResultsPanel";
import { Database, Search, ExternalLink, Clipboard, CheckCircle, Cpu } from "lucide-react";
import LoadingDots from "@/components/chat-comp/LoadingDots";

interface MessageGroupProps {
  messageGroup: MessageGroupType;
  onRegenerateMessage?: () => Promise<void>;
  isLatestMessage?: boolean;
}

const MessageGroup = ({ 
  messageGroup, 
  onRegenerateMessage,
  isLatestMessage = false,
}: MessageGroupProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const responseContainerRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  const { isLoading, responseWorkflowMaintainState } = useChatSocket();

  

  const { theme } = useTheme();

  // Check if this message group is the one currently being processed
  const isCurrentStreaming = useMemo(() => 
    isLoading && isLatestMessage && 
    (responseWorkflowMaintainState.message_group_id === messageGroup.id ||
     (!responseWorkflowMaintainState.message_group_id && isLatestMessage)),
    [isLoading, isLatestMessage, responseWorkflowMaintainState.message_group_id, messageGroup.id]
  );

  // Memoize message properties
  const hasUserContent = useMemo(() => 
    Boolean(messageGroup.user_content?.trim()),
    [messageGroup.user_content]
  );
  
  const hasAIContent = useMemo(() => {
    if(isLatestMessage) { 
      if(responseWorkflowMaintainState.ai_content && responseWorkflowMaintainState.ai_content.trim().length > 0) {
        return true;
      }
      return false;
    }
    return Boolean(messageGroup.ai_content?.trim());
  }, [messageGroup.ai_content, isLatestMessage, responseWorkflowMaintainState.ai_content]);
  
  // If streaming, get search results from responseWorkflowMaintainState
  const searchResults = useMemo(() => {
    if (responseWorkflowMaintainState.web_search.results?.length > 0) {
      return responseWorkflowMaintainState.web_search.results;
    }
    return messageGroup.search_results;
  }, [responseWorkflowMaintainState.web_search.results, messageGroup.search_results]);
  
  // If streaming, get vector embedding results from responseWorkflowMaintainState
  const vectorEmbeddingsResults = useMemo(() => {
    if (responseWorkflowMaintainState.vector_search.results?.length > 0) {
      return responseWorkflowMaintainState.vector_search.results;
    }
    return messageGroup.vector_embeddings_results;
  }, [responseWorkflowMaintainState.vector_search.results, messageGroup.vector_embeddings_results]);
  
  // If streaming, get vector results summary from responseWorkflowMaintainState
  const vectorResultsSummary = useMemo(() => {
    if (isLatestMessage && responseWorkflowMaintainState.vector_search.summary) {
      return responseWorkflowMaintainState.vector_search.summary;
    }
    return messageGroup.vector_results_summary;
  }, [responseWorkflowMaintainState.vector_search.summary, messageGroup.vector_results_summary]);
  

  
  // Get AI content based on streaming status
  const aiContent = useMemo(() => {
    if (isLatestMessage) {
      if(responseWorkflowMaintainState.ai_content && responseWorkflowMaintainState.ai_content.trim().length > 0) {
        return responseWorkflowMaintainState.ai_content;
      }
      return "";
    }
    return messageGroup.ai_content || "";
  }, [responseWorkflowMaintainState.ai_content, messageGroup.ai_content, isLatestMessage]);

 
  
  const hasSearchResults = useMemo(() => 
    (isLatestMessage && responseWorkflowMaintainState.web_search.results && 
     responseWorkflowMaintainState.web_search.results.length > 0) ||
    (messageGroup.search_results && messageGroup.search_results.length > 0),
    [responseWorkflowMaintainState.web_search.results, messageGroup.search_results]
  );
  
  const hasVectorEmbeddingsResults = useMemo(() => 
    (isLatestMessage && responseWorkflowMaintainState.vector_search.results && 
     responseWorkflowMaintainState.vector_search.results.length > 0) ||
    (messageGroup.vector_embeddings_results && messageGroup.vector_embeddings_results.length > 0),
    [responseWorkflowMaintainState.vector_search.results, messageGroup.vector_embeddings_results]
  );
  
  // Check if we have vector results summary
  const hasVectorResultsSummary = useMemo(() => 
    (isLatestMessage && responseWorkflowMaintainState.vector_search.summary) ||
    Boolean(messageGroup.vector_results_summary),
    [responseWorkflowMaintainState.vector_search.summary, messageGroup.vector_results_summary]
  );

  // Check if we have system content (thinking process)
  const hasSystemContent = useMemo(() => 
    (isLatestMessage && responseWorkflowMaintainState.system_content) ||
    Boolean(messageGroup.system_content),
    [responseWorkflowMaintainState.system_content, messageGroup.system_content]
  );
  
  const isFinalResponse = useMemo(() => 
    Boolean(messageGroup.metadata?.is_final || messageGroup.is_final),
    [messageGroup.metadata?.is_final, messageGroup.is_final]
  );

  // Determine the processing status for the streaming UI
  const processingStatus = useMemo(() => {
    if (!isCurrentStreaming) return '';
    
    const { status, processing_steps } = responseWorkflowMaintainState;
    
    if (status === 'searching_web' || processing_steps.web_search === 'running') {
      return 'searching_web';
    } else if (status === 'searching_context' || 
              processing_steps.vector_search === 'running' || 
              processing_steps.vector_search === 'processing_summary') {
      return 'searching_context';
    } else if (status === 'generating' || processing_steps.ai_response === 'running') {
      return 'generating';
    } else if (status === 'processing') {
      return 'processing';
    }
    
    return status;
  }, [responseWorkflowMaintainState]);

  // Smoother scrolling with reduced animation
  // useEffect(() => {
  //   // Only scroll into view on initial mount of the message group, not on every update
  //   const hasScrolled = messageContainerRef.current?.dataset.hasScrolled === 'true';
  //   if (messageContainerRef.current && !hasScrolled) {
  //     messageContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  //     // Mark that we've already scrolled this element
  //     messageContainerRef.current.dataset.hasScrolled = 'true';
  //   }
  // }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isCurrentStreaming]);


  const handleEdit = () => {
    setIsEditing(true);
    setEditedMessage(messageGroup.user_content || "");
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    // Update the message in the context
    if (messageGroup.id && messageGroup.id !== "unknown") {
      // We'll need to implement updateMessage functionality
      // updateMessage(messageGroup.id, { content: editedMessage });
      toast.success("Message updated", getToastStyle(theme));
    }
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (onRegenerateMessage && !isRegenerating) {
      setIsRegenerating(true);
      
      try {
        await onRegenerateMessage();
      } catch (error) {
        console.error("Error regenerating response:", error);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  // Adjust textarea height automatically when editing
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(
      'Code copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // No longer need to memoize with props since ResultsPanel now uses context directly
  const memoizedResultsPanel = useMemo(() => (
    <ResultsPanel
      messageGroup={messageGroup}
      isLatestMessage={isLatestMessage}
    />
  ), [messageGroup, isLatestMessage]);

  return (
    <div 
      ref={messageContainerRef}
      tabIndex={0}
      className={`message-block ${isCurrentStreaming ? `streaming-block streaming-${processingStatus}` : 'completed-block'} ${isLatestMessage ? 'latest-message' : ''} ${isFinalResponse ? 'final-response' : ''} focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 rounded-lg`}
      title="Message group"
      aria-label={`Message group with ${hasUserContent ? 'user question' : ''} ${hasVectorResultsSummary ? ', knowledge base results' : ''} ${hasSystemContent ? ', thinking process' : ''} ${hasAIContent ? ', and AI response' : ''}`}
      role="region"
      style={{ height: isLatestMessage ? '100%' : 'auto' }}
    >
      <div className="block-content">
        {/* User message always comes first */}
        {hasUserContent && (
          <UserMessage
            content={messageGroup.user_content}
            isEditing={isEditing}
            editedMessage={editedMessage}
            textareaRef={textareaRef}
            theme={theme}
            onEdit={handleEdit}
            onTextareaChange={handleTextareaChange}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
          />
        )}

        {/* Processing indicators for streaming state */}
        {isCurrentStreaming && (
          <div className="mb-4">
            <div className={`mt-3 mb-2 py-1 px-3 inline-flex items-center rounded-full text-xs font-medium 
              ${processingStatus === 'searching_web' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                : processingStatus === 'searching_context' 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : processingStatus === 'generating'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}
            >
              <div className="animate-pulse mr-2 h-2 w-2 rounded-full bg-current"></div>
              {processingStatus === 'searching_web' 
                ? 'Searching the web...' 
                : processingStatus === 'searching_context'
                ? 'Retrieving knowledge...'
                : processingStatus === 'generating'
                ? 'Generating response...'
                : 'Processing...'}
            </div>
            
            {/* Progress steps */}
            <div className="flex items-center gap-1 text-xs mt-2 ml-1">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                responseWorkflowMaintainState.processing_steps.web_search === 'running' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium' 
                  : responseWorkflowMaintainState.processing_steps.web_search === 'completed'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                <Search className="h-3 w-3" />
                <span>Web Search</span>
                {responseWorkflowMaintainState.processing_steps.web_search === 'running' && 
                  <div className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                }
                {responseWorkflowMaintainState.processing_steps.web_search === 'completed' && 
                  <CheckCircle className="ml-1 h-3 w-3" />
                }
              </div>
              
              <span className="text-gray-400">→</span>
              
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                responseWorkflowMaintainState.processing_steps.vector_search === 'running' || 
                responseWorkflowMaintainState.processing_steps.vector_search === 'processing_summary' ||
                responseWorkflowMaintainState.processing_steps.vector_search === 'awaiting_results'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 font-medium' 
                  : responseWorkflowMaintainState.processing_steps.vector_search === 'completed'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                <Database className="h-3 w-3" />
                <span>Knowledge Base</span>
                {(responseWorkflowMaintainState.processing_steps.vector_search === 'running' || 
                  responseWorkflowMaintainState.processing_steps.vector_search === 'processing_summary' ||
                  responseWorkflowMaintainState.processing_steps.vector_search === 'awaiting_results') && 
                  <div className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                }
                {responseWorkflowMaintainState.processing_steps.vector_search === 'completed' && 
                  <CheckCircle className="ml-1 h-3 w-3" />
                }
              </div>
              
              <span className="text-gray-400">→</span>
              
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                responseWorkflowMaintainState.processing_steps.thinking === 'running'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-medium' 
                  : responseWorkflowMaintainState.processing_steps.thinking === 'completed'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Thinking</span>
                {responseWorkflowMaintainState.processing_steps.thinking === 'running' && 
                  <div className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                }
                {responseWorkflowMaintainState.processing_steps.thinking === 'completed' && 
                  <CheckCircle className="ml-1 h-3 w-3" />
                }
              </div>
              
              <span className="text-gray-400">→</span>
              
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                responseWorkflowMaintainState.processing_steps.ai_response === 'running'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium' 
                  : responseWorkflowMaintainState.processing_steps.ai_response === 'completed'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                <Cpu className="h-3 w-3" />
                <span>Response</span>
                {responseWorkflowMaintainState.processing_steps.ai_response === 'running' && 
                  <div className="ml-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse"></div>
                }
                {responseWorkflowMaintainState.processing_steps.ai_response === 'completed' && 
                  <CheckCircle className="ml-1 h-3 w-3" />
                }
              </div>
            </div>
          </div>
        )}

        {/* Web Search Results, Vector Embeddings, and Vector Summary */}
        {(hasSearchResults || hasVectorEmbeddingsResults || hasVectorResultsSummary || hasSystemContent) && 
         !isEditing && (
          <div key={`results-wrapper-${messageGroup?.id}`} className="mt-4 mb-6 border-l-4 pl-3 border-gray-300 dark:border-gray-700">
            {memoizedResultsPanel}
          </div>
        )}

        {/* AI Message always comes last */}
        {hasAIContent && 
         !isEditing && (
          <div key={`ai-wrapper-${messageGroup?.id}`} className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700"
               style={{ minHeight: isLatestMessage ? '30vh' : 'auto', flex: isLatestMessage ? '1 0 auto' : 'none' }}>
            <AIMessage
              key={`ai-${messageGroup?.id}`}
              content={aiContent || ''}
              responseContainerRef={responseContainerRef}
              onCopyCode={handleCopyCode}
              isCodeCopied={(code) => code === copiedCode}
              onRegenerate={handleRegenerate}
              isLatestMessage={isLatestMessage}
              isFinalResponse={isFinalResponse}
            />
          </div>
        )}
        
        {/* Show loading indicator when waiting for AI response */}
        {isLatestMessage && isCurrentStreaming && !hasAIContent && !isEditing && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700"
               style={{ minHeight: isLatestMessage ? '30vh' : 'auto', flex: isLatestMessage ? '1 0 auto' : 'none' }}>
            <div className="flex items-center">
              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} w-full`}>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">
                    <LoadingDots />
                  </div>
                  <span>Generating response...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .message-block {
          width: 100%;
          margin-bottom: 1rem;
          transition: all 0.3s ease-out;
          position: relative;
          min-height: ${isLatestMessage ? '100%' : 'auto'};
        }
        
        .streaming-block {
          border-left: 2px solid ${theme === "dark" ? "#4B5563" : "#D1D5DB"};
          padding-left: 0.5rem;
          animation: pulse 2s infinite ease-in-out;
        }
        
        .completed-block {
          border-left: 2px solid transparent;
          padding-left: 0.5rem;
          transition: border-color 0.5s ease-out;
        }
        
        .streaming-searching_web {
          border-left: 2px solid ${theme === "dark" ? "#3B82F6" : "#93C5FD"};
        }
        
        .streaming-searching_context {
          border-left: 2px solid ${theme === "dark" ? "#8B5CF6" : "#C4B5FD"};
        }
        
        .streaming-generating {
          border-left: 2px solid ${theme === "dark" ? "#10B981" : "#6EE7B7"};
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        
        .latest-message {
          margin-bottom: 4rem;
          min-height: 100%;
        }
        
        .final-response {
          border-left: 2px solid ${theme === "dark" ? "#10b981" : "#34d399"};
        }
        
        .block-content {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
};

export default MessageGroup; 