#!/bin/bash

# Set Docker socket path based on OS if not already set
if [ -z "$DOCKER_SOCK" ]; then
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows
        export DOCKER_SOCK="//./pipe/docker_engine"
    else
        # Unix systems
        export DOCKER_SOCK="/var/run/docker.sock"
    fi
fi

# Set default port values if not already set
if [ -z "$WP_PORT" ]; then
    export WP_PORT=8080
fi

if [ -z "$MYSQL_PORT" ]; then
    export MYSQL_PORT=3307
fi

# Create the wp-sites directory if it doesn't exist
mkdir -p wp-sites
mkdir -p wp-shared

# Build and run the management container
docker compose -f docker-compose.manager.yml up -d

# Execute the command inside the container
docker compose -f docker-compose.manager.yml exec wp-manager bash -c "cd /app && $*" 