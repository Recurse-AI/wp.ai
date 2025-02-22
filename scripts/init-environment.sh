#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing development environment...${NC}"

# Check if Docker is installed and running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running or not installed"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Make scripts executable
chmod +x scripts/wp-next-manager.sh
chmod +x scripts/run-manager.sh

# Create wp-sites directory if it doesn't exist
mkdir -p wp-sites

# Start WordPress management environment
echo -e "${BLUE}Starting WordPress management environment...${NC}"
docker compose -f docker-compose.manager.yml up -d --build

# Initialize WordPress environment
echo -e "${BLUE}Initializing WordPress environment...${NC}"
./scripts/run-manager.sh ./wp-next-manager.sh init

# Create a test WordPress instance
echo -e "${BLUE}Creating test WordPress instance...${NC}"
./scripts/run-manager.sh ./wp-next-manager.sh create-user test

echo -e "${GREEN}WordPress environment setup complete!${NC}"
echo -e "${BLUE}Starting Next.js development server...${NC}"

# Start Next.js development server
pnpm run dev 