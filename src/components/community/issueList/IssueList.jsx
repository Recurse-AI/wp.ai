import React, { useContext } from "react";
import Link from "next/link";
import { FaCheckCircle, FaRegCommentAlt } from "react-icons/fa";
import styles from "./issueList.module.css";
import { getTotalCommentCount } from "@/utils/commentUtils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IssueContext } from "@/context/IssueContext";
import { formatDate } from '@/utils/dateUtils';

const truncateText = (text, maxLength = 280) => {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    let result = truncated.slice(0, lastSpace).trim();

    // Check for unclosed markdown tags and close them
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

const cleanupReferences = (text) => {
    // Remove reference markers like [a], [b], [1], etc.
    return text.replace(/\[[a-z0-9]\]/gi, '');
};

const IssueList = ({ issues }) => {
    const { isLoaded } = useContext(IssueContext);
    
    // Show loading state until client-side hydration is complete
    if (!isLoaded) {
        return <div className={styles.loading}>Loading issues...</div>;
    }
    
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
                const commentCount = getTotalCommentCount(issue);
                const cleanDescription = cleanupReferences(issue.description);
                const truncatedDescription = truncateText(cleanDescription);
                
                return (
                    <div key={issue.id} className={styles.issueItem}>
                        <div className={styles.icon}>
                            <FaCheckCircle className={styles.checkIcon} />
                        </div>
                        <div className={styles.content}>
                            <Link href={`community/issueDetails/${issue.id}`} className={styles.title}>
                                {issue.title}
                            </Link>
                            <div className={styles.descriptionRow}>
                                <div className={styles.description}>
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({node, children}) => <span>{children}</span>,
                                            strong: ({node, children}) => <strong className={styles.strong}>{children}</strong>,
                                            em: ({node, children}) => <em className={styles.italic}>{children}</em>,
                                            code: ({node, children}) => <code className={styles.code}>{children}</code>,
                                            a: ({node, children}) => <span className={styles.link}>{children}</span>,
                                            img: () => null,
                                            pre: ({node, children}) => <span>{children}</span>,
                                            blockquote: ({node, children}) => <span>"{children}"</span>,
                                            ul: ({node, children}) => <span>{children}</span>,
                                            ol: ({node, children}) => <span>{children}</span>,
                                            li: ({node, children}) => <span>{children} </span>,
                                            sup: ({node, children}) => null
                                        }}
                                    >
                                        {truncatedDescription}
                                    </ReactMarkdown>
                                </div>
                                <div className={styles.commentCount}>
                                    <FaRegCommentAlt />
                                    <span>{commentCount}</span>
                                </div>
                            </div>
                            <div className={styles.meta}>
                                <span>#{issue.id}</span>
                                <span>by {issue.created_by.username}</span>
                                <span>
                                    {issue.status === 'closed' ? 'was closed on' : 'opened'} {formatDate(issue.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default IssueList;
