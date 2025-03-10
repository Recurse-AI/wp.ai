import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './comment.module.css';
import CommentForm from '../commentForm/CommentForm';
import { getRandomAvatar } from '@/utils/avatarUtils';

const Comment = ({ comment, onReply, level = 0 }) => {
    const [isReplying, setIsReplying] = useState(false);

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    const handleReply = (text) => {
        onReply(text, comment.id);
        setIsReplying(false);
    };

    return (
        <div className={`${styles.comment} ${styles[`level-${level}`]}`}>
            <div className={styles.commentContainer}>
                <img 
                    src={getRandomAvatar(comment.author)} 
                    alt={`${comment.author}'s avatar`} 
                    className={styles.avatar} 
                />
                <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                        <span className={styles.author}>{comment.author}</span>
                        <span className={styles.date}>{formatDate(comment.date)}</span>
                    </div>
                    <div className={styles.commentText}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({node, ...props}) => <p className={styles.paragraph} {...props} />,
                                code: ({node, ...props}) => <code className={styles.code} {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className={styles.blockquote} {...props} />,
                                ul: ({node, ...props}) => <ul className={styles.list} {...props} />,
                                ol: ({node, ...props}) => <ol className={styles.list} {...props} />
                            }}
                        >
                            {comment.text}
                        </ReactMarkdown>
                    </div>
                    <button 
                        className={styles.replyButton}
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        Reply
                    </button>
                </div>
            </div>

            {isReplying && (
                <div className={styles.replyForm}>
                    <CommentForm 
                        onSubmit={handleReply}
                        placeholder="Write a reply..."
                        buttonText="Reply"
                    />
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className={styles.replies}>
                    {comment.replies.map(reply => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            level={Math.min(level + 1, 3)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment; 