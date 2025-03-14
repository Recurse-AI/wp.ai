"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from "@/context/ThemeProvider";
import { Globe, ChevronDown, ChevronUp, ExternalLink, Loader } from "lucide-react";
import { SearchResult } from '@/lib/services/searchApi';
import { useStreaming } from '@/context/MessageStateContext';

interface SearchResultsPanelProps {
  search_results: SearchResult[];
  expandedSearch: boolean;
  setExpandedSearch: (expanded: boolean) => void;
  // streamingPhase: 'search' | 'thinking' | 'response' | 'complete';
  messageId: string;
}

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
  search_results,
  expandedSearch,
  setExpandedSearch,
  messageId
}) => {
  const { theme } = useTheme();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const [displayResults, setDisplayResults] = useState<SearchResult[]>([]);
  // Add a ref to track if streaming is in progress to prevent multiple streaming processes
  const isStreamingRef = useRef(false);

    // Get streaming context
  const { 
    currentPhase,
    id,
    completeWebSearch,
  } = useStreaming();


  
  
  // Function to scroll to the bottom of search results container
  const scrollToBottom = useCallback(() => {
    if (searchBoxRef.current) {
      const scrollElement = searchBoxRef.current;
      // Use requestAnimationFrame to ensure the scroll happens after layout
      requestAnimationFrame(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, [searchBoxRef]);
    


  // Define consistent colors based on theme
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-purple-600" : "border-purple-400";
  const bgContentColor = theme === "dark" ? "bg-gray-800/50" : "bg-gray-50/90";
  const accentColor = "text-purple-500";
  const hoverColor = theme === "dark" ? "hover:bg-gray-800/50" : "hover:bg-gray-100/80";
  const urlTextColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const snippetColor = theme === "dark" ? "text-gray-300" : "text-gray-600";

 
  useEffect(() => {
    // Only handle changes when the component is mounted
    let isMounted = true;
    
    // If the messageId is different from the streaming id, just set the results directly
    if(messageId !== id) {
      if (isMounted) {
        setDisplayResults(search_results);
      }
    } else if (messageId === id && !isStreamingRef.current && currentPhase === "search" && search_results && search_results.length > 0) {    
      // Start streaming results
      const streamResults = () => {
        // Set streaming flag to prevent multiple streaming processes
        isStreamingRef.current = true;
        
        // Set results all at once instead of streaming to avoid excessive renders
        setDisplayResults(search_results);
        
        // Complete the search phase after a short delay
        setTimeout(() => {
          if (isMounted) {
            completeWebSearch();
            isStreamingRef.current = false;
          }
        }, 1000);
      };
      
      streamResults();
    } else if(messageId === id && currentPhase === "search" && isMounted) {
      completeWebSearch();
    }
   
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
    };
  }, [messageId, id, completeWebSearch, currentPhase, search_results]);
  

  // Scroll to bottom whenever displayResults changes
  useEffect(() => {
    // Only auto-scroll if we're in the search phase and have results
    if (currentPhase === 'search') {
      scrollToBottom();
    }
  }, [currentPhase, scrollToBottom]);

  const streamResults = async () => {
    // Set streaming flag to prevent multiple streaming processes
    isStreamingRef.current = true;
    setDisplayResults(search_results);
    await new Promise(resolve => setTimeout(resolve, 1000));
    completeWebSearch();
    isStreamingRef.current = false;
    
    
    // Add one result at a time with a small delay
    // for (let i = 0; i < search_results.length; i++) {
      
    //   // Wait for a small delay to create streaming effect
    //   await new Promise(resolve => setTimeout(resolve, 20));
      
    //   let newResults = [...displayResults, search_results[i]];
    //   setDisplayResults(newResults);
    //   // If this is the last result, complete the web search phase
    //   if (i === search_results.length - 1) {
    //     completeWebSearch();
    //     // Reset streaming flag
    //     isStreamingRef.current = false;
    //   }
    // }
  };
  

  // Ensure URL has proper protocol
  const formatUrl = (url: string): string => {
    if (!url) return '#';
    
    // Check if URL already has protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// as default protocol
    return `https://${url}`;
  };

  // Preserve scroll position to prevent jumps
  useEffect(() => {
    if (searchBoxRef.current) {
      const handleScroll = () => {
        if (searchBoxRef.current) {
          scrollPositionRef.current = searchBoxRef.current.scrollTop;
        }
      };
      
      // Attach scroll listener
      searchBoxRef.current.addEventListener('scroll', handleScroll);
      
      // Cleanup
      return () => {
        if (searchBoxRef.current) {
          searchBoxRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, []);


  // Only render if there are search results
  if (search_results?.length === 0) {
    return null;
  }

  return (
    <div className="pl-4 mb-4 search-results-section animate-fadeIn">
      <div 
        className={`flex items-center gap-2 mb-2 sticky top-0 ${bgColor} z-10 py-1 cursor-pointer transition-colors ${currentPhase === 'search' ? 'search-header-active' : ''}`}
        onClick={() => setExpandedSearch(!expandedSearch)}
        style={{
          position: 'sticky',
          top: 0,
          padding: '10px',
          borderRadius: '0.375rem',
          boxShadow: 'none', // Removed shadow for cleaner UI
          transition: 'all 0.3s ease'
        }}
      >
        <Globe className={`w-4 h-4 ${accentColor}`} />
        <h3 className={`text-xs font-medium flex items-center flex-1 ${textColor}`}>
          {currentPhase === 'search' ? (
            <span className={`flex items-center text-xs ${accentColor}`}>
              Web Search
             <Loader className="w-3 h-3 ml-1 animate-spin" />
            </span>
          ) : `${search_results?.length} Web ${search_results?.length === 1 ? 'Result' : 'Results'}`}
        </h3>
        
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent double toggle
            setExpandedSearch(!expandedSearch);
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform"
          aria-label={expandedSearch ? "Collapse results" : "Expand results"}
          style={{
            transform: expandedSearch ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div
        style={{
          maxHeight: expandedSearch ? '250px' : '0px',
          opacity: expandedSearch ? 1 : 0,
          overflow: expandedSearch ? 'auto' : 'hidden',
          transition: 'all 0.3s ease',
          paddingLeft: '1.5rem',
          paddingRight: '0.5rem'
        }}
      >
        {expandedSearch && (
          <div 
            ref={searchBoxRef}
            className="space-y-3 custom-scrollbar search-results-scroll"
            style={{
              maxHeight: '250px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              scrollBehavior: 'smooth'
            }}
          >
            <div className="search-results-list">
              {displayResults?.map((result, index) => (
                <div 
                  key={`search-result-${messageId}-${index}`}
                  className={`p-3 border-l-2 my-2 ${
                    theme === "dark" 
                      ? `border-l-purple-600 hover:border-l-purple-500 ${bgContentColor}` 
                      : `border-l-purple-400 hover:border-l-purple-500 ${bgContentColor}`
                  } transition-colors duration-200 rounded-r-sm animate-fadeIn`}
                >
                  <a 
                    href={formatUrl(result.url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-500 hover:underline mb-1 text-sm">{result.title || 'No Title'}</h4>
                      <p className={`text-xs ${snippetColor}`}>
                        {result.snippet || 'No snippet available'}
                      </p>
                      <div className="flex items-center mt-1.5">
                        <p className={`text-xs ${urlTextColor} truncate flex-1`}>{result.url || 'No URL'}</p>
                        <ExternalLink className="ml-1 flex-shrink-0 text-gray-400 w-3 h-3" />
                      </div>
                    </div>
                  </a>
                </div>
              ))}
              { currentPhase === 'search' && search_results.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {!expandedSearch && (
        <div className="pl-6 pr-2">
          <p className="text-xs text-gray-500">
            {search_results?.length} {search_results?.length === 1 ? 'result' : 'results'} found. Click to expand.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPanel; 