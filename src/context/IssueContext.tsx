"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { formatText } from "@/utils/textUtils";

export interface Comment {
    id: number;
    content: string;
    author: {
        username: string;
    };
    created_at: string;
    replies?: Comment[];
}

export interface Issue {
    id: number;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    created_by: {
        id: number;
        username: string;
    };
    comments?: Comment[];
}

export interface IssueContextType {
    issues: Issue[];
    addIssue: (newIssue: Partial<Issue>) => Promise<Issue>;
    isLoading: boolean;
    error: string | null;
    isLoaded: boolean;
    refetchIssues: () => Promise<void>;
    getAuthHeaders: () => HeadersInit;
    API_BASE_URL: string;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL as string;

// Helper function to get auth headers
export const getAuthHeaders = (): HeadersInit => {
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

export const IssueContext = createContext<IssueContextType | undefined>(undefined);

interface IssueProviderProps {
    children: React.ReactNode;
}

export const IssueProvider: React.FC<IssueProviderProps> = ({ children }) => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all issues
    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch issues');
            }
            
            const data = await response.json();
            setIssues(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching issues:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIssues([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new issue
    const addIssue = async (newIssue: Partial<Issue>): Promise<Issue> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newIssue),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create issue');
            }
            
            const data = await response.json();
            setIssues(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Error adding issue:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
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

    const contextValue: IssueContextType = {
        issues,
        addIssue,
        isLoading,
        error,
        isLoaded: isClient && !isLoading,
        refetchIssues: fetchIssues,
        getAuthHeaders,
        API_BASE_URL
    };

    return (
        <IssueContext.Provider value={contextValue}>
            {children}
        </IssueContext.Provider>
    );
};

export function useIssue() {
    const context = useContext(IssueContext);
    if (!context) {
        throw new Error("useIssue must be used within an IssueProvider");
    }
    return context;
} 