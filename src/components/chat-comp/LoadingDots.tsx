'use client';

import React from 'react';
import styles from './LoadingDots.module.css';

interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ className, ...props }) => {
  return (
    <div className={`${styles.loading} ${className || ''}`} {...props}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default LoadingDots; 