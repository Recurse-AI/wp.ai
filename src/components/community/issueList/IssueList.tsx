import React from "react";
import Link from "next/link";
import { FaRegCommentAlt, FaInfoCircle } from "react-icons/fa";
import styles from "./issueList.module.css";
import { formatDate } from '@/utils/dateUtils';
import MarkdownRenderer from '../markdownRenderer/MarkdownRenderer';
import { Issue } from "@/context/IssueContext";

interface User {
    id: number;
    username: string;
}

interface Comment {
    id: number;
    content: string;
    author: User;
    created_at: string;
    replies?: Comment[];
}

interface IssueListProps {
    issues: Issue[];
}

const truncateText = (text: string, maxLength: number = 280): string => {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    let result = truncated.slice(0, lastSpace).trim();

    const boldMatches = result.match(/\*\*/g);
    if (boldMatches && boldMatches.length % 2 !== 0) {
        result += '**';
    }

    const italicMatches = result.match(/_/g);
    if (italicMatches && italicMatches.length % 2 !== 0) {
        result += '_';
    }

    const codeMatches = result.match(/`/g);
    if (codeMatches && codeMatches.length % 2 !== 0) {
        result += '`';
    }

    return result + '...';
};

const cleanupReferences = (text: string): string => {
    return text.replace(/\[[a-z0-9]\]/gi, '');
};

const IssueList: React.FC<IssueListProps> = ({ issues }) => {
    if (issues.length === 0) {
        return (
            <div className={styles.noItems}>
                <h3>No items available</h3>
                <p>No issues match the selected filters</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {issues.map((issue) => {
                const commentCount = issue.comments?.length || 0;
                const cleanDescription = cleanupReferences(issue.description);
                const truncatedDescription = truncateText(cleanDescription);
                
                return (
                    <div key={issue.id} className={styles.issueItem}>
                        <div className={styles.header}>
                            <div className={styles.titleWrapper}>
                                <FaInfoCircle className={styles.infoIcon} />
                                <Link href={`community/issueDetails/${issue.id}`} className={styles.title}>
                                    {issue.title}
                                </Link>
                            </div>
                            <div className={styles.commentCount}>
                                <FaRegCommentAlt />
                                <span>{commentCount}</span>
                            </div>
                        </div>
                        <div className={styles.descriptionRow}>
                            <div className={styles.description}>
                                <MarkdownRenderer
                                    content={truncatedDescription}
                                    components={{
                                        p: ({children}) => <span>{children}</span>,
                                        strong: ({children}) => <strong>{children}</strong>,
                                        em: ({children}) => <em>{children}</em>,
                                        code: ({children}) => <code>{children}</code>,
                                        a: ({children}) => <span className={styles.link}>{children}</span>,
                                        img: () => null,
                                        pre: ({children}) => <span>{children}</span>,
                                        blockquote: ({children}) => <span>"{children}"</span>,
                                        ul: ({children}) => <ul className={styles.unorderedList}>{children}</ul>,
                                        ol: ({children}) => <ol className={styles.orderedList}>{children}</ol>,
                                        li: ({children}) => <li className={styles.listItem}>{children}</li>
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.meta}>
                            <span>#{issue.id}</span>
                            <span>by {issue.created_by.username}</span>
                            <span>
                                {formatDate(issue.created_at)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default IssueList; 