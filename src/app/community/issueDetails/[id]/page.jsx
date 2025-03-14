"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import CommentForm from "@/components/community/commentForm/CommentForm";
import styles from "./issueDetails.module.css";
import { getRandomAvatar } from "@/utils/avatarUtils";
import { IssueContext } from "@/context/IssueContext";
import IssueBox from "@/components/community/issueBox/IssueBox";
import Comment from "@/components/community/comment/Comment";
import { FaInfoCircle } from 'react-icons/fa';
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;

const IssueDetails = () => {
    const params = useParams();
    const { issues } = useContext(IssueContext);
    
    // Ensure `params.id` is a string before using it
    const issueId = params?.id ? params.id.toString() : null;
    const issue = issues.find(issue => issue.id.toString() === issueId);

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentText, setCommentText] = useState("");

    // Function to get auth headers
    const getAuthHeaders = () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            return {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };
        }
        return { "Content-Type": "application/json" };
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return "Invalid Date";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";

            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return "Invalid Date";
        }
    };

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

    if (loading) return <div>Loading...</div>;
    if (error) return <div className={styles.notFound}><h2>Error</h2><p>{error}</p></div>;
    if (!issue) return <div className={styles.notFound}><h2>Issue not found</h2></div>;
    // console.log(issue)
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
                    <h1>
                        <FaInfoCircle className={styles.infoIcon} />
                        {issueData.title}
                        <span className={styles.issueId}>#{issueData.id}</span>
                    </h1>
                    <div className={styles.issueInfo}>
                        <strong className={styles.highlightedAuthor}>
                            {issueData.author}
                        </strong> opened this issue on{" "}
                        {formatDate(issueData.date)}
                    </div>
                </div>
            </header>

            <div className={styles.mainComment}>
                <IssueBox
                    author={issueData.author}
                    date={issueData.created_at}
                    description={issueData.description}
                    avatar={issueData.avatar}
                />
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
