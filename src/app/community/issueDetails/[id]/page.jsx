"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';
import CommentForm from '@/components/community/commentForm/CommentForm';
import { FaRegDotCircle } from 'react-icons/fa';
import styles from './issueDetails.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { IssueContext } from '@/context/IssueContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;

const IssueDetails = () => {
    const params = useParams();
    const { issues } = useContext(IssueContext);
    const issue = issues.find(issue => issue.id.toString() === params.id);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get auth headers
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

    // Fetch comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                if (!params.id) {
                    throw new Error('Issue ID is missing');
                }

                // Fetch comments
                const commentsResponse = await fetch(`${API_BASE_URL}/api/community/issues/${params.id}/comments/`, {
                    headers: getAuthHeaders()
                });
                
                if (commentsResponse.status !== 404) {
                    const commentsData = await commentsResponse.json();
                    setComments(commentsData);
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [params.id]);

    // Format date helper function
    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Handle new comment submission
    const handleCommentSubmit = async (commentText) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/comments/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content: commentText,
                    issue: params.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            // Refresh comments
            const commentsResponse = await fetch(`${API_BASE_URL}/api/community/issues/${params.id}/comments/`, {
                headers: getAuthHeaders()
            });
            
            if (commentsResponse.status !== 404) {
                const updatedComments = await commentsResponse.json();
                setComments(updatedComments);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className={styles.notFound}><h2>Error</h2><p>{error}</p></div>;
    if (!issue) return <div className={styles.notFound}><h2>Issue not found</h2></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span className={styles.titleText}>{issue.title || 'Untitled Issue'}</span>
                    <span className={styles.issueNumber}>#{params.id}</span>
                </h1>
                <div className={styles.issueMetadata}>
                    {/* <span className={`${styles.status} ${styles.open}`}>
                        <FaRegDotCircle />
                        {issue.status || 'open'}
                    </span> */}
                    <span className={styles.issueInfo}>
                        <strong>{issue.author?.username || 'Unknown User'}</strong> opened this issue on{' '}
                        {new Date(issue.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>

            {/* Issue Details Section */}
            <div className={styles.issueDetails}>
                <div className={styles.mainPost}>
                    <div className={styles.authorInfo}>
                        {/* <img 
                            src={getRandomAvatar(issue?.author?.username)} 
                            alt="Author avatar" 
                            className={styles.avatar} 
                        /> */}
                        <div className={styles.authorMeta}>
                            <span className={styles.authorName}>{issue?.author?.username}</span>
                            <span className={styles.timestamp}>
                                opened on {new Date(issue?.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className={styles.issueContent}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {issue?.description}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className={styles.commentsSection}>
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                {/* <img 
                                    src={getRandomAvatar(comment.author.username)} 
                                    alt="Commenter avatar" 
                                    className={styles.avatar} 
                                /> */}
                                <div className={styles.commentMeta}>
                                    <span className={styles.commenterName}>
                                        {comment.author.username}
                                    </span>
                                    <span className={styles.commentTime}>
                                        commented on {new Date(comment.created_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.commentContent}>
                                {comment.content}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noComments}>
                        <p>No comments yet</p>
                        <span>Be the first to comment on this issue!</span>
                    </div>
                )}
            </div>

            {/* Comment Form */}
            <div className={styles.commentFormSection}>
                <div className={styles.newCommentHeader}>
                    {/* <img 
                        src={getRandomAvatar("currentUser")} 
                        alt="Your avatar" 
                        className={styles.avatar} 
                    /> */}
                </div>
                <CommentForm 
                    onSubmit={handleCommentSubmit}
                    placeholder="Leave a comment"
                    buttonText="Comment"
                />
            </div>
        </div>
    );
};

export default IssueDetails;
