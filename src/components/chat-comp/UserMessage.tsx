import React from "react";
import { UserMessageActions } from "./MessageActions";

interface UserMessageProps {
  content: string;
  isEditing: boolean;
  editedMessage: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  theme: string;
  onEdit: () => void;
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  processContent?: (content: string) => string;
}

const UserMessage: React.FC<UserMessageProps> = ({ 
  content, 
  isEditing, 
  editedMessage, 
  textareaRef, 
  theme, 
  onEdit, 
  onTextareaChange, 
  onCancelEdit, 
  onSaveEdit,
  processContent
}) => {
  // Process content if function is provided
  const displayContent = processContent ? processContent(content) : content;
  
  return (
    <div className="flex justify-end w-full max-w-[50rem] px-4 mt-2 overflow-x-hidden">
      <div
        className={`relative py-3 px-4 rounded-xl ml-20 ${isEditing ? 'w-[80%] max-w-3xl' : 'w-auto'} group
        ${theme === "dark" ? "bg-[#343541] text-white" : "bg-[#ECECF1] text-gray-900"}`}
      >
        {isEditing ? (
          <div className="w-full min-w-[350px]">
            <textarea
              ref={textareaRef}
              value={editedMessage}
              onChange={onTextareaChange}
              className="textarea-edit"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 mr-2 text-sm rounded-md hover:bg-opacity-80 transition-colors bg-gray-300 dark:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1.5 text-sm text-white rounded-md hover:bg-opacity-80 transition-colors bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <pre className="whitespace-pre-wrap break-words text-left">
              {displayContent}
            </pre>
            <UserMessageActions 
              content={content} 
              onEdit={onEdit}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserMessage; 