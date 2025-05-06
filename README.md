# WordPress AI Agent Frontend

A modern Next.js frontend application for interacting with WordPress AI agents. This application provides a user-friendly interface for managing WordPress sites, communicating with AI agents, and working with WordPress content.

## Features

- **AI Agent Workspace**: Interactive workspace for communicating with WordPress AI agents
- **Authentication System**: Complete user authentication flow with sign-in, sign-up, password reset, and email verification
- **Landing Page**: Modern, responsive landing page with various sections showcasing the application's features
- **Chat Interface**: Real-time chat interface for communicating with AI agents
- **WordPress Integration**: Seamless integration with WordPress sites through API and WebSocket connections
- **Community Features**: Community section for user interaction and collaboration
- **Modern UI**: Built with Tailwind CSS, Radix UI, and other modern UI libraries

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Libraries**: 
  - Tailwind CSS for styling
  - Radix UI for accessible components
  - Framer Motion for animations
  - React Hot Toast for notifications
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Code Editor**: Monaco Editor
- **Markdown Rendering**: React Markdown with syntax highlighting
- **Real-time Communication**: Socket.io client for WebSocket connections
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```
3. Copy `.env.example` to `.env.local` and update the environment variables

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

### WordPress Environment Management

The project includes several scripts for managing WordPress environments:

```bash
# Start WordPress environment
npm run wp:start
# or
yarn wp:start

# Stop WordPress environment
npm run wp:stop
# or
yarn wp:stop

# List WordPress installations
npm run wp:list
# or
yarn wp:list

# Create WordPress user
npm run wp:create-user
# or
yarn wp:create-user

# Upload plugin to WordPress
npm run wp:upload-plugin
# or
yarn wp:upload-plugin

# Update WordPress core
npm run wp:update-core
# or
yarn wp:update-core
```

### Building for Production

```bash
# Build the application
npm run build
# or
yarn build
# or
pnpm build

# Start the production server
npm run start
# or
yarn start
# or
pnpm start
```

## Project Structure

- `/src/agent-workspace`: Components and hooks for the WordPress AI agent workspace
- `/src/app`: Next.js app router pages and layouts
- `/src/components`: Reusable UI components
- `/src/context`: React context providers
- `/src/lib`: Utility libraries and hooks
- `/src/styles`: Global styles
- `/src/utils`: Helper functions

## Agent Workspace

The agent workspace module provides components and hooks for connecting to the WordPress AI agent API and creating an interactive workspace. Key features include:

- API service for interacting with the WordPress AI agent API
- WebSocket service for real-time communication
- Hooks for managing workspace state and API interactions

## API Endpoints

The application communicates with a backend server through various API endpoints:

- WordPress API: Proxied through `/wp-api/:userId/:path*`
- WebSocket API: Proxied through `/api/ws/:path*`
- User feedback: `POST /api/users/feedback/`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [WordPress](https://wordpress.org/)
