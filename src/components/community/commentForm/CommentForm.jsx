import React, { useState } from "react";
import styles from "./commentForm.module.css";
import TextEditor from "../textEditor/TextEditor";
import { getRandomAvatar } from '@/utils/avatarUtils';

const CommentForm = ({ onSubmit, placeholder = "Leave a comment", buttonText = "Comment" }) => {
    const [comment, setComment] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (comment.trim()) {
            onSubmit(comment);
            setComment(""); // Clear input after submission
        }
    };

    return (
        <div className={styles.commentForm}>
            <div className={styles.avatarContainer}>
                <img 
                    src={getRandomAvatar('currentuser')} 
                    alt="Your avatar" 
                    className={styles.avatar} 
                />
            </div>
            <div className={styles.inputContainer}>
                <TextEditor
                    value={comment}
                    onChange={setComment}
                    placeholder={placeholder}
                />
                <div className={styles.footer}>
                    <button 
                        className={styles.primaryButton} 
                        onClick={handleSubmit} 
                        disabled={!comment.trim()}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentForm;
