import React from "react";
import styles from "./commentForm.module.css";
import TextEditor from "../textEditor/TextEditor";

interface CommentFormProps {
    onSubmit: (comment: string) => void;
    placeholder?: string;
    buttonText?: string;
    value: string;
    onChange: (value: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
    onSubmit, 
    placeholder = "Leave a comment", 
    buttonText = "Comment",
    value,
    onChange 
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value);
            onChange(""); // Clear input after submission
        }
    };

    return (
        <div className={styles.commentForm}>
            <div className={styles.inputContainer}>
                <TextEditor
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
                <div className={styles.footer}>
                    <button 
                        className={styles.primaryButton}
                        onClick={handleSubmit} 
                        disabled={!value.trim()}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentForm; 