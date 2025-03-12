import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './comment.module.css';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { FaEllipsisH } from 'react-icons/fa';

const Comment = ({ comment }) => {
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

    return (
        <div className={styles.comment}>
            <div className={styles.commentContainer}>
                <div className={styles.commentContent}>
                    <div className={styles.commentHeader}>
                        <div className={styles.headerInfo}>
                            <span className={styles.author}>{comment.author.username}</span>
                            <span className={styles.date}>commented on {formatDate(comment.created_at)}</span>
                        </div>
                        {/* <div className={styles.headerActions}>
                            <FaEllipsisH className={styles.moreOptions} />
                        </div> */}
                    </div>
                    <div className={styles.commentText}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({node, ...props}) => <p className={styles.paragraph} {...props} />,
                                code: ({node, ...props}) => <code className={styles.code} {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className={styles.blockquote} {...props} />,
                                ul: ({node, ...props}) => <ul className={styles.unorderedList} {...props} />,
                                ol: ({node, ...props}) => <ol className={styles.orderedList} {...props} />,
                                li: ({node, ...props}) => <li className={styles.listItem} {...props} />,
                                a: ({node, href, ...props}) => (
                                    <a 
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.link}
                                        {...props}
                                    />
                                )
                            }}
                        >
                            {comment.content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Comment; 