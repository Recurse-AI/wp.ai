import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './textEditor.module.css';
import { FaBold, FaItalic, FaCode, FaListUl, FaListOl, FaQuoteLeft, FaLink, FaEye, FaEdit } from 'react-icons/fa';

const TextEditor = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef(null);
    const [isPreview, setIsPreview] = useState(false);

    const insertFormat = (format, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        let prefix = '';
        let suffix = '';
        let defaultText = '';
        let selectedText = text.substring(start, end);
        let replacement = '';

        switch (format) {
            case 'bold':
                // Handle multi-paragraph bold text
                if (selectedText) {
                    replacement = selectedText
                        .split('\n')
                        .map(line => {
                            const trimmed = line.trim();
                            return trimmed ? `**${trimmed}**` : line;
                        })
                        .join('\n');
                } else {
                    replacement = '**bold text**';
                }
                break;
            case 'italic':
                // Handle multi-paragraph italic text
                if (selectedText) {
                    replacement = selectedText
                        .split('\n')
                        .map(line => {
                            const trimmed = line.trim();
                            return trimmed ? `_${trimmed}_` : line;
                        })
                        .join('\n');
                } else {
                    replacement = '_italic text_';
                }
                break;
            case 'ul':
                if (selectedText) {
                    replacement = selectedText
                        .split('\n')
                        .map(line => {
                            const trimmed = line.trim();
                            return trimmed ? `- ${trimmed}` : line;
                        })
                        .join('\n');
                } else {
                    replacement = '- list item';
                }
                break;
            case 'ol':
                if (selectedText) {
                    replacement = selectedText
                        .split('\n')
                        .map((line, index) => {
                            const trimmed = line.trim();
                            return trimmed ? `${index + 1}. ${trimmed}` : line;
                        })
                        .join('\n');
                } else {
                    replacement = '1. list item';
                }
                break;
            case 'code':
                // Handle multi-line code blocks
                if (selectedText && selectedText.includes('\n')) {
                    replacement = '```\n' + selectedText + '\n```';
                } else {
                    replacement = selectedText ? `\`${selectedText}\`` : '`code`';
                }
                break;
            case 'link':
                replacement = selectedText ? `[${selectedText}](url)` : '[link text](url)';
                break;
            case 'quote':
                if (selectedText) {
                    replacement = selectedText
                        .split('\n')
                        .map(line => {
                            const trimmed = line.trim();
                            return trimmed ? `> ${trimmed}` : line;
                        })
                        .join('\n');
                } else {
                    replacement = '> quoted text';
                }
                break;
            default:
                return;
        }

        const newText = text.substring(0, start) + replacement + text.substring(end);
        onChange(newText);
        
        // Set cursor position after formatting
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + replacement.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const togglePreview = (e) => {
        e.preventDefault();
        setIsPreview(!isPreview);
    };

    return (
        <div className={styles.editor}>
            <div className={styles.toolbar}>
                <div className={styles.formatButtons}>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('bold', e)} 
                        title="Bold"
                    >
                        <FaBold />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('italic', e)} 
                        title="Italic"
                    >
                        <FaItalic />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('code', e)} 
                        title="Code"
                    >
                        <FaCode />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('link', e)} 
                        title="Link"
                    >
                        <FaLink />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('quote', e)} 
                        title="Quote"
                    >
                        <FaQuoteLeft />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('ul', e)} 
                        title="Unordered List"
                    >
                        <FaListUl />
                    </button>
                    <button 
                        type="button" 
                        onClick={(e) => insertFormat('ol', e)} 
                        title="Ordered List"
                    >
                        <FaListOl />
                    </button>
                </div>
                <div className={styles.viewToggle}>
                    <button 
                        type="button"
                        onClick={togglePreview}
                        title={isPreview ? "Write" : "Preview"}
                        className={styles.previewButton}
                    >
                        {isPreview ? <FaEdit /> : <FaEye />}
                    </button>
                </div>
            </div>
            
            {isPreview ? (
                <div className={styles.preview}>
                    {value ? (
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
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <p className={styles.placeholder}>Nothing to preview</p>
                    )}
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={styles.textarea}
                />
            )}
        </div>
    );
};

export default TextEditor; 