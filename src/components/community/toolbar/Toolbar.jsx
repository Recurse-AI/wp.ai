import React from "react";
import styles from "./toolbar.module.css";
import { FaBold, FaItalic, FaLink, FaListUl, FaListOl, FaCode, FaAt, FaUndo, FaRedo } from "react-icons/fa";

const Toolbar = ({ onFormat }) => {
    return (
        <div className={styles.toolbar}>
            <button onClick={() => onFormat("bold")}><FaBold /></button>
            <button onClick={() => onFormat("italic")}><FaItalic /></button>
            <button onClick={() => onFormat("link")}><FaLink /></button>
            <button onClick={() => onFormat("ulist")}><FaListUl /></button>
            <button onClick={() => onFormat("olist")}><FaListOl /></button>
            <button onClick={() => onFormat("code")}><FaCode /></button>
            <button onClick={() => onFormat("mention")}><FaAt /></button>
            <button onClick={() => onFormat("undo")}><FaUndo /></button>
            <button onClick={() => onFormat("redo")}><FaRedo /></button>
        </div>
    );
};

export default Toolbar;
