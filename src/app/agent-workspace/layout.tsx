import type { Metadata } from 'next';

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
    <main className="h-screen overflow-hidden">
      {children}
    </main>
  );
} 