'use client';

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { 
  Search, Database, Cpu, CheckCircle, AlertCircle, Clock, 
  ExternalLink, Loader2, Info, Send, SplitSquareVertical, Clipboard
} from 'lucide-react';
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { SearchResult } from '@/lib/types/chat';
import LoadingDots from '@/components/chat-comp/LoadingDots';
import { useChatSocket } from '@/context/ChatSocketContext';
import MarkdownContent from '@/components/chat-comp/MarkdownContent';
import { MessageGroup } from '@/lib/types/chat';



const ResultsPanel: React.FC<{
  messageGroup: MessageGroup;
  isLatestMessage: boolean;
}> = ({ messageGroup, isLatestMessage }) => {
  const { theme } = useTheme();
  const { responseWorkflowMaintainState, isLoading } = useChatSocket();
  
  const prevResultCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const vectorEmbeddingsContainerRef = useRef<HTMLDivElement>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [viewDetails, setViewDetails] = useState(false);
  const [expandedSearchResults, setExpandedSearchResults] = useState(false);

  // Loading states for copy buttons
  const [copyingSearchAll, setCopyingSearchAll] = useState(false);
  const [copyingVectorSummary, setCopyingVectorSummary] = useState(false);
  const [copyingResult, setCopyingResult] = useState<number | null>(null);

  const [copyingVectorResults, setCopyingVectorResults] = useState(false);
  const [copyingThinking, setCopyingThinking] = useState(false);
  const [searchUpdateCount, setSearchUpdateCount] = useState(0);
  const [expandedThinkingProcess, setExpandedThinkingProcess] = useState(false);
  
  // References for keyboard shortcuts
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const vectorSummaryRef = useRef<HTMLDivElement>(null);
  const thinkingProcessRef = useRef<HTMLDivElement>(null);
  const vectorResultsRef = useRef<HTMLDivElement>(null);

  const thinkingProcessContainerRef = useRef<HTMLDivElement>(null);
  
  // Derive the current phase from responseWorkflowMaintainState
  const currentPhase = useMemo(() => {
    if (!isLoading) return 'complete';
    
    const { processing_steps, status } = responseWorkflowMaintainState;
    
    if (status === 'generating' || processing_steps.ai_response === 'running') {
      return 'generating';
    } else if (status === 'searching_web' || processing_steps.web_search === 'running') {
      return 'searching';
    } else if (status === 'searching_context' || 
              processing_steps.vector_search === 'running' || 
              processing_steps.vector_search === 'processing_summary') {
      return 'embedding';
    } else if (status === 'processing') {
      return 'processing';
    } else if (status === 'error') {
      return 'error';
    }
    
    return 'processing';
  }, [isLoading, responseWorkflowMaintainState]);
  
  // Create a streamingMessage object with structured data from responseWorkflowMaintainState
  const streamingMessage = useMemo(() => {    
    return {
      content: responseWorkflowMaintainState.ai_content,
      groupId: responseWorkflowMaintainState.message_group_id,
      searchResults: {
        results: responseWorkflowMaintainState.web_search.results || [],
        isSearching: responseWorkflowMaintainState.processing_steps.web_search === 'running',
        index: responseWorkflowMaintainState.web_search.index,
        total: responseWorkflowMaintainState.web_search.total
      },
      vectorEmbeddingsResults: responseWorkflowMaintainState.vector_search.results || [],
      vectorResultsSummary: responseWorkflowMaintainState.vector_search.summary,
      processingSteps: responseWorkflowMaintainState.system_content 
        ? responseWorkflowMaintainState.system_content.split('\n').filter(Boolean).map((content, i) => ({ step: i + 1, content }))
        : []
    };
  }, [responseWorkflowMaintainState]);



  // Get search results based on streaming state
  const displaySearchResults = useMemo(() => {
    // If we're streaming, use the results from the workflow state
    if (isLatestMessage) {
      if(streamingMessage.searchResults.results && streamingMessage.searchResults.results.length > 0) {
        return streamingMessage.searchResults.results;
      }
      return [];
    }
    return messageGroup.search_results || [];
  }, [streamingMessage, messageGroup, isLatestMessage]);

  // Get vector embeddings based on streaming state
  const displayVectorEmbeddingsResults = useMemo(() => {
    if (isLatestMessage) {
      if(streamingMessage.vectorEmbeddingsResults && streamingMessage.vectorEmbeddingsResults.length > 0) {
        return streamingMessage.vectorEmbeddingsResults;
      }
      return [];
    }
    return messageGroup.vector_embeddings_results || [];
  }, [streamingMessage, messageGroup, isLatestMessage]);

  // Get vector results summary based on streaming state
  const displayVectorResultsSummary = useMemo(() => {
    if (isLatestMessage) {
      if(streamingMessage.vectorResultsSummary && streamingMessage.vectorResultsSummary.trim().length > 0) {
        return streamingMessage.vectorResultsSummary;
      }
      return "";
    }
    
    // Generate a default summary if one isn't provided but we have results
    if (messageGroup.vector_results_summary) {
      return messageGroup.vector_results_summary;
    }
    return "";
  }, [streamingMessage, messageGroup, isLatestMessage]);

  // Get thinking process content
  const thinkingProcess = useMemo(() => {
    if (isLatestMessage) {
      if(responseWorkflowMaintainState.system_content && responseWorkflowMaintainState.system_content.trim().length > 0) {
        return responseWorkflowMaintainState.system_content;
      }
      return "";
    }
    return messageGroup.system_content || "";
  }, [responseWorkflowMaintainState.system_content, messageGroup, isLatestMessage]);

  // Check if we have results of each type - Fix TypeScript errors
  const hasSearchResults = useMemo(() => {
    if (isLatestMessage) {
      if(streamingMessage.searchResults.results && streamingMessage.searchResults.results.length > 0) {
        return true;
      }
      return false;
    }
    if (messageGroup.search_results) {
      return messageGroup.search_results.length > 0;
    }
    return false;
  }, [streamingMessage, messageGroup, isLatestMessage]);
  
  const hasVectorResults = useMemo(() => {
    if (isLatestMessage) {
      if(streamingMessage.vectorEmbeddingsResults && streamingMessage.vectorEmbeddingsResults.length > 0) {
        return true;
      }
      return false;
    }
    if (messageGroup.vector_embeddings_results) {
      return messageGroup.vector_embeddings_results.length > 0;
    }
    return false;
  }, [streamingMessage, messageGroup, isLatestMessage]);
  
  const hasVectorSummary = useMemo(() => {
    if (isLatestMessage) {
      if(streamingMessage.vectorResultsSummary && streamingMessage.vectorResultsSummary.trim().length > 0) {
        return true;
      }
      return false;
    }
    if (messageGroup.vector_results_summary) {
      return messageGroup.vector_results_summary;
    }
    return false;
  }, [streamingMessage, messageGroup, isLatestMessage]);
  
  const hasThinkingProcess = useMemo(() => {
    if (isLatestMessage) {
      if(responseWorkflowMaintainState.system_content && responseWorkflowMaintainState.system_content.trim().length > 0) {
        return true;
      }
      return false;
    }
    if(messageGroup.system_content && messageGroup.system_content.trim().length > 0) {
      return true;
    }
    return false;
  }, [responseWorkflowMaintainState.system_content, messageGroup, isLatestMessage]);

 

  // Function to copy with loading state
  const copyWithLoading = useCallback(async (
    text: string, 
    setLoadingState: React.Dispatch<React.SetStateAction<any>>, 
    successMessage: string
  ) => {
    setLoadingState(true);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage, getToastStyle(theme));
    } catch (error) {
      toast.error("Failed to copy to clipboard", getToastStyle(theme));
    } finally {
      // Set a slight delay before resetting loading state
      setTimeout(() => {
        if (typeof setLoadingState === 'function') {
          setLoadingState(false);
        }
      }, 500);
    }
  }, [theme]);

  // Handle keyboard shortcuts for copying content
  const handleKeyDown = useCallback((e: KeyboardEvent, content: string, setLoading: (loading: boolean | number) => void, successMessage: string) => {
    // Check for Ctrl+C or Cmd+C (Meta key on Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Prevent default only if no text is selected
      if (!window.getSelection()?.toString()) {
        e.preventDefault();
        copyWithLoading(content, setLoading, successMessage);
      }
    }
  }, [copyWithLoading]);

  // Set up keyboard event listeners
  useEffect(() => {
    // Search results section
    const searchResultsElement = searchResultsRef.current;
    if (searchResultsElement && hasSearchResults) {
      const handleSearchKeyDown = (e: KeyboardEvent) => {
        // Format all search results into a single text
        const formattedResults = displaySearchResults.map((result, index) => {
          return `${index + 1}. ${result.title}\n   URL: ${result.url}\n   ${result.snippet}\n`;
        }).join('\n');
        
        const searchSummary = `Web Search Results (${displaySearchResults.length}):\n\n${formattedResults}`;
        
        const setLoadingWrapper = (loading: boolean | number) => setCopyingSearchAll(!!loading);
        
        handleKeyDown(e, searchSummary, setLoadingWrapper, "All search results copied to clipboard");
      };
      
      searchResultsElement.addEventListener('keydown', handleSearchKeyDown);
      return () => searchResultsElement.removeEventListener('keydown', handleSearchKeyDown);
    }
  }, [hasSearchResults, displaySearchResults, handleKeyDown]);

  useEffect(() => {
    // Vector summary section
    const vectorSummaryElement = vectorSummaryRef.current;
    if (vectorSummaryElement && hasVectorSummary) {
      const handleVectorSummaryKeyDown = (e: KeyboardEvent) => {
        const setLoadingWrapper = (loading: boolean | number) => setCopyingVectorSummary(!!loading);
        handleKeyDown(e, displayVectorResultsSummary, setLoadingWrapper, "Summary copied to clipboard");
      };
      
      vectorSummaryElement.addEventListener('keydown', handleVectorSummaryKeyDown);
      return () => vectorSummaryElement.removeEventListener('keydown', handleVectorSummaryKeyDown);
    }
  }, [hasVectorSummary, displayVectorResultsSummary, handleKeyDown]);

  useEffect(() => {
    // Thinking process section
    const thinkingProcessElement = thinkingProcessRef.current;
    if (thinkingProcessElement && hasThinkingProcess) {
      const handleThinkingKeyDown = (e: KeyboardEvent) => {
        const setLoadingWrapper = (loading: boolean | number) => setCopyingThinking(!!loading);
        handleKeyDown(e, thinkingProcess, setLoadingWrapper, "Thinking process copied to clipboard");
      };
      
      thinkingProcessElement.addEventListener('keydown', handleThinkingKeyDown);
      return () => thinkingProcessElement.removeEventListener('keydown', handleThinkingKeyDown);
    }
  }, [hasThinkingProcess, thinkingProcess, handleKeyDown]);

  useEffect(() => {
    // Vector results detail section
    const vectorResultsElement = vectorResultsRef.current;
    if (vectorResultsElement && hasVectorResults && viewDetails) {
      const handleVectorResultsKeyDown = (e: KeyboardEvent) => {
        // Format all vector results into a single text
        const formattedResults = displayVectorEmbeddingsResults.map((result, index) => {
          return `${index + 1}. ${result.title || `Knowledge Base Result ${index + 1}`}\n   ${result.url ? `URL: ${result.url}\n   ` : ''}${result.content}\n`;
        }).join('\n');
        
        const vectorResultsSummary = `Knowledge Base Details (${displayVectorEmbeddingsResults.length}):\n\n${formattedResults}`;
        
        const setLoadingWrapper = (loading: boolean | number) => setCopyingVectorResults(!!loading);
        handleKeyDown(e, vectorResultsSummary, setLoadingWrapper, "All knowledge base results copied to clipboard");
      };
      
      vectorResultsElement.addEventListener('keydown', handleVectorResultsKeyDown);
      return () => vectorResultsElement.removeEventListener('keydown', handleVectorResultsKeyDown);
    }
  }, [hasVectorResults, viewDetails, displayVectorEmbeddingsResults, handleKeyDown]);

  // Track new results coming in during streaming
  useEffect(() => {
    if (isLoading && streamingMessage && streamingMessage.searchResults.results?.length > prevResultCount.current) {
      setSearchUpdateCount(prev => prev + 1);
      prevResultCount.current = streamingMessage.searchResults.results?.length || 0;
      
      // Scroll to bottom when new results arrive
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [isLoading, streamingMessage, isLatestMessage]);
  
  // Auto-scroll vector embeddings container when streaming new content
  useEffect(() => {
    if (isLoading && vectorEmbeddingsContainerRef.current && streamingMessage?.vectorEmbeddingsResults) {
      vectorEmbeddingsContainerRef.current.scrollTop = vectorEmbeddingsContainerRef.current.scrollHeight;
    }
  }, [isLoading, streamingMessage?.vectorEmbeddingsResults, isLatestMessage]);

  // Auto-scroll thinking process container when new steps are added
  useEffect(() => {
    if (isLoading && streamingMessage?.processingSteps?.length && thinkingProcessContainerRef.current && expandedThinkingProcess) {
      thinkingProcessContainerRef.current.scrollTop = thinkingProcessContainerRef.current.scrollHeight;
    }
  }, [isLoading, streamingMessage?.processingSteps, expandedThinkingProcess, isLatestMessage]);
  
 
  // Update timer for search duration
  useEffect(() => {
    if (!isLoading) return;
    
    let interval: NodeJS.Timeout;
    
    if (currentPhase === 'searching' || currentPhase === 'embedding') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, currentPhase]);

 


  // Format elapsed time
  const formatElapsedTime = () => {
    if (timeElapsed < 60) return `${timeElapsed}s`;
    return `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s`;
  };


  // Early return if no results
  if (!hasSearchResults && !hasVectorResults && !hasVectorSummary && !hasThinkingProcess) {
    return null;
  }
  
  return (
    <div className={`results-panel ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      {/* Web Search Results - Show First */}
      {hasSearchResults && (
        <div 
          ref={searchResultsRef}
          tabIndex={0} 
          aria-label={`Web Search Results, ${displaySearchResults.length} items. Press Tab to navigate sections, Ctrl+C to copy all.`}
          className={`mb-6 p-4 rounded-lg border ${theme === "dark" ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-blue-50/30 border-blue-100 text-gray-700"} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-blue-50/50 dark:focus:bg-blue-900/30 transition-all duration-150`}
          title="Press Tab to navigate sections, Ctrl+C to copy all search results"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Search className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Web Search Results ({displaySearchResults.length})</span>
            {currentPhase === 'searching' && (
              <span className="text-xs text-blue-500 flex items-center ml-2">
                <LoadingDots className="inline-block ml-1" />
                <span className="ml-2 text-gray-500">({formatElapsedTime()})</span>
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Tab</span>
              </kbd>
              <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400 mx-1">+</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Ctrl+C</span>
              </kbd>
              <button
                onClick={() => {
                  // Format all search results into a single text
                  const formattedResults = displaySearchResults.map((result, index) => {
                    return `${index + 1}. ${result.title}\n   URL: ${result.url}\n   ${result.snippet}\n`;
                  }).join('\n');
                  
                  const searchSummary = `Web Search Results (${displaySearchResults.length}):\n\n${formattedResults}`;
                  
                  // Copy to clipboard with loading indicator
                  copyWithLoading(
                    searchSummary,
                    setCopyingSearchAll,
                    "All search results copied to clipboard"
                  );
                }}
                disabled={copyingSearchAll}
                className={`text-xs px-2 py-1 ml-2 rounded ${
                  theme === "dark" 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } ${copyingSearchAll ? 'opacity-75' : ''}`}
                title="Copy all search results (Ctrl+C when focused)"
              >
                <div className="flex items-center gap-1">
                  {copyingSearchAll ? (
                    <LoadingDots />
                  ) : (
                    <Clipboard className="w-3 h-3" />
                  )}
                  <span>{copyingSearchAll ? 'Copying...' : 'Copy All'}</span>
                </div>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {displaySearchResults.slice(0, expandedSearchResults ? displaySearchResults.length : 3).map((result, index) => (
              <div key={index} className={`border rounded-lg p-3 ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    <a href={result.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {result.title}
                    </a>
                  </h3>
                  <button
                    onClick={() => {
                      // Use a dedicated function for handling this specific copy operation
                      const copyResultSnippet = async () => {
                        setCopyingResult(index);
                        try {
                          await navigator.clipboard.writeText(result.snippet);
                          toast.success("Search result copied to clipboard", getToastStyle(theme));
                        } catch (error) {
                          toast.error("Failed to copy to clipboard", getToastStyle(theme));
                        } finally {
                          // Ensure we reset after a delay
                          setTimeout(() => setCopyingResult(null), 500);
                        }
                      };
                      copyResultSnippet();
                    }}
                    disabled={copyingResult === index}
                    className={`text-xs ml-2 px-1.5 py-1 rounded ${
                      theme === "dark" 
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    } ${copyingResult === index ? 'opacity-75' : ''}`}
                    title="Copy content"
                  >
                    <div className="flex items-center gap-1">
                      {copyingResult === index ? (
                        <LoadingDots />
                      ) : (
                        <Clipboard className="w-3 h-3" />
                      )}
                      <span>{copyingResult === index ? 'Copying...' : 'Copy'}</span>
                    </div>
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center cursor-pointer flex-wrap">
                    {result.link}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {result.snippet}
                </p>
              </div>
            ))}
            
            {displaySearchResults.length > 3 && (
              <button
                onClick={() => setExpandedSearchResults(!expandedSearchResults)}
                className={`text-xs px-3 py-2 text-center rounded border ${
                  theme === "dark" 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
              >
                {expandedSearchResults ? 'Show fewer results' : `View ${displaySearchResults.length - 3} more results`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Vector Results Summary - Show Second */}
      {hasVectorSummary && (
        <div 
          ref={vectorSummaryRef}
          tabIndex={0}
          aria-label="Knowledge Base Summary. Press Tab to navigate sections, Ctrl+C to copy summary."
          className={`mb-6 p-4 rounded-lg border ${theme === "dark" ? "bg-purple-900/20 border-purple-900/40 text-gray-300" : "bg-purple-50/30 border-purple-100 text-gray-700"} focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:bg-purple-50/50 dark:focus:bg-purple-900/30 transition-all duration-150`}
          title="Press Tab to navigate sections, Ctrl+C to copy knowledge base summary"
          style={{ display: 'block' }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Database className="h-5 w-5 text-purple-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Knowledge Base Summary</span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>Tap to view details</span>
            </div>
            {currentPhase === 'embedding' && (
              <span className="text-xs text-purple-500 flex items-center ml-2">
                <LoadingDots className="inline-block ml-1" />
                <span className="ml-2 text-gray-500">({formatElapsedTime()})</span>
              </span>
            )}
            
            <div className="ml-auto flex items-center gap-2">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Tab</span>
              </kbd>
              <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400 mx-1">+</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Ctrl+C</span>
              </kbd>
              <button
                onClick={() => copyWithLoading(
                  displayVectorResultsSummary,
                  setCopyingVectorSummary,
                  "Summary copied to clipboard"
                )}
                disabled={copyingVectorSummary}
                className={`text-xs px-2 py-1 ml-2 rounded ${
                  theme === "dark" 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } ${copyingVectorSummary ? 'opacity-75' : ''}`}
                title="Copy summary (Ctrl+C when focused)"
              >
                <div className="flex items-center gap-1">
                  {copyingVectorSummary ? (
                    <LoadingDots />
                  ) : (
                    <Clipboard className="w-3 h-3" />
                  )}
                  <span>{copyingVectorSummary ? 'Copying...' : 'Copy'}</span>
                </div>
              </button>
              {hasVectorResults && (
                <button
                  onClick={() => setViewDetails(true)}
                  className={`text-xs px-2 py-1 rounded ${
                    theme === "dark" 
                      ? "bg-purple-900/40 hover:bg-purple-900/60 text-purple-300" 
                      : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                  }`}
                >
                  View Details
                </button>
              )}
            </div>
          </div>
          <div className={`text-xs p-3 rounded ${theme === "dark" ? "bg-gray-800" : "bg-white"} max-h-64 overflow-y-auto border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            {displayVectorResultsSummary}
          </div>
        </div>
      )}

      {/* Thinking Process Section */}
      {hasThinkingProcess && (
        <div 
          ref={thinkingProcessRef}
          tabIndex={0}
          aria-label="Thinking Process. Press Tab to navigate sections, Ctrl+C to copy thinking process."
          className={`mb-6 p-4 rounded-lg border ${theme === "dark" ? "bg-yellow-900/20 border-yellow-900/40 text-gray-300" : "bg-yellow-50/30 border-yellow-100 text-gray-700"} focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:bg-yellow-50/50 dark:focus:bg-yellow-900/30 transition-all duration-150`}
          title="Press Tab to navigate sections, Ctrl+C to copy thinking process"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Cpu className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Thinking Process</span>
            {currentPhase === 'processing' && (
              <span className="text-xs text-yellow-500 flex items-center ml-2">
                <LoadingDots className="inline-block ml-1" />
              </span>
            )}
            
            <div className="ml-auto flex items-center gap-2">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Tab</span>
              </kbd>
              <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400 mx-1">+</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 px-2 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <span className="text-xs">Ctrl+C</span>
              </kbd>
              <button
                onClick={() => copyWithLoading(
                  thinkingProcess,
                  setCopyingThinking,
                  "Thinking process copied to clipboard"
                )}
                disabled={copyingThinking}
                className={`text-xs px-2 py-1 ml-2 rounded ${
                  theme === "dark" 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } ${copyingThinking ? 'opacity-75' : ''}`}
                title="Copy thinking process (Ctrl+C when focused)"
              >
                <div className="flex items-center gap-1">
                  {copyingThinking ? (
                    <LoadingDots />
                  ) : (
                    <Clipboard className="w-3 h-3" />
                  )}
                  <span>{copyingThinking ? 'Copying...' : 'Copy'}</span>
                </div>
              </button>
            </div>
          </div>
          <div 
            ref={thinkingProcessContainerRef}
            className={`text-xs p-3 rounded ${theme === "dark" ? "bg-gray-800" : "bg-white"} max-h-64 overflow-y-auto border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} whitespace-pre-wrap`}
          >
            {thinkingProcess}
          </div>
        </div>
      )}

      {/* Add the vector results details modal */}
      {viewDetails && hasVectorResults && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" style={{zIndex: 1000}}>
          <div 
            ref={vectorResultsRef}
            className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in duration-300`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-medium">Knowledge Base Details ({displayVectorEmbeddingsResults.length})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const copyAllVectorResults = async () => {
                      setCopyingVectorResults(true);
                      try {
                        const formattedText = displayVectorEmbeddingsResults.map((result, index) => 
                          `${index + 1}. ${result.title || `Result ${index + 1}`}\n${result.url ? `URL: ${result.url}\n` : ''}${result.content}`
                        ).join('\n\n');
                        
                        await navigator.clipboard.writeText(formattedText);
                        toast.success("Vector results copied to clipboard", getToastStyle(theme));
                      } catch (error) {
                        toast.error("Failed to copy to clipboard", getToastStyle(theme));
                      } finally {
                        setTimeout(() => setCopyingVectorResults(false), 500);
                      }
                    };
                    copyAllVectorResults();
                  }}
                  disabled={copyingVectorResults}
                  className={`text-xs px-2 py-1 rounded ${
                    theme === "dark" 
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {copyingVectorResults ? <LoadingDots /> : <Clipboard className="w-3 h-3" />}
                    <span>{copyingVectorResults ? 'Copying...' : 'Copy All'}</span>
                  </div>
                </button>
                <button 
                  onClick={() => setViewDetails(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
              <div className="grid grid-cols-1 gap-3">
                {displayVectorEmbeddingsResults.map((result, index) => (
                  <div key={index} className={`border rounded-lg p-3 ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {result.title || `Knowledge Base Result ${index + 1}`}
                      </h4>
                      <button
                        onClick={() => {
                          // Use a dedicated function for handling this specific copy operation
                          const copyVectorContent = async () => {
                            setCopyingResult(index + 1000);
                            try {
                              await navigator.clipboard.writeText(result.content);
                              toast.success("Result content copied to clipboard", getToastStyle(theme));
                            } catch (error) {
                              toast.error("Failed to copy to clipboard", getToastStyle(theme));
                            } finally {
                              // Ensure we reset after a delay
                              setTimeout(() => setCopyingResult(null), 500);
                            }
                          };
                          copyVectorContent();
                        }}
                        disabled={copyingResult === index + 1000}
                        className={`text-xs ml-2 px-1.5 py-1 rounded ${
                          theme === "dark" 
                            ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {copyingResult === index + 1000 ? <LoadingDots /> : <Clipboard className="w-3 h-3" />}
                          <span>{copyingResult === index + 1000 ? 'Copying...' : 'Copy'}</span>
                        </div>
                      </button>
                    </div>
                    {result.url && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                          {result.url}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add other sections that might be needed here */}
      
    </div>
  );
}

export default ResultsPanel;