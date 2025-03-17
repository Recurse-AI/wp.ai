"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { communityApi, Issue, Comment } from "@/lib/services/communityApi";
export type { Issue, Comment } from "@/lib/services/communityApi";

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

    // Fetch all issues using communityApi
    const fetchIssues = async () => {
        try {
            setIsLoading(true);
            const data = await communityApi.fetchIssues();
            setIssues(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching issues:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIssues([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new issue using communityApi
    const addIssue = async (newIssue: Partial<Issue>): Promise<Issue> => {
        try {
            const data = await communityApi.addIssue(newIssue);
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