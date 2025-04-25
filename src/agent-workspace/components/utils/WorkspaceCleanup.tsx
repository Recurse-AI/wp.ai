import { useEffect } from 'react';
import { cleanSpecificWorkspace } from '../../utils/workspaceUtils';

interface WorkspaceCleanupProps {
  workspaceId: string;
  onComplete?: () => void;
}

/**
 * Component to clean up a specific workspace
 * This can be used on mount to clean up a workspace
 */
const WorkspaceCleanup: React.FC<WorkspaceCleanupProps> = ({ 
  workspaceId,
  onComplete 
}) => {
  useEffect(() => {
    if (workspaceId) {
      // Clean the workspace
      console.log(`Component cleaning workspace: ${workspaceId}`);
      cleanSpecificWorkspace(workspaceId);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    }
  }, [workspaceId, onComplete]);

  // This component doesn't render anything
  return null;
};

export default WorkspaceCleanup; 