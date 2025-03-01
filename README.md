# WordPress AI

A Next.js application with WordPress integration using a shared core approach.

## Architecture

This project implements a WordPress multi-user environment with the following architecture:

- **Shared WordPress Core**: All users share the same WordPress core files (wp-admin, wp-includes, etc.) from a central directory.
- **Per-User Installations**: Each user has their own directory with a unique wp-config.php, their own wp-content folder, and symbolic links to the shared core files.
- **Isolated Databases**: Each user gets their own database, ensuring complete separation of data and content.

## How It Works

The shared WordPress core approach offers several advantages:

1. **Efficient Storage**: Only one copy of the WordPress core files is stored, saving disk space.
2. **Centralized Updates**: When the shared core is updated, all user instances automatically use the new version.
3. **Isolated Content**: Each user has their own `wp-content` directory and database, ensuring complete separation of data.
4. **Symbolic Links**: Each user's directory contains symbolic links to the shared core files, making it appear as a complete WordPress installation.

The implementation works as follows:

1. WordPress core files are downloaded to the `wp-shared/wordpress` directory.
2. For each user, a directory is created in `wp-sites/user_<id>`.
3. Symbolic links are created from the user's directory to the shared core files.
4. A unique `wp-config.php` file is created for each user, pointing to their own database.
5. A `wp-content` directory is created for each user to store their plugins, themes, and uploads.

## Directory Structure

- **wp-shared/wordpress**: Contains the shared WordPress core files.
- **wp-sites**: Contains the user-specific WordPress installations.
  - **wp-sites/user_test**: A test user installation with symbolic links to the shared core.
  - **wp-sites/user_test/wp-content**: Contains the user-specific plugins, themes, and uploads.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Docker Desktop
- pnpm (v8 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wp-ai.git
   cd wp-ai
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Initialize the development environment:
   ```bash
   pnpm run dev:initiate
   ```
   This will:
   - Start the Docker containers
   - Set up the shared WordPress core
   - Create a test user instance
   - Start the Next.js development server

## Usage

### Managing WordPress Instances

- **Start WordPress services**:
  ```bash
  pnpm run wp:start
  ```

- **Stop WordPress services**:
  ```bash
  pnpm run wp:stop
  ```

- **List WordPress instances**:
  ```bash
  pnpm run wp:list
  ```

- **Create a new WordPress instance**:
  ```bash
  pnpm run wp:create-user-id <user_id>
  ```

- **Upload a plugin to a WordPress instance**:
  ```bash
  pnpm run wp:upload-plugin <user_id> <plugin_zip_path>
  ```

- **Update the shared WordPress core**:
  ```bash
  pnpm run wp:update-core
  ```

### Accessing WordPress Instances

Each WordPress instance is accessible at:
```
http://localhost:8080/user_<user_id>
```

For example, the test user's WordPress instance is accessible at:
```
http://localhost:8080/user_test
```

The WordPress admin area is accessible at:
```
http://localhost:8080/user_<user_id>/wp-admin
```

Default admin credentials:
- Username: admin
- Password: admin

## Troubleshooting

### Checking WordPress Installation

If you're experiencing issues with the WordPress installation, you can run the following command to check the status:

```bash
pnpm run wp:check
```

This script will:
- Check if the WordPress directories exist and contain the necessary files
- Verify if the Docker container is running
- Test if WordPress is accessible
- Show the container logs
- Provide troubleshooting suggestions

### Common Issues

1. **WordPress directories are empty or don't exist**:
   - Run `pnpm run dev:initiate` to initialize the environment.

2. **Docker container is not running**:
   - Run `docker compose -f docker-compose.manager.yml down` to stop any existing containers.
   - Run `pnpm run dev:initiate` to start the container again.

3. **Port conflicts**:
   - Run `pnpm run wp:fix-ports` to check for port conflicts and fix them.

4. **WordPress is not accessible**:
   - Check if the Apache server is running in the container:
     ```bash
     docker exec -it $(docker ps -qf "name=wp-manager") bash -c "sudo service apache2 status"
     ```
   - If it's not running, start it:
     ```bash
     docker exec -it $(docker ps -qf "name=wp-manager") bash -c "sudo service apache2 start"
     ```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
