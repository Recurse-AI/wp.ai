"use client";
import React, { useState } from "react";
import styles from "./searchBar.module.css";

const SearchBar = () => {
    const [query, setQuery] = useState("");

    const handleClear = () => setQuery("");

    return (
        <div className={styles.searchBar}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues..."
                className={styles.searchInput}
            />
            {query && (
                <button onClick={handleClear} className={styles.clearButton}>✕</button>
            )}
            <button className={styles.searchButton}>🔍</button>
        </div>
    );
};

export default SearchBar;
