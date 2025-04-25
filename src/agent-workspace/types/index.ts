// Agent Workspace Types

// File/Project Structure Types
export interface AgentFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  lastModified: Date;
}

export interface FileNode {
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: Record<string, FileNode>;
}

// Workspace Types
export interface AgentWorkspaceProps {
  preloadedService?: string;
  workspaceId?: string;
}

// Agent Message Types
export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
  files?: AgentFile[];
  metadata?: Record<string, any>;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
}

// Agent Service Types
export interface AIService {
  id: string;
  title: string;
  description: string;
  icon: any;
  example: string;
  color: string;
}

// Agent State Types
export interface AgentSessionState {
  id: string;
  messages: AgentMessage[];
  files: Record<string, FileNode>;
  activeFile?: AgentFile;
  selectedService?: AIService;
  isProcessing: boolean;
  previewMode: "code" | "wordpress";
  connectionStatus?: "connecting" | "connected" | "disconnected" | "error";
  error?: string | null;
}

// Agent Panel Layout Options
export enum PanelLayout {
  Split = "split",
  Editor = "editor",
  Preview = "preview",
  Chat = "chat",
  Advanced = "advanced",
  Terminal = "terminal"
}

// Agent UI Component Props
export interface AgentPanelProps {
  sessionState: AgentSessionState;
  layout: PanelLayout;
  onLayoutChange: (layout: PanelLayout) => void;
  onFileSelect: (file: AgentFile) => void;
  onFilesChange: (files: Record<string, FileNode>) => void;
}

export interface AgentChatProps {
  sessionState: AgentSessionState;
  onSendMessage: (message: string) => Promise<any>;
  onRegenerateMessage?: () => Promise<any>;
}

export interface AgentEditorProps {
  file: AgentFile;
  onChange: (content: string) => void;
}

export interface AgentPreviewProps {
  files: Record<string, FileNode>;
  activeFile?: AgentFile;
  currentService?: AIService;
}

export interface AgentToolbarProps {
  layout: PanelLayout;
  onLayoutChange: (layout: PanelLayout) => void;
  workspaceName: string;
  isProcessing: boolean;
  onSaveWorkspace?: () => Promise<void>;
  onPublishCode?: () => Promise<void>;
  onToggleExplorer?: () => void;
  onTogglePreview?: () => void;
  onToggleTerminal?: () => void;
  showExplorer?: boolean;
  showPreview?: boolean;
  showTerminal?: boolean;
  connectionStatus?: "connecting" | "connected" | "disconnected" | "error";
} 