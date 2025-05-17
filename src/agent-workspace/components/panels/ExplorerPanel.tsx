import React, { forwardRef } from 'react';

const ExplorerPanel = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <div 
        className="explorer-panel bg-gray-50 border-r border-gray-200 transition-all duration-200 dark:bg-gray-900 dark:border-gray-700"
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

ExplorerPanel.displayName = 'ExplorerPanel';

export default ExplorerPanel;