"use client";

import { useCallback } from 'react';
import { useWorkspaceState } from '../context/WorkspaceStateManager';

/**
 * Hook to provide convenient access to streaming state and functionality
 * 
 * @returns An object with streaming state and helper functions
 */
export function useStreamingResponse() {
  const { state, resetStreamingState } = useWorkspaceState();
  const { streaming, isProcessing } = state;
  
  /**
   * Check if any content is currently streaming
   */
  const isStreaming = streaming.isStreaming;
  
  /**
   * Get the current streaming content
   */
  const streamingContent = streaming.content;
  
  /**
   * Get the number of tokens received
   */
  const tokenCount = streaming.tokens.length;
  
  /**
   * Get the latest streaming timestamp
   */
  const lastUpdated = streaming.lastTokenTimestamp;
  
  /**
   * Calculate words per minute based on the streaming tokens
   * 
   * @returns Words per minute rate or 0 if not enough data
   */
  const getWordsPerMinute = useCallback(() => {
    // Need at least 2 tokens to calculate speed
    if (streaming.tokens.length < 10 || !streaming.lastTokenTimestamp) {
      return 0;
    }
    
    // Calculate time span in minutes
    const timeSpanMs = Date.now() - streaming.lastTokenTimestamp + (streaming.chunkCount * 50);
    const timeSpanMinutes = timeSpanMs / 60000;
    
    // Estimate word count (roughly 5 characters per word)
    const charCount = streaming.content.length;
    const estimatedWords = charCount / 5;
    
    // Calculate words per minute
    return Math.round(estimatedWords / timeSpanMinutes);
  }, [streaming.tokens.length, streaming.lastTokenTimestamp, streaming.content.length, streaming.chunkCount]);
  
  /**
   * Get time since last token in seconds
   * 
   * @returns Seconds since last token or 0 if not streaming
   */
  const timeSinceLastToken = useCallback(() => {
    if (!streaming.lastTokenTimestamp) return 0;
    return Math.round((Date.now() - streaming.lastTokenTimestamp) / 1000);
  }, [streaming.lastTokenTimestamp]);
  
  /**
   * Check if streaming has paused (no tokens for more than 3 seconds)
   */
  const isStreamingPaused = useCallback(() => {
    if (!streaming.isStreaming) return false;
    return timeSinceLastToken() > 3;
  }, [streaming.isStreaming, timeSinceLastToken]);
  
  return {
    isStreaming,
    streamingContent,
    tokenCount,
    lastUpdated,
    isProcessing,
    getWordsPerMinute,
    timeSinceLastToken,
    isStreamingPaused,
    resetStreamingState
  };
}

export default useStreamingResponse; 