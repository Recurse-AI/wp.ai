"use client";
import React, { createContext, useState, useEffect } from "react";
import { formatText } from "@/utils/textUtils";

export const IssueContext = createContext();

const STORAGE_KEY = 'github_issues';

// Format the initial data
const initialIssues = [
    {
        id: 1,
        title: "Bug in authentication flow",
        author: "johndoe",
        date: "2024-03-15",
        status: "open",
        description: "Users are getting logged out randomly.\n\nThis needs to be fixed ASAP.",
        formattedDescription: "Users are getting logged out randomly.\n\nThis needs to be fixed ASAP.",
        avatar: "https://avatars.githubusercontent.com/u/1?v=4",
        comments: []
    },
    {
        id: 2,
        title: "Update documentation",
        author: "janedoe",
        date: "2024-03-14",
        status: "closed",
        description: "Documentation needs to be updated for v2.0\n\nPlease review the API changes.",
        formattedDescription: "Documentation needs to be updated for v2.0\n\nPlease review the API changes.",
        avatar: "https://avatars.githubusercontent.com/u/2?v=4",
        comments: []
    }
];

export const IssueProvider = ({ children }) => {
    // Track if we're on the client side
    const [isClient, setIsClient] = useState(false);
    // Initialize with empty array to match server-side rendering
    const [issues, setIssues] = useState([]);

    // Set isClient to true once component mounts (client-side only)
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Only load from localStorage on the client side
    useEffect(() => {
        if (!isClient) return;
        
        try {
            const storedIssues = localStorage.getItem(STORAGE_KEY);
            if (storedIssues) {
                const parsedIssues = JSON.parse(storedIssues);
                // Ensure all issues have formatted descriptions
                const formattedIssues = parsedIssues.map(issue => ({
                    ...issue,
                    formattedDescription: formatText(issue.description)
                }));
                setIssues(formattedIssues);
            } else {
                setIssues(initialIssues);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initialIssues));
            }
        } catch (error) {
            console.error("Error loading issues from localStorage:", error);
            setIssues(initialIssues);
        }
    }, [isClient]);

    // Only save to localStorage on the client side when issues change
    useEffect(() => {
        if (!isClient) return;
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
        } catch (error) {
            console.error("Error saving issues to localStorage:", error);
        }
    }, [issues, isClient]);

    const addIssue = (newIssue) => {
        setIssues(prev => {
            const issueWithFormatting = {
                ...newIssue,
                id: prev.length + 1,
                formattedDescription: formatText(newIssue.description)
            };
            return [...prev, issueWithFormatting];
        });
    };

    const updateIssue = (id, updatedData) => {
        setIssues(prev => prev.map(issue => 
            issue.id === id ? {
                ...issue,
                ...updatedData,
                formattedDescription: formatText(updatedData.description || issue.description)
            } : issue
        ));
    };

    const getIssueById = (id) => {
        return issues.find(issue => issue.id === Number(id));
    };

    const addComment = (issueId, comment, parentCommentId = null) => {
        setIssues(prev => prev.map(issue => {
            if (issue.id === issueId) {
                if (!parentCommentId) {
                    // Add top-level comment
                    return {
                        ...issue,
                        comments: [...(issue.comments || []), { ...comment, replies: [] }]
                    };
                } else {
                    // Add nested reply
                    return {
                        ...issue,
                        comments: issue.comments.map(c => {
                            if (c.id === parentCommentId) {
                                return {
                                    ...c,
                                    replies: [...(c.replies || []), comment]
                                };
                            }
                            return c;
                        })
                    };
                }
            }
            return issue;
        }));
    };

    return (
        <IssueContext.Provider value={{ 
            issues, 
            addIssue, 
            updateIssue, 
            getIssueById,
            addComment,
            isLoaded: isClient // Add this to let components know when data is ready
        }}>
            {children}
        </IssueContext.Provider>
    );
};
