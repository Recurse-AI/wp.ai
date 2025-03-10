import React from "react";
import styles from "./navbar.module.css";
import NavbarActions from "../navbarActions/NavbarActions";

const Navbar = () => {
    return (
        <nav className={styles.container}>
            <div className={styles.leftSection}></div>
            <NavbarActions />
        </nav>
    );
};

export default Navbar;
