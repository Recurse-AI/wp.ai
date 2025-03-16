import React, { useRef, useState } from 'react';
import styles from './textEditor.module.css';
import { FaBold, FaItalic, FaCode, FaListUl, FaListOl, FaQuoteLeft, FaLink, FaEye, FaEdit } from 'react-icons/fa';
import MarkdownRenderer from '../markdownRenderer/MarkdownRenderer';

interface TextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

type FormatType = 'bold' | 'italic' | 'ul' | 'ol' | 'code' | 'link' | 'quote';

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isPreview, setIsPreview] = useState(false);

    const insertFormat = (format: FormatType, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        let replacement = '';

        switch (format) {
            case 'bold':
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
                if (selectedText && selectedText.includes('\n')) {
                    replacement = '```\n' + selectedText + '\n```';
                } else {
                    replacement = selectedText ? `\`${selectedText}\`` : '`code`';
                }
                break;
            case 'link':
                if (selectedText) {
                    if (selectedText.match(/^https?:\/\//)) {
                        replacement = `[@](${selectedText})`;
                    } else {
                        replacement = `[${selectedText}](@url)`;
                    }
                } else {
                    replacement = `[@](@url)`;
                }
                break;
            case 'quote':
                if (selectedText) {
                    const needsNewlineBefore = start > 0 && text[start - 1] !== '\n';
                    const needsNewlineAfter = end < text.length && text[end] !== '\n';
                    
                    const quotedText = selectedText
                        .split('\n')
                        .map(line => `> ${line}`)
                        .join('\n');

                    replacement = (needsNewlineBefore ? '\n' : '') + 
                                quotedText + 
                                (needsNewlineAfter ? '\n\n' : '\n');
                } else {
                    replacement = '\n> quoted text\n\n';
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
                        onClick={() => setIsPreview(!isPreview)}
                        title={isPreview ? "Write" : "Preview"}
                        className={styles.previewButton}
                    >
                        {isPreview ? (
                            <>
                                <FaEdit className={styles.buttonIcon} />
                                <span>Write</span>
                            </>
                        ) : (
                            <>
                                <FaEye className={styles.buttonIcon} />
                                <span>Preview</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {isPreview ? (
                <div className={styles.preview}>
                    {value ? (
                        <MarkdownRenderer content={value} />
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