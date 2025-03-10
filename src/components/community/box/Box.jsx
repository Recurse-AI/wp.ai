"use client";

import React, { useContext, useState } from "react";
import styles from "./box.module.css";
import IssueList from "../issueList/IssueList";
import { IssueContext } from "@/context/IssueContext";
import { FaCaretDown, FaSearch } from "react-icons/fa";
import { getTotalCommentCount } from "@/utils/commentUtils";

const Box = () => {
    const { issues } = useContext(IssueContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({
        type: 'time',
        order: 'desc'
    });
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Filter and sort issues
    const filteredAndSortedIssues = [...issues]
        // First filter
        .filter(issue => {
            if (!searchQuery.trim()) return true;
            
            const search = searchQuery.toLowerCase();
            return (
                issue.title.toLowerCase().includes(search) ||
                issue.description.toLowerCase().includes(search) ||
                issue.author.toLowerCase().includes(search) ||
                issue.id.toString().includes(search)
            );
        })
        // Then sort
        .sort((a, b) => {
            if (sortConfig.type === 'comments') {
                const countA = getTotalCommentCount(a);
                const countB = getTotalCommentCount(b);
                return sortConfig.order === 'desc' ? countB - countA : countA - countB;
            } else {
                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                return sortConfig.order === 'desc' ? timeB - timeA : timeA - timeB;
            }
        });

    const handleSortChange = (type) => {
        setSortConfig(prev => ({
            type,
            order: prev.type === type ? (prev.order === 'desc' ? 'asc' : 'desc') : 'desc'
        }));
        setShowSortMenu(false);
    };

    const getSortLabel = () => {
        const orderSymbol = sortConfig.order === 'desc' ? '↓' : '↑';
        return sortConfig.type === 'comments' 
            ? `Most commented ${orderSymbol}`
            : `Newest first ${orderSymbol}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.tabs}>
                    <button className={styles.tab}>
                        Issues <span className={styles.count}>{filteredAndSortedIssues.length}</span>
                    </button>
                </div>
                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search issues..."
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className={styles.clearButton}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className={styles.sortDropdown}>
                        <button 
                            className={`${styles.filterButton} ${styles.active}`}
                            onClick={() => setShowSortMenu(!showSortMenu)}
                        >
                            Sort: {getSortLabel()} <FaCaretDown />
                        </button>
                        {showSortMenu && (
                            <div className={styles.sortMenu}>
                                <button 
                                    className={sortConfig.type === 'time' ? styles.active : ''}
                                    onClick={() => handleSortChange('time')}
                                >
                                    Newest first
                                </button>
                                <button 
                                    className={sortConfig.type === 'comments' ? styles.active : ''}
                                    onClick={() => handleSortChange('comments')}
                                >
                                    Most commented
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <IssueList issues={filteredAndSortedIssues} />
        </div>
    );
};

export default Box;
