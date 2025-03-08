"use client";
import React from 'react';
import { Database, Zap, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

interface InfoFooterProps {
  embeddingEnabled: boolean;
  agentMode: boolean;
}

const InfoFooter: React.FC<InfoFooterProps> = ({ 
  embeddingEnabled, 
  agentMode,
}) => {
  const { theme } = useTheme();

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p
        className={`text-xs mt-2 font-medium tracking-wide flex items-center justify-center gap-2 ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}
      >
        {embeddingEnabled && (
          <>
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4 text-blue-500" strokeWidth={2} />
              <span className="text-blue-500">WordPress knowledge base active</span>
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        {agentMode && (
          <>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-purple-500" strokeWidth={2.5} />
              <span className="text-purple-500">Agent mode active</span>
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        <span>WP.AI helps with WordPress development. Verify important info.</span>
      </p>
    </div>
  );
};

export default InfoFooter; 