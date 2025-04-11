"use client";

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentSessionState, 
  AgentMessage, 
  PanelLayout, 
  AgentFile, 
  FileNode 
} from '../types';
import { DEFAULT_PANEL_LAYOUT, DEFAULT_PLUGIN_STRUCTURE } from '../constants';

export function useAgentState(workspaceId?: string, serviceId?: string) {
  // Initialize session state
  const [sessionState, setSessionState] = useState<AgentSessionState>({
    id: workspaceId || uuidv4(),
    messages: [],
    files: DEFAULT_PLUGIN_STRUCTURE,
    isProcessing: false,
    previewMode: "code",
  });

  // UI state
  const [layout, setLayout] = useState<PanelLayout>(DEFAULT_PANEL_LAYOUT);

  // Load saved session if workspaceId is provided
  useEffect(() => {
    if (workspaceId) {
      // Here you would typically load from an API or localStorage
      const savedSession = localStorage.getItem(`workspace-${workspaceId}`);
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          setSessionState(prevState => ({
            ...prevState,
            ...parsedSession,
            messages: parsedSession.messages || [],
            files: parsedSession.files || DEFAULT_PLUGIN_STRUCTURE
          }));
        } catch (error) {
          console.error('Error loading saved session:', error);
        }
      }
    }
  }, [workspaceId]);

  // Handlers for updating session state
  const setActiveFile = useCallback((file: AgentFile) => {
    setSessionState(prevState => ({
      ...prevState,
      activeFile: file
    }));
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setSessionState(prevState => {
      if (prevState.activeFile?.id === fileId) {
        return {
          ...prevState,
          activeFile: {
            ...prevState.activeFile,
            content,
            lastModified: new Date()
          }
        };
      }
      return prevState;
    });
  }, []);

  const updateFiles = useCallback((files: Record<string, FileNode>) => {
    setSessionState(prevState => ({
      ...prevState,
      files
    }));
  }, []);

  const addMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };
    
    setSessionState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, newMessage]
    }));
    
    return newMessage;
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setSessionState(prevState => ({
      ...prevState,
      isProcessing
    }));
  }, []);

  const saveSession = useCallback(() => {
    // Here you would typically save to an API
    // For now, just save to localStorage
    localStorage.setItem(`workspace-${sessionState.id}`, JSON.stringify({
      id: sessionState.id,
      messages: sessionState.messages,
      files: sessionState.files,
      selectedService: sessionState.selectedService,
      previewMode: sessionState.previewMode
    }));
  }, [sessionState]);

  // Auto-save session when state changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveSession();
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [sessionState, saveSession]);

  return {
    sessionState,
    layout,
    setLayout,
    setActiveFile,
    updateFileContent,
    updateFiles,
    addMessage,
    setProcessing,
    saveSession
  };
} 