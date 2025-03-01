#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking WordPress installation...${NC}"

# Check if wp-shared/wordpress directory exists and has files
if [ -d "wp-shared/wordpress" ] && [ "$(ls -A wp-shared/wordpress 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ wp-shared/wordpress directory exists and contains files${NC}"
    
    # Check for key WordPress files
    if [ -f "wp-shared/wordpress/wp-login.php" ] && [ -f "wp-shared/wordpress/wp-config-sample.php" ]; then
        echo -e "${GREEN}✓ WordPress core files found in shared directory${NC}"
    else
        echo -e "${RED}✗ WordPress core files missing in shared directory${NC}"
        echo -e "${YELLOW}Shared WordPress directory exists but may not contain a valid WordPress installation${NC}"
    fi
else
    echo -e "${RED}✗ wp-shared/wordpress directory is empty or doesn't exist${NC}"
    echo -e "${YELLOW}Creating directory structure...${NC}"
    mkdir -p wp-shared/wordpress
fi

# Check if wp-sites directory exists and has files
if [ -d "wp-sites" ] && [ "$(ls -A wp-sites 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ wp-sites directory exists and contains files${NC}"
    
    # Check if user_test directory exists
    if [ -d "wp-sites/user_test" ]; then
        echo -e "${GREEN}✓ Test user directory exists${NC}"
        
        # Check if wp-content directory exists for test user
        if [ -d "wp-sites/user_test/wp-content" ]; then
            echo -e "${GREEN}✓ wp-content directory exists for test user${NC}"
        else
            echo -e "${RED}✗ wp-content directory doesn't exist for test user${NC}"
        fi
        
        # Check if symbolic links exist
        if [ -L "wp-sites/user_test/wp-admin" ] || [ -L "wp-sites/user_test/wp-includes" ]; then
            echo -e "${GREEN}✓ Symbolic links to shared WordPress core exist${NC}"
        else
            echo -e "${RED}✗ Symbolic links to shared WordPress core don't exist${NC}"
        fi
        
        # Check if wp-config.php exists
        if [ -f "wp-sites/user_test/wp-config.php" ]; then
            echo -e "${GREEN}✓ wp-config.php exists for test user${NC}"
        else
            echo -e "${RED}✗ wp-config.php doesn't exist for test user${NC}"
        fi
    else
        echo -e "${RED}✗ Test user directory doesn't exist${NC}"
    fi
else
    echo -e "${RED}✗ wp-sites directory is empty or doesn't exist${NC}"
    echo -e "${YELLOW}Creating directory structure...${NC}"
    mkdir -p wp-sites
fi

# Check Docker container status
echo -e "\n${BLUE}Checking Docker container status...${NC}"
if docker ps | grep -q wp-manager; then
    echo -e "${GREEN}✓ WordPress container is running${NC}"
    
    # Check if setup-shared-wp.sh exists in container
    if docker exec $(docker ps -qf "name=wp-manager") test -f /app/setup-shared-wp.sh; then
        echo -e "${GREEN}✓ setup-shared-wp.sh script exists in container${NC}"
    else
        echo -e "${RED}✗ setup-shared-wp.sh script doesn't exist in container${NC}"
        echo -e "${YELLOW}Try copying the script to the container:${NC}"
        echo -e "docker cp scripts/setup-shared-wp.sh \$(docker ps -qf \"name=wp-manager\"):/app/setup-shared-wp.sh"
        echo -e "docker exec \$(docker ps -qf \"name=wp-manager\") chmod +x /app/setup-shared-wp.sh"
    fi
    
    # Check if WordPress is accessible
    echo -e "\n${BLUE}Checking WordPress accessibility...${NC}"
    WP_PORT=${WP_PORT:-8080}
    if command -v curl >/dev/null 2>&1; then
        if curl -s "http://localhost:${WP_PORT}/user_test" | grep -q "WordPress"; then
            echo -e "${GREEN}✓ WordPress is accessible at http://localhost:${WP_PORT}/user_test${NC}"
        else
            echo -e "${RED}✗ WordPress is not accessible at http://localhost:${WP_PORT}/user_test${NC}"
        fi
    else
        echo -e "${YELLOW}! curl command not found, can't check WordPress accessibility${NC}"
    fi
    
    # Show container logs
    echo -e "\n${BLUE}Container logs (last 10 lines):${NC}"
    docker logs $(docker ps -qf "name=wp-manager") --tail 10
else
    echo -e "${RED}✗ WordPress container is not running${NC}"
    
    # Check if container exists but is stopped
    if docker ps -a | grep -q wp-manager; then
        echo -e "${YELLOW}Container exists but is stopped. Checking logs...${NC}"
        docker logs $(docker ps -aqf "name=wp-manager") --tail 10
    else
        echo -e "${RED}Container doesn't exist${NC}"
    fi
fi

echo -e "\n${BLUE}Troubleshooting suggestions:${NC}"
echo -e "1. Try stopping and removing existing containers:"
echo -e "   ${YELLOW}docker compose -f docker-compose.manager.yml down${NC}"
echo -e "2. Check for port conflicts:"
echo -e "   ${YELLOW}pnpm run wp:fix-ports${NC}"
echo -e "3. Try running the initialization script again:"
echo -e "   ${YELLOW}pnpm run dev:initiate${NC}"
echo -e "4. Check Docker logs for more details:"
echo -e "   ${YELLOW}docker logs \$(docker ps -aqf \"name=wp-manager\")${NC}"
echo -e "5. Manually download WordPress to the shared directory:"
echo -e "   ${YELLOW}wget -q -O /tmp/wordpress.tar.gz https://wordpress.org/latest.tar.gz${NC}"
echo -e "   ${YELLOW}tar -xzf /tmp/wordpress.tar.gz -C /tmp${NC}"
echo -e "   ${YELLOW}cp -rf /tmp/wordpress/* wp-shared/wordpress/${NC}"
echo -e "   ${YELLOW}rm -rf /tmp/wordpress.tar.gz /tmp/wordpress${NC}" 