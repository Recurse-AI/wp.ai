import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './markdown.module.css';
import { FaRegCopy, FaCheck } from 'react-icons/fa';

interface CodeBlockProps {
    children: React.ReactNode;
}

interface MarkdownRendererProps {
    content: string;
    components?: Record<string, React.ComponentType<any>>;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (typeof children === 'string') {
                await navigator.clipboard.writeText(children);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
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

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, components }) => {
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

    const processedContent = content?.replace(/(?<!_)_([^_]+)_(?!_)/g, '*$1*');

    const defaultComponents = {
        p: ({children}: {children: React.ReactNode}) => (
            <p className={styles.paragraph}>{children}</p>
        ),
        strong: ({children}: {children: React.ReactNode}) => (
            <strong className={styles.strong}>{children}</strong>
        ),
        em: ({children}: {children: React.ReactNode}) => (
            <em style={{
                fontStyle: 'italic',
                color: 'inherit',
                backgroundColor: 'transparent',
                padding: 0
            }}>{children}</em>
        ),
        code: ({node, inline, className, children}: {
            node?: any;
            inline?: boolean;
            className?: string;
            children: React.ReactNode;
        }) => {
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
        ...components
    };

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
                    components={defaultComponents}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default MarkdownRenderer; 