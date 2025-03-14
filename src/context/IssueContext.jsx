"use client";
import React, { createContext, useState, useEffect } from "react";
import { formatText } from "@/utils/textUtils";

export const IssueContext = createContext();

export const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;

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

export const IssueProvider = ({ children }) => {
    const [issues, setIssues] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
            setError(err.message);
            setIssues([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add new issue
    const addIssue = async (newIssue) => {
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
