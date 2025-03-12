"use client";

import React, { useState, useContext } from "react";
import styles from "./newIssue.module.css";
import TextEditor from "@/components/community/textEditor/TextEditor";
import { useRouter } from "next/navigation";
import { IssueContext } from "@/context/IssueContext";
import { FaExclamationCircle } from "react-icons/fa";

const NewIssue = () => {
    const { addIssue } = useContext(IssueContext);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newIssue = {
            id: Date.now(),
            title: title.trim(),
            author: "Current User",
            description,
            labels: [],
            comments: [],
            date: new Date().toISOString(),
            status: "open"
        };

        addIssue(newIssue);
        router.push("/community");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <FaExclamationCircle className={styles.icon} />
                <h1>Create new issue</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <input
                        type="text"
                        className={styles.titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        required
                    />
                    {!title.trim() && (
                        <span className={styles.required}>
                            Title is required
                        </span>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <TextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Leave a comment"
                    />
                </div>

                <div className={styles.formFooter}>
                    <button 
                        type="button" 
                        className={styles.cancelButton}
                        onClick={() => router.push("/community")}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={!title.trim()}
                    >
                        Submit new issue
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewIssue;
