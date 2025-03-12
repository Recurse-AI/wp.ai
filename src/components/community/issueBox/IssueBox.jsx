import React from "react";
import styles from "./issueBox.module.css";
import { FaEllipsisH } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRandomAvatar } from '@/utils/avatarUtils';

const IssueBox = ({ author, date, description, avatar }) => {
    const formattedDate = new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className={styles.commentContainer}>

            {/* Comment Box */}
            <div className={styles.commentBox}>
                {/* Comment Header */}
                <div className={styles.commentHeader}>
                    <span>
                        <strong>{author}</strong> 
                        <span className={styles.commentDate}>
                            opened on {formattedDate}
                        </span>
                    </span>
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
                            ul: ({node, ...props}) => <ul className={styles.unorderedList} {...props} />,
                            ol: ({node, ...props}) => <ol className={styles.orderedList} {...props} />,
                            li: ({node, ...props}) => <li className={styles.listItem} {...props} />
                        }}
                    >
                        {description}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default IssueBox;
