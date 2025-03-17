"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './comment.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { FaEllipsisH, FaQuoteRight, FaEdit, FaTimes } from 'react-icons/fa';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';
import TextEditor from '@/components/community/textEditor/TextEditor';
import { formatDate } from '@/utils/dateUtils';
import { useIssue } from '@/context/IssueContext';
import { communityApi, type Comment as CommentType } from '@/lib/services/communityApi';

interface CommentProps {
    comment: CommentType;
    onQuoteReply: (replyText: string) => void;
    onCommentUpdate: (updatedComment: CommentType) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, onQuoteReply, onCommentUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isEdited, setIsEdited] = useState(false);

    const handleQuoteReply = () => {
        // Format the comment content as a quote
        const quotedText = comment.content
            .split('\n')
            .map((line: string) => `> ${line}`)
            .join('\n');
            
        const replyText = `${quotedText}\n\n`; // Add newlines after quote
        onQuoteReply(replyText);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditedContent(comment.content);
        }
    };

    const handleSave = async () => {
        try {
            const updatedComment = await communityApi.updateComment(comment.id, editedContent);
            onCommentUpdate(updatedComment);
            setIsEditing(false);
            setIsEdited(true);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    return (
        <div className={styles.comment}>
            <div className={styles.commentContainer}>
                <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                        <div className={styles.headerInfo}>
                            <strong className={styles.highlightedAuthor}>
                                {comment.author.username}
                            </strong>
                            <span className={styles.date}>
                                commented on {formatDate(comment.created_at)}
                            </span>
                            {isEdited && <span className={styles.editedLabel}> (edited)</span>}
                        </div>
                        <div className={styles.headerActions}>
                            <button 
                                onClick={handleQuoteReply}
                                className={styles.quoteButton}
                                title="Quote reply"
                            >
                                <FaQuoteRight />
                            </button>
                            <button 
                                onClick={handleEditToggle}
                                className={styles.editButton}
                                title={isEditing ? "Cancel" : "Edit"}
                            >
                                {isEditing ? <FaTimes /> : <FaEdit />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.commentText}>
                        {isEditing ? (
                            <div className={styles.editDescriptionSection}>
                                <TextEditor
                                    value={editedContent}
                                    onChange={setEditedContent}
                                    placeholder="Edit your comment"
                                />
                                <button 
                                    onClick={handleSave} 
                                    className={styles.saveButton}
                                >
                                    Save changes
                                </button>
                            </div>
                        ) : (
                            <MarkdownRenderer content={comment.content} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Comment; 