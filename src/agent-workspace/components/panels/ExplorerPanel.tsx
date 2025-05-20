import React, { forwardRef } from 'react';

const ExplorerPanel = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

ExplorerPanel.displayName = 'ExplorerPanel';

export default ExplorerPanel;