#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set default port if not already set
WP_PORT=${WP_PORT:-8080}

# Check if user ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: User ID is required${NC}"
    echo "Usage: $0 <user_id>"
    exit 1
fi

USER_ID=$1

echo -e "${BLUE}Creating WordPress instance for user: ${USER_ID}${NC}"

# Run the WordPress manager command to create the user
./scripts/run-manager.sh ./wp-next-manager.sh create-user "$USER_ID"

echo -e "${GREEN}WordPress instance created successfully!${NC}"
echo -e "${BLUE}Access your WordPress site at: http://localhost:${WP_PORT}/user_${USER_ID}${NC}"
echo -e "${BLUE}Admin URL: http://localhost:${WP_PORT}/user_${USER_ID}/wp-admin${NC}"
echo -e "${BLUE}Admin username: admin${NC}"
echo -e "${BLUE}Admin password: admin${NC}" 