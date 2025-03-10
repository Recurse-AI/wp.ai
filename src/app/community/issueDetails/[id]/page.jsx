"use client";

import React, { useContext } from 'react';
import { useParams } from 'next/navigation';
import { IssueContext } from '@/context/IssueContext';
import IssueBox from '@/components/community/issueBox/IssueBox';
import Comment from '@/components/community/comment/Comment';
import CommentForm from '@/components/community/commentForm/CommentForm';
import { FaRegDotCircle, FaRegCheckCircle } from 'react-icons/fa';
import styles from './issueDetails.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';

const IssueDetails = () => {
    const params = useParams();
    const { getIssueById, addComment } = useContext(IssueContext);
    const issue = getIssueById(parseInt(params.id));

    if (!issue) {
        return (
            <div className={styles.notFound}>
                <h2>Issue not found</h2>
                <p>The issue you're looking for doesn't exist or has been moved.</p>
            </div>
        );
    }

    const handleCommentSubmit = (commentText, parentCommentId = null) => {
        const newComment = {
            id: Date.now(),
            text: commentText,
            author: "currentUser",
            date: new Date().toISOString(),
            avatar: getRandomAvatar("currentUser"),
            replies: []
        };
        addComment(issue.id, newComment, parentCommentId);
    };

    const issueData = {
        ...issue,
        avatar: getRandomAvatar(issue.author),
        comments: issue.comments.map(comment => ({
            ...comment,
            avatar: getRandomAvatar(comment.author),
            replies: comment.replies?.map(reply => ({
                ...reply,
                avatar: getRandomAvatar(reply.author)
            }))
        }))
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>
                        {issueData.title}
                        <span className={styles.issueId}>#{issueData.id}</span>
                    </h1>
                    <div className={styles.issueStatus}>
                        <span className={`${styles.status} ${styles[issueData.status]}`}>
                            {issueData.status === 'open' ? (
                                <FaRegDotCircle className={styles.statusIcon} />
                            ) : (
                                <FaRegCheckCircle className={styles.statusIcon} />
                            )}
                            {issueData.status}
                        </span>
                        <span className={styles.issueInfo}>
                            <strong>{issueData.author}</strong> opened this issue on{' '}
                            {new Date(issueData.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </header>

            <div className={styles.timeline}>
                <div className={styles.mainComment}>
                    <IssueBox
                        author={issueData.author}
                        date={issueData.date}
                        description={issueData.description}
                        avatar={issueData.avatar}
                    />
                </div>

                {issueData.comments && issueData.comments.length > 0 ? (
                    <div className={styles.comments}>
                        {issueData.comments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                onReply={handleCommentSubmit}
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

            <div className={styles.addComment}>
                <CommentForm 
                    onSubmit={(text) => handleCommentSubmit(text)}
                    placeholder="Leave a comment"
                    buttonText={issueData.status === 'open' ? 'Comment' : 'Comment and Reopen'}
                />
            </div>
        </div>
    );
};

export default IssueDetails;
