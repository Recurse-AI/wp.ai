"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import CommentForm from "@/components/community/commentForm/CommentForm";
import styles from "./issueDetails.module.css";
import { getRandomAvatar } from "@/utils/avatarUtils";
import { IssueContext } from "@/context/IssueContext";
import Comment from "@/components/community/comment/Comment";
import { FaInfoCircle, FaTimes, FaEdit } from 'react-icons/fa';
import { formatDate } from '@/utils/dateUtils';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';
import TextEditor from '@/components/community/textEditor/TextEditor';

const IssueDetails = () => {
    const params = useParams();
    const { issues, API_BASE_URL, getAuthHeaders } = useContext(IssueContext);
    
    // Ensure `params.id` is a string before using it
    const issueId = params?.id ? params.id.toString() : null;
    const issue = issues.find(issue => issue.id.toString() === issueId);

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');

    // Fetch comments function
    const fetchComments = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/community/issues/${params.id}/comments/`,
                { headers: getAuthHeaders() }
            );
            
            if (response.status !== 404) {
                const data = await response.json();
                // Remove sorting, display comments in original order
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial comments fetch
    useEffect(() => {
        if (params.id) {
            fetchComments();
        }
    }, [params.id]);

    const handleCommentSubmit = async (commentText) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/comments/`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content: commentText,
                    issue: params.id,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to add comment");
            }

            // Fetch updated comments immediately after successful submission
            await fetchComments();

        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    const handleQuoteReply = (quotedText) => {
        // Scroll to comment form
        const commentForm = document.querySelector('#commentForm');
        if (commentForm) {
            commentForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Set the quoted text in the comment form
        setCommentText(quotedText);
    };

    const handleCommentUpdate = async (updatedComment) => {
        setComments(prevComments => 
            prevComments.map(comment => 
                comment.id === updatedComment.id ? updatedComment : comment
            )
        );
    };

    // Add handler for saving edited issue
    const handleSaveIssue = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/issues/${params.id}/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: editedTitle,
                    description: editedDescription
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update issue');
            }

            const updatedIssue = await response.json();
            // Update the local issue state
            const updatedIssues = issues.map(i => 
                i.id.toString() === params.id ? updatedIssue : i
            );
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating issue:', error);
        }
    };

    // Initialize edit state when issue loads
    useEffect(() => {
        if (issue) {
            setEditedTitle(issue.title);
            setEditedDescription(issue.description);
        }
    }, [issue]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className={styles.notFound}><h2>Error</h2><p>{error}</p></div>;
    if (!issue) return <div className={styles.notFound}><h2>Issue not found</h2></div>;

    // Only show edited if updated_at exists and is different from created_at
    const isIssueEdited = issue.updated_at && 
        new Date(issue.updated_at).getTime() > new Date(issue.created_at).getTime();

    const issueData = {
        ...issue,
        date: issue.created_at,
        author: issue.created_by.username,
        avatar: getRandomAvatar(issue.author),
        comments: issue.comments?.map(comment => ({
            ...comment,
            avatar: getRandomAvatar(comment.author),
            replies: comment.replies?.map(reply => ({
                ...reply,
                avatar: getRandomAvatar(reply.author),
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
