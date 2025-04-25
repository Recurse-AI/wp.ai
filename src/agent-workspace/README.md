# Agent Workspace

This module provides the components and hooks necessary to connect to the WordPress AI agent API and create an interactive workspace.

## Key Components

### API Service

The API service (`apiService.ts`) provides methods for interacting with the WordPress AI agent API:

- Creating workspaces
- Sending messages to the agent
- Managing files in the workspace

### WebSocket Service

The WebSocket service (`websocketService.ts`) handles real-time communication with the agent:

- Establishes a connection to the workspace
- Receives streaming responses from the agent
- Handles reconnection logic if the connection drops

### Hooks

- **useAgentAPI**: Low-level hook for direct API interactions
- **useAgentState**: High-level hook that manages workspace state and integrates API calls

## Usage Example

```tsx
import { useAgentState } from '@/agent-workspace/hooks/useAgentState';

function AgentComponent() {
  // Initialize with an existing workspace ID or create a new one
  const {
    sessionState,
    isLoading,
    error,
    sendMessage,
    createFile,
    updateFile,
    selectFile,
  } = useAgentState({ workspaceId: 'optional-existing-workspace-id' });

  // Send a message to the agent
  const handleSubmit = async (message: string) => {
    await sendMessage(message);
  };

  // Display messages
  return (
    <div>
      <div className="messages">
        {sessionState.messages.map(message => (
          <div key={message.id} className={message.role}>
            {message.content}
          </div>
        ))}
      </div>
      
      <div className="files">
        {/* Render files from sessionState.files */}
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
        handleSubmit(input.value);
        input.value = '';
      }}>
        <input name="message" placeholder="Ask the agent..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## WebSocket Message Types

The agent API uses WebSockets to stream responses. The message types include:

- `connection_established`: Confirms successful connection
- `processing_status`: Indicates if the agent is processing
- `thinking_update`: Contains the agent's internal reasoning
- `text_update`: Contains chunks of the agent's response
- `ai_error`: Contains error information
- `file_update`: Notifications when files are updated
- `file_edit_notification`: Notifications when files are being edited
- `user_activity_notification`: Information about other users' activity

## API Endpoints

- Create workspace: `POST /api/workspace/workspaces/`
- Send agent message: `POST /api/workspace/workspaces/<workspace_id>/agent_message/`
- Create file: `POST /api/workspace/files/`
- Update file content: `POST /api/workspace/files/<file_id>/update_content/`
- Set active file: `POST /api/workspace/workspaces/<workspace_id>/update_active_file/`
- WebSocket connection: `ws://<server>/ws/workspace/<workspace_id>/` 