"use client";
import React from 'react';
import { Database, Globe } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

interface InfoFooterProps {
  do_web_search: boolean;
  do_vector_search: boolean;
}

const InfoFooter: React.FC<InfoFooterProps> = ({ 
  do_web_search,
  do_vector_search
}) => {
  const { theme } = useTheme();

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p
        className={`text-xs mt-2 font-medium tracking-wide flex items-center justify-center gap-2 ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}
      >
        {do_web_search && (
          <>
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4 text-blue-500" strokeWidth={2} />
              <span className="text-blue-500">WordPress knowledge base active</span>
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        {do_vector_search && (
          <>
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4 text-green-500" strokeWidth={2} />
              <span className="text-green-500">Web Search active</span>
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