"use client";

import React from "react";
import Link from "next/link";
import styles from "../navbar/navbar.module.css";
import { usePathname } from "next/navigation";

const NavbarActions = () => {
    const pathname = usePathname();
    const isNewIssuePage = pathname === "/community/new-issue";
    
    return (
        <div className={styles.navbarActions}>
            {!isNewIssuePage && (
                <Link href="/community/new-issue" className={styles.newIssueButton}>
                    New issue
                </Link>
            )}
        </div>
    );
};

export default NavbarActions;
