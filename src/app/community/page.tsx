"use client";

import React, { useState } from "react";
import { FaCaretDown, FaSearch } from "react-icons/fa";
import { useIssue } from "@/context/IssueContext";
import IssueList from "@/components/community/issueList/IssueList";
import styles from "./community.module.css";
import "@/app/community/globals.css";
interface SortConfig {
    type: 'time' | 'comments';
    order: 'asc' | 'desc';
}

export default function Home() {
    const { issues } = useIssue();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        type: 'time',
        order: 'desc'
    });
    const [showSortMenu, setShowSortMenu] = useState<boolean>(false);

    const filteredAndSortedIssues = [...issues]
        .filter(issue => {
            if (!searchQuery.trim()) return true;
            
            const search = searchQuery.toLowerCase();
            return (
                issue.title.toLowerCase().includes(search) ||
                issue.description.toLowerCase().includes(search) ||
                issue.created_by.username.toLowerCase().includes(search) ||
                issue.id.toString().includes(search)
            );
        })
        .sort((a, b) => {
            if (sortConfig.type === 'comments') {
                const countA = a.comments ? a.comments.length : 0;
                const countB = b.comments ? b.comments.length : 0;
                return sortConfig.order === 'desc' ? countB - countA : countA - countB;
            } else {
                const dateA = a.created_at || a.updated_at;
                const dateB = b.created_at || b.updated_at;
                
                return sortConfig.order === 'desc' 
                    ? dateB.localeCompare(dateA)
                    : dateA.localeCompare(dateB);
            }
        });

    const handleSortChange = (type: 'time' | 'comments') => {
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
} 