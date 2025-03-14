import React from "react";
import styles from "./issueBox.module.css";
import { FaEllipsisH } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRandomAvatar } from '@/utils/avatarUtils';
import MarkdownRenderer from '@/components/community/markdownRenderer/MarkdownRenderer';

const IssueBox = ({ author, date, description, avatar }) => {
    const formattedDate = new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className={styles.commentContainer}>
            <div className={styles.commentBox}>
                <div className={styles.commentText}>
                    <MarkdownRenderer content={description} />
                </div>
            </div>
        </div>
    );
};

export default IssueBox;
