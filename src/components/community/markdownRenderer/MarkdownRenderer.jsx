import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './markdown.module.css';
import { FaRegCopy, FaCheck } from 'react-icons/fa';

const CodeBlock = ({ children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={styles.codeBlockWrapper}>
            <button 
                className={styles.copyButton}
                onClick={handleCopy}
                title="Copy to clipboard"
            >
                {isCopied ? <FaCheck /> : <FaRegCopy />}
            </button>
            {children}
        </div>
    );
};

const MarkdownRenderer = ({ content }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy content: ', err);
        }
    };

    // Pre-process the content to fix italic formatting
    const processedContent = content?.replace(/(?<!_)_([^_]+)_(?!_)/g, '*$1*');

    return (
        <div className={styles.contentWrapper}>
            <button 
                className={styles.contentCopyButton}
                onClick={handleCopyContent}
                title="Copy content"
            >
                {isCopied ? <FaCheck /> : <FaRegCopy />}
            </button>
            <div className={styles.markdown}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({node, children}) => (
                            <p className={styles.paragraph}>{children}</p>
                        ),
                        strong: ({node, children}) => (
                            <strong className={styles.strong}>{children}</strong>
                        ),
                        em: ({node, children}) => (
                            <em style={{
                                fontStyle: 'italic',
                                color: 'inherit',
                                backgroundColor: 'transparent',
                                padding: 0
                            }}>{children}</em>
                        ),
                        code: ({node, inline, className, children}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return inline ? (
                                <code className={styles.inlineCode}>
                                    {children}
                                </code>
                            ) : (
                                <CodeBlock>
                                    <pre className={styles.codeBlock}>
                                        <code className={match ? styles.codeWithLang : styles.code}>
                                            {children}
                                        </code>
                                    </pre>
                                </CodeBlock>
                            );
                        },
                        pre: ({node, children}) => (
                            <pre className={styles.codeBlock}>{children}</pre>
                        ),
                        blockquote: ({node, children}) => (
                            <blockquote className={styles.blockquote}>{children}</blockquote>
                        ),
                        ul: ({node, children}) => (
                            <ul className={styles.unorderedList}>{children}</ul>
                        ),
                        ol: ({node, children}) => (
                            <ol className={styles.orderedList}>{children}</ol>
                        ),
                        li: ({node, children}) => (
                            <li className={styles.listItem}>{children}</li>
                        ),
                        a: ({node, href, children}) => (
                            <a 
                                href={href}
                                className={styles.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {children}
                            </a>
                        )
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default MarkdownRenderer; 