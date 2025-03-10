import React from "react";
import styles from "./issueBox.module.css";
import { FaEllipsisH } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRandomAvatar } from '@/utils/avatarUtils';
import { formatDate } from '@/utils/dateUtils';

const IssueBox = ({ issue }) => {
    return (
        <div className={styles.commentContainer}>
            {/* User Avatar */}
            <img 
                src={getRandomAvatar(issue.created_by.username)} 
                alt={`${issue.created_by.username}'s avatar`} 
                className={styles.avatar} 
            />

            {/* Comment Box */}
            <div className={styles.commentBox}>
                {/* Comment Header */}
                <div className={styles.commentHeader}>
                    <span>
                        <strong>{issue.created_by.username}</strong> 
                        <span className={styles.commentDate}>opened on {formatDate(issue.created_at)}</span>
                    </span>
                    <FaEllipsisH className={styles.moreOptions} />
                </div>

                {/* Comment Content */}
                <div className={styles.commentText}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <p className={styles.paragraph} {...props} />,
                            strong: ({node, ...props}) => <strong className={styles.strong} {...props} />,
                            em: ({node, ...props}) => <em className={styles.italic} {...props} />,
                            code: ({node, ...props}) => <code className={styles.code} {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className={styles.blockquote} {...props} />,
                            ul: ({node, ...props}) => <ul className={styles.list} {...props} />,
                            ol: ({node, ...props}) => <ol className={styles.list} {...props} />
                        }}
                    >
                        {issue.description}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default IssueBox;
