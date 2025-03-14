import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './comment.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { FaEllipsisH, FaQuoteRight, FaEdit, FaTimes } from 'react-icons/fa';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';
import TextEditor from '@/components/community/textEditor/TextEditor';
import { formatDate } from '@/utils/dateUtils';
import { IssueContext } from '@/context/IssueContext';

const Comment = ({ comment, onQuoteReply, onCommentUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const { API_BASE_URL, getAuthHeaders } = useContext(IssueContext);

    // Only show edited if updated_at exists and is different from created_at
    const isCommentEdited = comment.updated_at && 
        new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime();

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

    const handleSave = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/community/comments/${comment.id}/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content: editedContent
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update comment');
            }

            const updatedComment = await response.json();
            onCommentUpdate(updatedComment);
            setIsEditing(false);
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
                            {isCommentEdited && <span className={styles.editedLabel}> (edited)</span>}
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