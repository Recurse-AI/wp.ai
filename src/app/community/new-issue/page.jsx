"use client";

import React, { useState, useContext } from "react";
import styles from "./newIssue.module.css";
import TextEditor from "@/components/community/textEditor/TextEditor";
import { useRouter } from "next/navigation";
import { IssueContext } from "@/context/IssueContext";
import { FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

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
            date: new Date().toISOString()
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
                    <div className={styles.titleInputWrapper}>
                        <input
                            type="text"
                            className={styles.titleInput}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            required
                            maxLength={150}
                        />
                    </div>
                    {!title.trim() && (
                        <span className={styles.required}>
                            Title is required
                        </span>
                    )}
                    {title.length >= 150 && (
                        <span className={styles.limitWarning}>
                            Maximum character limit reached
                        </span>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <TextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Description "
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
