import React from 'react';
import { AgentMessage } from '../types';
import { CodeBlock } from './CodeBlock';
import { ToolInvocations } from './ToolInvocations';
import { FiUser, FiCpu, FiAlertCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

interface MessageDisplayProps {
  message: AgentMessage;
  isLastMessage: boolean;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, isLastMessage }) => {
  // Format the timestamp
  const formattedTime = message.timestamp.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine icon based on role
  const RoleIcon = message.role === 'user' ? FiUser : FiCpu;
  
  // Check if message has tool invocations
  const hasToolInvocations = message.tools_invoked && message.tools_invoked.length > 0;
  
  return (
    <div className={`message-container p-4 ${message.role === 'user' ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-750'} border-b dark:border-gray-700`}>
      <div className="message-header flex items-center mb-2">
        <div className="icon-container p-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-2">
          <RoleIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </div>
        <div className="message-info">
          <div className="font-medium">
            {message.role === 'user' ? 'You' : 'Agent'}
          </div>
          <div className="text-xs text-gray-500">
            {formattedTime}
          </div>
        </div>
        
        {/* Status indicator for processing messages */}
        {message.status === 'processing' && (
          <div className="ml-auto flex items-center">
            <div className="animate-pulse bg-blue-500 rounded-full w-2 h-2 mr-2"></div>
            <span className="text-xs text-blue-500">Processing...</span>
          </div>
        )}
        
        {/* Error indicator */}
        {message.status === 'error' && (
          <div className="ml-auto flex items-center text-red-500">
            <FiAlertCircle className="mr-1" />
            <span className="text-xs">Error</span>
          </div>
        )}
      </div>
      
      <div className="message-content prose dark:prose-invert prose-sm max-w-none">
        {/* Render message content as markdown */}
        <ReactMarkdown>
          {message.content}
        </ReactMarkdown>
        
        {/* Render any code blocks */}
        {message.codeBlocks && message.codeBlocks.length > 0 && (
          <div className="code-blocks mt-4 space-y-4">
            {message.codeBlocks.map((block) => (
              <CodeBlock
                key={block.id}
                language={block.language}
                code={block.code}
              />
            ))}
          </div>
        )}
        
        {/* Render tool invocations */}
        {hasToolInvocations && (
          <ToolInvocations 
            messageId={message.id} 
            toolInvocations={message.tools_invoked || []} 
          />
        )}
        
        {/* Thinking section */}
        {message.thinking && message.role === 'assistant' && (
          <div className="thinking-section mt-4 pt-3 border-t dark:border-gray-700">
            <details>
              <summary className="text-sm font-medium cursor-pointer text-gray-600 dark:text-gray-400">
                View thinking process
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs overflow-auto whitespace-pre-wrap">
                {message.thinking}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}; 