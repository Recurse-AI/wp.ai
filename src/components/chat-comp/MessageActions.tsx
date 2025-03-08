import React from 'react';
import { Copy, Pencil, RotateCcw, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToastStyle } from '@/lib/toastConfig';
import { useTheme } from '@/context/ThemeProvider';

interface UserMessageActionsProps {
  content: string;
  onEdit?: () => void;
}

export const UserMessageActions: React.FC<UserMessageActionsProps> = ({ 
  content, 
  onEdit 
}) => {
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success(
      'Message copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
  };
  
  return (
    <div className="flex items-center justify-end gap-2 mt-2 user-message-actions opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Copy message"
      >
        <Copy size={16} />
      </button>
      
      {onEdit && (
        <button 
          onClick={onEdit}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Edit message"
        >
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
};

interface AIResponseActionsProps {
  content: string;
  onRegenerate?: () => void;
  metadata?: Record<string, any>;
}

export const AIResponseActions: React.FC<AIResponseActionsProps> = ({
  content,
  onRegenerate,
  metadata
}) => {
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success(
      'Response copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
  };

  const handleCopyShareLink = () => {
    // This would ideally generate a shareable link for the response
    // For now, just copy the current URL + message ID
    const shareUrl = `${window.location.href}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(
      'Share link copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
  };

  const handleLove = () => {
    // This would ideally send feedback to backend
    toast.success(
      'Thanks for your positive feedback!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
  };

  const handleNotForMe = () => {
    // This would ideally send feedback to backend
    toast.success(
      'Thanks for your feedback!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
  };

  return (
    <div className="flex items-center gap-2 mt-2 ai-response-actions opacity-0 group-hover:opacity-100 transition-opacity">
      {onRegenerate && (
        <button 
          onClick={onRegenerate}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Regenerate response"
        >
          <RotateCcw size={16} />
        </button>
      )}
      
      <button 
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Copy response"
      >
        <Copy size={16} />
      </button>
      
      <button 
        onClick={handleCopyShareLink}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Copy share link"
      >
        <Share2 size={16} />
      </button>
      
      <button 
        onClick={handleLove}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-green-500"
        title="Helpful response"
      >
        <ThumbsUp size={16} />
      </button>
      
      <button 
        onClick={handleNotForMe}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Not helpful"
      >
        <ThumbsDown size={16} />
      </button>
    </div>
  );
}; 