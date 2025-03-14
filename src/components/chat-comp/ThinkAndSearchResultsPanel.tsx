"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from "@/context/ThemeProvider";
import ThinkingPanel from './ThinkingPanel';
import SearchResultsPanel from './SearchResultsPanel';
import { SearchResult } from '@/lib/services/searchApi';
import { useStreaming } from '@/context/MessageStateContext';

// Main component props
interface ThinkAndSearchResultsPanelProps {
  search_results: SearchResult[];
  thinking: string;
  messageId: string;
}

// Main component
const ThinkAndSearchResultsPanel: React.FC<ThinkAndSearchResultsPanelProps> = ({
  search_results,
  thinking,
  messageId
}) => {
  const { theme } = useTheme();
  const initialRender = useRef(true);

  const {
    currentPhase,
    completeWebSearch,
    completeThinking,
    id
  } = useStreaming();
  
  // Panel expansion states - Default to expanded if content exists
  const [isResultsExpanded, setIsResultsExpanded] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if(messageId === id && currentPhase === "search" && search_results && search_results.length === 0) {
      completeWebSearch();
    }
  }, [messageId, id, completeWebSearch, currentPhase, search_results]);
  

  useEffect(() => {
    if(messageId === id && currentPhase === "thinking" && !thinking) {
      completeThinking();
    }
  }, [messageId, id, completeThinking, currentPhase, thinking]);


  // Define better text colors based on theme
  const containerColor = theme === "dark" ? "bg-gray-800/30" : "bg-gray-50/80";
  const borderColor = theme === "dark" ? "border-purple-500" : "border-purple-400";

  
  // Track initial render
  useEffect(() => {
    // Only run this effect once to set initialRender to false
    initialRender.current = false;
  }, []);
  
  // If nothing to display, don't render the component
  if ((!thinking || thinking === '') && (!search_results || search_results.length === 0)) {
    return null;
  }
  
  return (
    <div className={`w-full my-2 max-w-[50rem] rounded-md py-1 overflow-hidden`}>
     {/* Only render search results panel if results exist */}
        <div className={`${containerColor} ${borderColor} border-l rounded-l mt-1`}>
          <SearchResultsPanel 
            search_results={search_results || []}
            expandedSearch={isResultsExpanded}
            setExpandedSearch={setIsResultsExpanded}
            messageId={messageId}
          />
        </div>
      {/* Only render thinking panel if thinking content exists */}
        <div className={`${containerColor} ${borderColor} border-l rounded-l`}>
          <ThinkingPanel 
            content={thinking}
            isExpanded={isExpanded}
            setExpanded={setIsExpanded}
            messageId={messageId}
          />
        </div>
      
   
    </div>
  );
};

export default ThinkAndSearchResultsPanel; 