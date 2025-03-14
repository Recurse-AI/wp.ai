"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the types for our context
export interface ActiveSession {
  id: string;
  title: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface ActiveSessionContextType {
  activeSession: ActiveSession | null;
  setActiveSession: (session: ActiveSession | null) => void;
  clearActiveSession: () => void;
}

// Create the context with a default value
const ActiveSessionContext = createContext<ActiveSessionContextType>({
  activeSession: null,
  setActiveSession: () => {},
  clearActiveSession: () => {},
});

// Create a custom hook to use the context
export const useActiveSession = () => useContext(ActiveSessionContext);

// Create the provider component
export const ActiveSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State to hold the active session
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Load active session from local storage on mount (client-side only)
  useEffect(() => {
    const storedSession = localStorage.getItem('activeSession');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setActiveSession(parsedSession);
      } catch (error) {
        console.error('Failed to parse stored active session:', error);
        localStorage.removeItem('activeSession');
      }
    }
  }, []);

  // Save active session to local storage whenever it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('activeSession', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('activeSession');
    }
  }, [activeSession]);

  // Function to clear the active session
  const clearActiveSession = () => {
    setActiveSession(null);
  };

  const value = {
    activeSession,
    setActiveSession,
    clearActiveSession,
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
};

export default ActiveSessionProvider; 