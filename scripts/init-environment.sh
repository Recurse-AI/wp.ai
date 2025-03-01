#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing development environment...${NC}"

# Check if Docker is installed and running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running or not installed${NC}"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Set Docker socket path based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows
    export DOCKER_SOCK="//./pipe/docker_engine"
else
    # Unix systems
    export DOCKER_SOCK="/var/run/docker.sock"
fi

# Set port environment variables
# Use alternative ports to avoid conflicts
export WP_PORT=8080
export MYSQL_PORT=3307

# Make scripts executable
chmod +x scripts/wp-next-manager.sh
chmod +x scripts/run-manager.sh
chmod +x scripts/setup-shared-wp.sh
chmod +x scripts/fix-ports.sh
chmod +x scripts/check-wp-install.sh

# Create required directories if they don't exist
mkdir -p wp-sites
mkdir -p wp-shared/wordpress

# Check and fix port issues
echo -e "${BLUE}Checking for port conflicts...${NC}"
source scripts/fix-ports.sh

# Stop any existing containers
echo -e "${BLUE}Stopping any existing containers...${NC}"
docker compose -f docker-compose.manager.yml down 2>/dev/null || true

# Start WordPress management environment
echo -e "${BLUE}Starting WordPress management environment...${NC}"
docker compose -f docker-compose.manager.yml up -d --build

# Wait for container to be ready
echo -e "${BLUE}Waiting for container to be ready...${NC}"
sleep 10

# Check if container is running
if ! docker ps | grep -q wp-manager; then
    echo -e "${RED}Error: Container failed to start${NC}"
    echo "Checking container logs:"
    docker logs $(docker ps -aqf "name=wp-manager") 2>/dev/null || echo "No logs available"
    exit 1
fi

# Manually download WordPress to the shared directory
echo -e "${BLUE}Downloading WordPress to shared directory...${NC}"
if [ ! -f "wp-shared/wordpress/wp-login.php" ]; then
    echo -e "${BLUE}WordPress core not found. Downloading...${NC}"
    wget -q -O /tmp/wordpress.tar.gz https://wordpress.org/latest.tar.gz
    tar -xzf /tmp/wordpress.tar.gz -C /tmp
    cp -rf /tmp/wordpress/* wp-shared/wordpress/
    rm -rf /tmp/wordpress.tar.gz /tmp/wordpress
    echo -e "${GREEN}WordPress core downloaded successfully${NC}"
else
    echo -e "${GREEN}WordPress core already exists${NC}"
fi

# Copy setup-shared-wp.sh to container
echo -e "${BLUE}Copying setup script to container...${NC}"
docker cp scripts/setup-shared-wp.sh $(docker ps -qf "name=wp-manager"):/app/setup-shared-wp.sh
docker exec $(docker ps -qf "name=wp-manager") chmod +x /app/setup-shared-wp.sh

# Initialize WordPress environment
echo -e "${BLUE}Initializing WordPress environment...${NC}"
if ! ./scripts/run-manager.sh ./wp-next-manager.sh init; then
    echo -e "${RED}Error: Failed to initialize WordPress environment${NC}"
    echo "Please check the logs above for more information."
    exit 1
fi

# Create a test WordPress instance
echo -e "${BLUE}Creating test WordPress instance...${NC}"
if ! ./scripts/run-manager.sh ./wp-next-manager.sh create-user test; then
    echo -e "${RED}Error: Failed to create test WordPress instance${NC}"
    echo "Please check the logs above for more information."
    exit 1
fi

echo -e "${GREEN}WordPress environment setup complete!${NC}"
echo -e "${BLUE}WordPress is available at: http://localhost:${WP_PORT}/user_test${NC}"
echo -e "${BLUE}Admin URL: http://localhost:${WP_PORT}/user_test/wp-admin${NC}"
echo -e "${BLUE}Admin username: admin${NC}"
echo -e "${BLUE}Admin password: admin${NC}"
echo -e "${BLUE}Starting Next.js development server...${NC}"

# Start Next.js development server
pnpm run dev 