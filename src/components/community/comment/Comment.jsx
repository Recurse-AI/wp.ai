import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './comment.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { FaEllipsisH, FaQuoteRight, FaEdit, FaTimes } from 'react-icons/fa';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';
import TextEditor from '@/components/community/textEditor/TextEditor';

const Comment = ({ comment, onQuoteReply }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isEdited, setIsEdited] = useState(false);

    // Format date helper function
    const formatDate = (dateString) => {
        if (!dateString) return "Date not available";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return "Date not available";
        }
    };

    const handleQuoteReply = () => {
        // Format the comment content as a quote
        const quotedText = comment.content
            .split('\n')
            .map(line => `> ${line}`)
            .join('\n');
            
        const replyText = `${quotedText}\n\n`; // Add newlines after quote
        onQuoteReply(replyText);
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        // Here you would typically send the edited content to the server
        setIsEditing(false);
        setIsEdited(true);
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
                                className={styles.quoteButton}
                                title={isEditing ? "Cancel" : "Edit"}
                            >
                                {isEditing ? <FaTimes /> : <FaEdit />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.commentText}>
                        {isEditing ? (
                            <TextEditor
                                value={editedContent}
                                onChange={setEditedContent}
                                placeholder="Edit your comment"
                            />
                        ) : (
                            <MarkdownRenderer content={editedContent} />
                        )}
                    </div>
                    {isEditing && (
                        <button onClick={handleSave} className={styles.saveButton}>
                            Save
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Comment; 