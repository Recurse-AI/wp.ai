"use client";

import Link from 'next/link';
import styles from './navbar.module.css';
import { FaPlus } from 'react-icons/fa';

const Navbar = () => {
    return (
        <nav className={styles.container}>
            <div className={styles.leftSection}>
                {/* Left section content if needed */}
            </div>
            
            <div className={styles.searchBar}>
                {/* Search bar content */}
            </div>

            <div className={styles.navbarActions}>
                <Link 
                    href="/community/new-issue" 
                    className={styles.newIssueButton}
                >
                    <FaPlus /> New Issue
                </Link>
            </div>
        </nav>
    );
};

export default Navbar; 