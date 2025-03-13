import React, { useContext } from "react";
import Link from "next/link";
import { FaRegCommentAlt, FaInfoCircle } from "react-icons/fa";
import styles from "./issueList.module.css";
import { getTotalCommentCount } from "@/utils/commentUtils";
import { IssueContext } from "@/context/IssueContext";
import { formatDate } from '@/utils/dateUtils';
import MarkdownRenderer from '../markdownRenderer/MarkdownRenderer';

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
                                        p: ({node, children}) => <span>{children}</span>,
                                        strong: ({node, children}) => <strong>{children}</strong>,
                                        em: ({node, children}) => <em>{children}</em>,
                                        code: ({node, children}) => <code>{children}</code>,
                                        a: ({node, children}) => <span className={styles.link}>{children}</span>,
                                        img: () => null,
                                        pre: ({node, children}) => <span>{children}</span>,
                                        blockquote: ({node, children}) => <span>"{children}"</span>,
                                        ul: ({node, children}) => <ul className={styles.unorderedList}>{children}</ul>,
                                        ol: ({node, children}) => <ol className={styles.orderedList}>{children}</ol>,
                                        li: ({node, children}) => <li className={styles.listItem}>{children}</li>
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.meta}>
                            <span>#{issue.id}</span>
                            <span>by {issue.created_by.username}</span>
                            <span>
                                opened {formatDate(issue.created_at)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default IssueList;
