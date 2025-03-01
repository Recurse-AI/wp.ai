#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Default ports
DEFAULT_WP_PORT=8080
DEFAULT_MYSQL_PORT=3307

# Function to check if a port is in use
check_port() {
    local port=$1
    local in_use=false
    
    echo -e "${BLUE}Checking if port $port is in use...${NC}"
    
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        # Windows - more reliable check
        if netstat -ano | grep -E "TCP.*:$port\s+.*LISTENING" > /dev/null; then
            in_use=true
        fi
    else
        # Unix systems
        if command -v lsof > /dev/null && lsof -i ":$port" > /dev/null 2>&1; then
            in_use=true
        elif command -v netstat > /dev/null && netstat -tuln | grep ":$port " > /dev/null; then
            in_use=true
        fi
    fi
    
    if [ "$in_use" = true ]; then
        echo -e "${RED}Port $port is already in use.${NC}"
        return 1
    else
        echo -e "${GREEN}Port $port is available.${NC}"
        return 0
    fi
}

# Function to find an available port
find_available_port() {
    local start_port=$1
    local current_port=$start_port
    
    echo -e "${BLUE}Finding available port starting from $start_port...${NC}"
    
    while ! check_port $current_port > /dev/null; do
        echo -e "${YELLOW}Port $current_port is in use, trying next port...${NC}"
        current_port=$((current_port + 1))
        
        # Avoid checking too many ports
        if [ $((current_port - start_port)) -gt 20 ]; then
            echo -e "${RED}Could not find an available port after checking 20 ports.${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}Found available port: $current_port${NC}"
    echo $current_port
}

# Main function
main() {
    echo -e "${BLUE}Checking and fixing port issues...${NC}"
    
    # Check WordPress port
    if ! check_port $DEFAULT_WP_PORT; then
        echo -e "${YELLOW}Default WordPress port $DEFAULT_WP_PORT is in use.${NC}"
        WP_PORT=$(find_available_port $((DEFAULT_WP_PORT + 1)))
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to find an available port for WordPress.${NC}"
            exit 1
        fi
        echo -e "${GREEN}Setting WordPress port to $WP_PORT${NC}"
    else
        WP_PORT=$DEFAULT_WP_PORT
        echo -e "${GREEN}Using default WordPress port $WP_PORT${NC}"
    fi
    
    # Check MySQL port
    if ! check_port $DEFAULT_MYSQL_PORT; then
        echo -e "${YELLOW}Default MySQL port $DEFAULT_MYSQL_PORT is in use.${NC}"
        MYSQL_PORT=$(find_available_port $((DEFAULT_MYSQL_PORT + 1)))
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to find an available port for MySQL.${NC}"
            exit 1
        fi
        echo -e "${GREEN}Setting MySQL port to $MYSQL_PORT${NC}"
    else
        MYSQL_PORT=$DEFAULT_MYSQL_PORT
        echo -e "${GREEN}Using default MySQL port $MYSQL_PORT${NC}"
    fi
    
    # Export the port variables
    export WP_PORT=$WP_PORT
    export MYSQL_PORT=$MYSQL_PORT
    
    echo -e "${GREEN}Port configuration complete!${NC}"
    echo -e "${BLUE}WordPress port: $WP_PORT${NC}"
    echo -e "${BLUE}MySQL port: $MYSQL_PORT${NC}"
    echo ""
    echo -e "${YELLOW}To use these ports, run:${NC}"
    echo -e "export WP_PORT=$WP_PORT"
    echo -e "export MYSQL_PORT=$MYSQL_PORT"
    echo -e "pnpm run dev:initiate"
}

# Run the main function
main 