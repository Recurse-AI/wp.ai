"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { formatText } from "@/utils/textUtils";

interface IssueContextType {
    issues: any[];
    addIssue: (newIssue: any) => Promise<any>;
    isLoading: boolean;
    error: string | null;
    isLoaded: boolean;
    refetchIssues: () => Promise<void>;
    getAuthHeaders: () => Record<string, string | undefined>;
    API_BASE_URL: string | undefined;
}

export const IssueContext = createContext<IssueContextType | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to get auth headers
export const getAuthHeaders = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
    return {
        'Content-Type': 'application/json'
    };
};

// Custom hook to use the Issue context
export const useIssue = () => {
    const context = useContext(IssueContext);
    if (context === undefined) {
        throw new Error('useIssue must be used within an IssueProvider');
    }
    return context;
};

export const IssueProvider = ({ children }: { children: React.ReactNode }) => {
    const [issues, setIssues] = useState<any[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all issues
    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
                headers: getAuthHeaders() as HeadersInit
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch issues');
            }
            
            const data = await response.json();
            setIssues(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching issues:', err);
            setError(err.message);
            setIssues([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new issue
    const addIssue = async (newIssue: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
                method: 'POST',
                headers: getAuthHeaders() as HeadersInit,
                body: JSON.stringify(newIssue),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create issue');
            }
            
            const data = await response.json();
                setIssues(prev => [...prev, data]);
            return data;
        } catch (err: any) {
            console.error('Error adding issue:', err);
            setError(err.message);
            throw err;
        }
    };

    // Initial setup
    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            fetchIssues();
        }
    }, []);

    return (
        <IssueContext.Provider value={{ 
            issues,
            addIssue,
            isLoading,
            error,
            isLoaded: isClient && !isLoading,
            refetchIssues: fetchIssues,
            getAuthHeaders,
            API_BASE_URL
        }}>
            {children}
        </IssueContext.Provider>
    );
};
