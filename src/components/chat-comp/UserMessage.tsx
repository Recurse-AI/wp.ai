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
    <div className="flex justify-end w-full max-w-[50rem] px-4 mt-2 overflow-x-hidden mb-4">
      <div
        className={`relative py-3 px-4 rounded-xl ml-20 ${isEditing ? 'w-full max-w-3xl' : 'w-auto'} group shadow-sm
        ${theme === "dark" ? "bg-[#2A2B38] text-white" : "bg-[#F0F2F5] text-gray-800"}`}
      >
        {isEditing ? (
          <div className="w-full">
            <textarea
              ref={textareaRef}
              value={editedMessage}
              onChange={onTextareaChange}
              className={`textarea-edit w-full min-h-[100px] p-3 rounded-lg border resize-none transition-colors
              ${theme === "dark" 
                ? "bg-[#343541] text-white border-gray-700 focus:border-blue-400" 
                : "bg-white text-gray-800 border-gray-300 focus:border-blue-500"} 
              focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500`}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={onCancelEdit}
                className={`px-3 py-1.5 mr-2 text-sm rounded-md hover:bg-opacity-80 transition-colors
                ${theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800"}`}
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1.5 text-sm text-white rounded-md hover:brightness-110 transition-all bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap break-words text-left cursor-default">
              {displayContent}
            </div>
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