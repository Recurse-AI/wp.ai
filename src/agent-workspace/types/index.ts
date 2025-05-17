// Core types for workspace, messages, and file actions
export interface WorkspaceData {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ToolInvocation {
  id: string;
  tool_name: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface MessageData {
  id: string;
  workspace_id: string;
  sender: 'user' | 'ai';
  text: string;
  tools_invoked: ToolInvocation[];
  timestamp: string;
}

export interface FileActionData {
  id: string;
  workspace_id: string;
  action_type: 'create' | 'update' | 'delete' | 'move' | 'rename';
  path: string;
  metadata: Record<string, any>;
  timestamp: string;
  message_id?: string;
}

export interface FileNode {
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: Record<string, FileNode>;
}

// Project File System Management Type
export interface ProjectFileSystem {
  rootDirectory: string;
  files: Record<string, FileNode>;
  history: FileSystemHistoryEntry[];
  currentState: Record<string, FileNode>;
  lastUpdated: string;
}

export interface FileSystemHistoryEntry {
  id: string;
  action: FileActionData;
  timestamp: string;
  previousState?: string; // Path to the previous state of the file/folder
  message_id?: string;    // Reference to the message that triggered this change
}

// Interconnected Conversation Steps Type
export enum StepType {
  Message = 'message',
  ToolInvocation = 'tool_invocation',
  FileAction = 'file_action'
}

export interface ConversationStep {
  id: string;
  workspace_id: string;
  sequence_number: number;
  type: StepType;
  content: MessageData | ToolInvocation | FileActionData;
  parent_step_id?: string;  // Reference to the step that triggered this step
  child_step_ids: string[]; // References to steps triggered by this step
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  execution_time?: number;  // Time taken to execute this step in milliseconds
}

export interface ConversationThread {
  id: string;
  workspace_id: string;
  steps: ConversationStep[];
  current_step_id?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
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
  onToggleHistory?: () => void;
  showExplorer?: boolean;
  showPreview?: boolean;
  showTerminal?: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}