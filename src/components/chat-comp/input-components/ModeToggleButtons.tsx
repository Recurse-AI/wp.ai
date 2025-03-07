"use client";
import React from 'react';
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import { useTheme } from "@/context/ThemeProvider";
import { Zap, MessageSquare, Database } from "lucide-react";

interface ModeToggleButtonsProps {
  agentMode: boolean;
  embeddingEnabled: boolean;
  toggleAgentMode: () => void;
  toggleEmbedding: () => void;
}

const ModeToggleButtons: React.FC<ModeToggleButtonsProps> = ({
  agentMode,
  embeddingEnabled,
  toggleAgentMode,
  toggleEmbedding,
}) => {
  const { theme } = useTheme();
  
  // Check if we should hide the KB button - hide in both agent mode states
  const shouldHideKBButton = agentMode === true;
  return (
    <div className="flex gap-3 text-gray-500 text-xs">
      {/* Agent/Default Mode Toggle Button */}
      <div className="relative">
        <motion.button
          type="button"
          onClick={toggleAgentMode}
          whileTap={{ scale: 0.95 }}
          data-tooltip-id="tooltip-agent-mode"
          data-tooltip-content={agentMode ? "Switch to Default Mode (send message to apply)" : "Switch to Agent Mode (send message to apply)"}
          className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
            agentMode 
              ? "text-purple-500 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800" 
              : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
          }`}
        >
          {agentMode ? (
            <Zap className="w-4 h-4 text-purple-500" strokeWidth={2.5} />
          ) : (
            <MessageSquare className="w-4 h-4" strokeWidth={2} />
          )}
          <span className={`text-[11px] font-medium ${agentMode ? "text-purple-600 dark:text-purple-400" : ""}`}>
            {agentMode ? "Agent" : "Default"}
          </span>
          {agentMode && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          )}
        </motion.button>
        <Tooltip id="tooltip-agent-mode" place="top" />
      </div>

      {/* Embedding Toggle Button - Hide when agent mode is active or pending */}
      {!shouldHideKBButton && (
        <div className="relative">
          <motion.button
            type="button"
            onClick={toggleEmbedding}
            whileTap={{ scale: 0.95 }}
            data-tooltip-id="tooltip-embedding"
            data-tooltip-content={embeddingEnabled ? "WordPress Knowledge Base Active" : "Enable WordPress Knowledge Base"}
            className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
              embeddingEnabled 
                ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            <Database className={`w-4 h-4 ${embeddingEnabled ? "text-blue-500" : ""}`} strokeWidth={2} />
            <span className={`text-[11px] font-medium ${embeddingEnabled ? "text-blue-600 dark:text-blue-400" : ""}`}>
              {embeddingEnabled ? "KB On" : "KB Off"}
            </span>
          </motion.button>
          <Tooltip id="tooltip-embedding" place="top" />
        </div>
      )}
    </div>
  );
};

export default ModeToggleButtons; 