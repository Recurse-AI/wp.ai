import TokenManager from '../tokenManager';
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL as string;

// Get auth headers using TokenManager
const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await TokenManager.getValidToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Types
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

// API Functions
export const communityApi = {
    // Issues
    fetchIssues: async () => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
            headers
        });
        if (!response.ok) throw new Error('Failed to fetch issues');
        return response.json();
    },

    addIssue: async (newIssue: Partial<Issue>) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/community/issues/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newIssue),
        });
        if (!response.ok) throw new Error('Failed to create issue');
        return response.json();
    },

    updateIssue: async (issueId: number, updates: Partial<Issue>) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/community/issues/${issueId}/`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update issue');
        return response.json();
    },

    // Comments
    fetchComments: async (issueId: number) => {
        const headers = await getAuthHeaders();
        const response = await fetch(
            `${API_BASE_URL}/api/community/issues/${issueId}/comments/`,
            { headers }
        );
        if (!response.ok && response.status !== 404) {
            throw new Error('Failed to fetch comments');
        }
        return response.json();
    },

    addComment: async (issueId: number, content: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/community/comments/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content,
                issue: issueId,
            }),
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return response.json();
    },

    updateComment: async (commentId: number, content: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/api/community/comments/${commentId}/`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error('Failed to update comment');
        return response.json();
    }
};