import type { Metadata } from 'next';
import FileOperationsProvider from '@/agent-workspace/context/FileOperationsContext';

export const metadata: Metadata = {
  title: 'WordPress AI Agent Workspace',
  description: 'Create and edit WordPress plugins and themes with AI assistance',
};

export default function AgentWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col flex-1 h-full w-full overflow-hidden">
      <FileOperationsProvider>
        {children}
      </FileOperationsProvider>
    </main>
  );
} 