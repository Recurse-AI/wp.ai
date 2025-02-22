#!/bin/bash

# Create the wp-sites directory if it doesn't exist
mkdir -p wp-sites

# Build and run the management container
docker compose -f docker-compose.manager.yml up -d

# Execute the command inside the container
docker compose -f docker-compose.manager.yml exec wp-manager bash -c "cd /app && $*" 