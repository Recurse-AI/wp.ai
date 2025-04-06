"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeProvider";
import CodeEditor from "@/components/agent-comp/CodeEditor";
import CodePreview from "@/components/agent-comp/CodePreview";
import FileExplorer from "@/components/agent-comp/FileExplorer";
import AgentInput from "@/components/agent-comp/AgentInput";
import AgentMessage from "@/components/agent-comp/AgentMessage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Resizable } from "re-resizable";
import {
  FiCode,
  FiEye,
  FiFolder,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { ChatMessage } from "@/lib/types/chat";
import { Tooltip } from "react-tooltip";
import dynamic from "next/dynamic";

const LazyWordPressPlayground = dynamic(
  () => import("../agent-comp/WordPressPlayground"),
  {
    loading: () => (
      <div className="text-sm text-gray-500 p-4 text-center">
        Loading WordPress Playground...
      </div>
    ),
    ssr: false,
  }
);

interface AgentModeInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onRegenerateMessage?: () => Promise<void>;
  isLoading?: boolean;
}

interface FileNode {
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: Record<string, FileNode>;
}

const AgentModeInterface: React.FC<AgentModeInterfaceProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
    language: string;
  } | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<Record<string, FileNode>>(
    {}
  );

  useEffect(() => {
    setIsClient(true);
    setLocalMessages(messages || []);
    const timer = setTimeout(() => setSidebarOpen(true), 0);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleMessageSent = async (message: string) => {
    try {
      setIsProcessing(true);
      await onSendMessage(message);
    } catch {
      toast.error("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file: {
    name: string;
    content: string;
    language: string;
  }) => {
    setSelectedFile(file);
  };

  const toggleSidebar = useCallback(() => {
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);
    setFullscreenMode(!newSidebarState);
    if (isClient) {
      toast.success(
        newSidebarState ? "Exited fullscreen mode" : "Entered fullscreen mode",
        {
          icon: newSidebarState ? "🔍" : "🔎",
        }
      );
    }
  }, [sidebarOpen, isClient]);

  const displayMessages = isClient
    ? messages.length > localMessages.length
      ? messages
      : localMessages
    : [];

  useEffect(() => {
    if (!isClient) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === "Escape" && fullscreenMode) {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenMode, toggleSidebar, isClient]);

  useEffect(() => {
    if (!isClient) return;
    document.body.classList.toggle("agent-fullscreen-mode", fullscreenMode);
    return () => document.body.classList.remove("agent-fullscreen-mode");
  }, [fullscreenMode, isClient]);

  const handleCodeBlocksChange = useCallback(
    (files: Record<string, FileNode>) => {
      // Only update if the files are different from the current ones
      const filesString = JSON.stringify(files);
      const currentFilesString = JSON.stringify(currentFiles);

      if (filesString !== currentFilesString) {
        setCurrentFiles(files);
      }
    },
    [currentFiles]
  );

  if (!isClient) return <div className="h-full w-full pt-2">Loading...</div>;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden pt-2">
      <div className="flex flex-1 overflow-hidden relative">
        {!fullscreenMode && (
          <Resizable
            enable={{ right: true }}
            defaultSize={{
              width: sidebarOpen ? "300px" : "0px",
              height: "100%",
            }}
            minWidth={sidebarOpen ? "250px" : "0px"}
            maxWidth="500px"
            className={`border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
              sidebarOpen ? "flex flex-col" : "w-0 overflow-hidden"
            }`}
          >
            {sidebarOpen && (
              <Tabs defaultValue="messages" className="w-full h-full">
                <TabsList className="w-full flex justify-around border-b border-gray-200 dark:border-gray-700">
                  <TabsTrigger
                    value="messages"
                    className="flex items-center gap-1 py-2"
                  >
                    <FiMessageSquare size={14} /> <span>Messages</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="flex items-center gap-1 py-2"
                  >
                    <FiFolder size={14} /> <span>Files</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="messages"
                  className="flex-1 overflow-auto p-2 custom-scrollbar"
                >
                  <div
                    className={`h-full overflow-y-auto p-4 ${
                      theme === "dark" ? "bg-gray-900/50" : "bg-white"
                    } rounded-md`}
                  >
                    {displayMessages.length > 0 ? (
                      displayMessages.map((msg, index) => (
                        <AgentMessage
                          key={msg.id || index}
                          content={msg.content}
                          isUser={msg.role === "user"}
                          isLatestMessage={index === displayMessages.length - 1}
                          onCodeBlocksChange={handleCodeBlocksChange}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
                        <FiMessageSquare
                          size={32}
                          className="mb-2 opacity-50"
                        />
                        <p>
                          No messages yet. Start a conversation with the agent!
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent
                  value="files"
                  className="flex-1 overflow-auto p-0 custom-scrollbar"
                >
                  <FileExplorer
                    onFileSelect={handleFileSelect}
                    onFilesChange={setCurrentFiles}
                    dynamicFiles={currentFiles}
                  />
                </TabsContent>
              </Tabs>
            )}
          </Resizable>
        )}

        {isClient && (
          <button
            onClick={toggleSidebar}
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content={
              sidebarOpen
                ? "Hide sidebar (enter fullscreen)"
                : "Show sidebar (exit fullscreen)"
            }
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 ${
              fullscreenMode
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            } p-1.5 rounded-r-md border border-l-0 ${
              fullscreenMode
                ? "border-purple-600 dark:border-purple-800 shadow-md"
                : "border-gray-200 dark:border-gray-700"
            } z-10 transition-all duration-300 hover:scale-105`}
          >
            {sidebarOpen ? (
              <FiChevronLeft size={16} />
            ) : (
              <FiChevronRight size={16} />
            )}
          </button>
        )}

        {isClient && <Tooltip id="sidebar-tooltip" place="right" />}

        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
          <Tabs defaultValue="editor" className="w-full h-full flex flex-col">
            <TabsList className="w-full flex justify-start border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger
                value="editor"
                className="flex items-center gap-1 py-2 relative"
              >
                <FiCode size={14} /> <span>Editor</span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex items-center gap-1 py-2 relative"
              >
                <FiEye size={14} /> <span>Preview</span>
              </TabsTrigger>
              <TabsTrigger
                value="playground"
                className="flex items-center gap-1 py-2 relative"
              >
                <FiEye size={14} /> <span>Playground</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="editor"
              className="flex-1 overflow-hidden p-0 vscode-editor-tab"
            >
              {selectedFile ? (
                <CodeEditor
                  code={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                  showLineNumbers={true}
                  onChange={(newCode) =>
                    setSelectedFile({ ...selectedFile, content: newCode })
                  }
                  theme={theme === "dark" ? "dark" : "light"}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  <div>
                    <FiCode size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a file from the file explorer to start editing</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="preview"
              className="flex-1 overflow-auto p-0 vscode-preview-tab"
            >
              {selectedFile ? (
                <CodePreview
                  code={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  <div>
                    <FiEye size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a file from the file explorer to preview it</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="playground"
              className="flex-1 overflow-auto p-0 vscode-preview-tab"
            >
              <LazyWordPressPlayground files={currentFiles} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {isClient ? (
          <AgentInput
            onSendMessage={handleMessageSent}
            disabled={isProcessing || isLoading}
            onRegenerateMessage={onRegenerateMessage}
            showRegenerateButton={
              !!onRegenerateMessage &&
              !!displayMessages.length &&
              displayMessages[displayMessages.length - 1]?.role !== "user"
            }
          />
        ) : (
          <div className="h-[40px]" />
        )}
      </div>
    </div>
  );
};

export default AgentModeInterface;
