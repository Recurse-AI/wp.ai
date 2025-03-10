"use client";
import React, { createContext, useState, useEffect } from "react";
import { formatText } from "@/utils/textUtils";

export const IssueContext = createContext();

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;

export const IssueProvider = ({ children }) => {
    const [issues, setIssues] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
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
            setIssues(Array.isArray(data) ? data : []);  // Ensure issues is always an array
        } catch (err) {
            console.error('Error fetching issues:', err);
            setError(err.message);
            setIssues([]); // Set empty array on error
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

    // Update issue
    const updateIssue = async (id, updatedData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/${id}/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update issue');
            }
            
            const data = await response.json();
            setIssues(prev => prev.map(issue => 
                issue.id === id ? data : issue
            ));
            return data;
        } catch (err) {
            console.error('Error updating issue:', err);
            setError(err.message);
            throw err;
        }
    };

    // Get issue by ID
    const getIssueById = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/${id}/`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch issue');
            }
            
            return await response.json();
        } catch (err) {
            console.error('Error fetching issue:', err);
            setError(err.message);
            throw err;
        }
    };

    // Add comment to an issue
    const addComment = async (issueId, comment) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/${issueId}/add_comment/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(comment),
            });
            if (!response.ok) throw new Error('Failed to add comment');
            const data = await response.json();
            
            // Update the local state with the new comment
            setIssues(prev => prev.map(issue => {
                if (issue.id === issueId) {
                    return {
                        ...issue,
                        comments: [...issue.comments, data]
                    };
                }
                return issue;
            }));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Get all comments for an issue
    const getComments = async (issueId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/${issueId}/comments/`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();
            return data;
        } catch (err) {
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
            updateIssue,
            getIssueById,
            addComment,
            getComments,
            isLoading,
            error,
            isLoaded: isClient && !isLoading,
            refetchIssues: fetchIssues
        }}>
            {children}
        </IssueContext.Provider>
    );
};
