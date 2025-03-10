import React from "react";
import styles from "./footer.module.css"; {/*The styles object is imported from a CSS module file (footer.module.css). Each class name in the CSS module is converted into a property of the styles object.You can access class names dynamically using styles.className.*/ }
const Footer = () => {
    return (
        <div className={styles.container}>         {/* Uses `styles.container` to apply the CSS class from `footer.module.css`. The curly braces `{}` indicate that it's a JavaScript expression. */}
            Footer
        </div>
    );
}
export default Footer;
