"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import CommentForm from "@/components/community/comment/CommentForm";
import styles from "./issueDetails.module.css";
import { getRandomAvatar } from "@/utils/avatarUtils";
import { IssueContext } from "@/context/IssueContext";
import Comment from "@/components/community/comment/Comment";
import { FaInfoCircle, FaTimes, FaEdit } from 'react-icons/fa';
import { formatDate } from '@/utils/dateUtils';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';
import TextEditor from '@/components/community/textEditor/TextEditor';

interface Comment {
    id: number;
    content: string;
    created_at: string;
    author: {
        username: string;
    };
    replies?: Comment[];
}

interface Issue {
    id: number;
    title: string;
    description: string;
    created_at: string;
    updated_at?: string;
    created_by: {
        username: string;
    };
    comments?: Comment[];
}

interface IssueData extends Issue {
    date: string;
    author: string;
    avatar: string;
    comments?: Comment[];
}

const IssueDetails: React.FC = () => {
    const params = useParams();
    const context = useContext(IssueContext);
    
    if (!context) {
        throw new Error("IssueDetails must be used within an IssueProvider");
    }

    const { issues, API_BASE_URL, getAuthHeaders, refetchIssues } = context;
    
    const issueId = params?.id ? params.id.toString() : null;
    const issue = issues.find((issue: Issue) => issue.id.toString() === issueId);

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');

    useEffect(() => {
        if (issue) {
            setEditedTitle(issue.title);
            setEditedDescription(issue.description);
        }
    }, [issue]);

    const handleSaveIssue = () => {
        const headers = new Headers();
        const authHeaders = getAuthHeaders();
        Object.entries(authHeaders).forEach(([key, value]) => {
            if (value !== undefined) {
                headers.append(key, value);
            }
        });

        fetch(`${API_BASE_URL}/api/community/issues/${params.id}/`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                title: editedTitle,
                description: editedDescription
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update issue');
            }
            return refetchIssues();
        })
        .then(() => {
            setIsEditing(false);
        })
        .catch(error => {
            console.error('Error updating issue:', error instanceof Error ? error.message : 'An error occurred');
        });
    };

    const fetchComments = () => {
        const headers = new Headers();
        const authHeaders = getAuthHeaders();
        Object.entries(authHeaders).forEach(([key, value]) => {
            if (value !== undefined) {
                headers.append(key, value);
            }
        });

        fetch(`${API_BASE_URL}/api/community/issues/${params.id}/comments/`, { 
            headers
        })
        .then(response => {
            if (response.status !== 404) {
                return response.json();
            }
            return [];
        })
        .then(data => {
            setComments(data);
        })
        .catch(error => {
            console.error("Error fetching comments:", error);
            setError(error instanceof Error ? error.message : "An error occurred");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        if (params.id) {
            fetchComments();
        }
    }, [params.id]);

    const handleCommentSubmit = (commentText: string) => {
        const headers = new Headers();
        const authHeaders = getAuthHeaders();
        Object.entries(authHeaders).forEach(([key, value]) => {
            if (value !== undefined) {
                headers.append(key, value);
            }
        });

        fetch(`${API_BASE_URL}/api/community/comments/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                content: commentText,
                issue: params.id,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to add comment");
            }
            fetchComments();
        })
        .catch(error => {
            console.error("Error submitting comment:", error);
        });
    };

    const handleQuoteReply = (quotedText: string) => {
        const commentForm = document.querySelector('#commentForm');
        if (commentForm) {
            commentForm.scrollIntoView({ behavior: 'smooth' });
        }
        setCommentText(quotedText);
    };

    const handleCommentUpdate = (updatedComment: Comment) => {
        setComments(prevComments => 
            prevComments.map(comment => 
                comment.id === updatedComment.id ? updatedComment : comment
            )
        );
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className={styles.notFound}><h2>Error</h2><p>{error}</p></div>;
    if (!issue) return <div className={styles.notFound}><h2>Issue not found</h2></div>;

    const isIssueEdited = issue.updated_at && 
        new Date(issue.updated_at).getTime() > new Date(issue.created_at).getTime();

    const issueData: IssueData = {
        ...issue,
        date: issue.created_at,
        author: issue.created_by.username,
        avatar: getRandomAvatar(issue.created_by.username),
        comments: issue.comments?.map((comment: Comment) => ({
            ...comment,
            avatar: getRandomAvatar(comment.author.username),
            replies: comment.replies?.map((reply: Comment) => ({
                ...reply,
                avatar: getRandomAvatar(reply.author.username),
            })),
        })),
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    {isEditing ? (
                        <div className={styles.editTitleSection}>
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className={styles.titleInput}
                            />
                        </div>
                    ) : (
                        <h1>
                            <FaInfoCircle className={styles.infoIcon} />
                            {issueData.title}
                            <span className={styles.issueId}>#{issueData.id}</span>
                        </h1>
                    )}
                    <div className={styles.issueInfo}>
                        <strong className={styles.highlightedAuthor}>
                            {issueData.author}
                        </strong> opened on {formatDate(issueData.date)}
                        {isIssueEdited && <span className={styles.editedLabel}> (edited)</span>}
                        <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={styles.editButton}
                            title={isEditing ? "Cancel" : "Edit"}
                        >
                            {isEditing ? <FaTimes /> : <FaEdit />}
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles.mainContent}>
                <div className={styles.commentContainer}>
                    <div className={styles.commentBox}>
                        <div className={styles.commentText}>
                            {isEditing ? (
                                <div className={styles.editDescriptionSection}>
                                    <TextEditor
                                        value={editedDescription}
                                        onChange={setEditedDescription}
                                        placeholder="Edit issue description"
                                    />
                                    <button 
                                        onClick={handleSaveIssue} 
                                        className={styles.saveButton}
                                    >
                                        Save changes
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.markdownWrapper}>
                                    <MarkdownRenderer content={issueData.description} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.commentsHeader}>
                <h3>Comments:</h3>
            </div>

            <div className={styles.timeline}>
                {comments.length > 0 ? (
                    <div className={styles.comments}>
                        {comments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                onQuoteReply={handleQuoteReply}
                                onCommentUpdate={handleCommentUpdate}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.noComments}>
                        <p>No comments yet</p>
                        <span>Be the first to comment on this issue!</span>
                    </div>
                )}
            </div>

            <div id="commentForm" className={styles.addComment}>
                <CommentForm
                    onSubmit={handleCommentSubmit}
                    placeholder="Leave a comment"
                    buttonText="Comment"
                    value={commentText}
                    onChange={setCommentText}
                />
            </div>
        </div>
    );
};

export default IssueDetails;