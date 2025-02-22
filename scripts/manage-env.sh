#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Add these environment variables at the top
REGISTRY=${REGISTRY:-docker.io/library}
TAG=${TAG:-latest}
IMAGE_NAME="${REGISTRY}/wp-ai-wp-manager:${TAG}"

# Function to get docker command
get_docker_cmd() {
    if command -v docker &> /dev/null; then
        echo "docker"
    else
        echo "/usr/bin/docker"
    fi
}

# Function to get docker-compose command
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif [ -f "/usr/bin/docker-compose" ]; then
        echo "/usr/bin/docker-compose"
    else
        echo "docker compose"
    fi
}

# Set docker commands
DOCKER_CMD=$(get_docker_cmd)
COMPOSE_CMD=$(get_compose_cmd)

# Function to convert paths for Docker
convert_path() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows: Convert to Docker-compatible Windows path
        echo "$1" | sed 's/^\///' | sed 's/\//\\/g' | sed 's/^./\0:/' | sed 's/\\/\//g'
    else
        # Unix systems
        echo "$1"
    fi
}

# Function to get Docker socket path
get_docker_socket() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Windows/WSL2 path
        if [ -e "/var/run/docker.sock" ]; then
            echo "/var/run/docker.sock"
        else
            echo "//./pipe/docker_engine"
        fi
    else
        # Unix path
        echo "/var/run/docker.sock"
    fi
}

# Function to check if container is running
check_container() {
    local container_name=$1
    local status=$(docker inspect -f '{{.State.Status}}' $container_name 2>/dev/null)
    if [ "$status" = "running" ]; then
        return 0
    else
        return 1
    fi
}

# Get Docker group ID from host - with Windows compatibility
get_docker_gid() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Default Docker GID for Windows
        echo "999"
    else
        # Linux/Mac
        getent group docker | cut -d: -f3 || echo "999"
    fi
}

# Function to check if running with admin privileges
check_admin_privileges() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Check if running as administrator on Windows
        net session >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: This script must be run as Administrator${NC}"
            echo "Please right-click on Git Bash and select 'Run as administrator'"
            exit 1
        fi
    fi
}

# Function to ensure Docker is running
ensure_docker_running() {
    echo "Checking Docker status..."
    
    # Check if Docker Desktop is running
    if ! docker version >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        echo "Please start Docker Desktop and try again"
        exit 1
    fi

    # Wait for Docker to be fully ready
    echo "Waiting for Docker to be ready..."
    for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
            echo -e "${GREEN}Docker is ready${NC}"
            return 0
        fi
        echo "Attempt $i/30..."
        sleep 2
    done

    echo -e "${RED}Error: Docker is not responding${NC}"
    echo "Please restart Docker Desktop and try again"
    exit 1
}

# Function to build Docker image with retry
build_docker_image() {
    echo -e "${BLUE}Building Docker image...${NC}"
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt to build image..."
        
        # Try to pull ubuntu image first
        if docker pull ubuntu:22.04; then
            if docker build -t "${IMAGE_NAME}" -f Dockerfile.manager .; then
                echo "Build successful!"
                return 0
            fi
        fi
        
        echo "Build failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo -e "${RED}Error: Failed to build Docker image after $max_attempts attempts${NC}"
    exit 1
}

# Function to wait for container
wait_for_container() {
    local container_id=$1
    local max_attempts=10
    local attempt=1

    echo "Waiting for container to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if docker exec $container_id bash -c "command -v mysql && command -v apache2 && pgrep mysql && pgrep apache2" >/dev/null 2>&1; then
            echo "Container services are running"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts..."
        sleep 3
        attempt=$((attempt + 1))
    done
    return 1
}

# Function to ensure network connectivity
ensure_network() {
    echo "Checking network connectivity..."
    if ! ping -n 1 docker.io >/dev/null 2>&1; then
        echo "Warning: Cannot reach docker.io"
        
        # Try to fix DNS
        if [ -f "$HOME/.docker/daemon.json" ]; then
            echo "Updating Docker DNS settings..."
            cat > "$HOME/.docker/daemon.json" << EOF
{
    "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF
            echo "Please restart Docker Desktop and try again"
            exit 1
        fi
    fi
}

# Function to start environment
start_environment() {
    # Check Docker first
    ensure_docker_running
    
    # Check network
    ensure_network

    echo -e "${BLUE}Starting development environment...${NC}"
    
    # Build Docker image with retry
    build_docker_image

    # Get Windows-compatible paths
    CURRENT_DIR=$(pwd -W 2>/dev/null || pwd)
    SITES_PATH=$(echo "${CURRENT_DIR}/wp-sites" | sed 's/\\/\//g')

    # Create sites directory if it doesn't exist
    mkdir -p wp-sites

    # Remove existing container if it exists
    docker rm -f wp-ai-wp-manager-1 >/dev/null 2>&1 || true

    # Start WordPress management container
    echo -e "${BLUE}Starting WordPress management container...${NC}"
    docker run -d \
        --name wp-ai-wp-manager-1 \
        -v "${SITES_PATH}":/var/www/sites \
        -p 8000:80 \
        -p 3306:3306 \
        -e MYSQL_ROOT_PASSWORD=secure_root_password \
        -e MYSQL_COMMON_USER=wp_user \
        -e MYSQL_COMMON_PASSWORD=wp_password \
        -e APACHE_RUN_USER=www-data \
        -e APACHE_RUN_GROUP=www-data \
        --privileged \
        "${IMAGE_NAME}"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to start container${NC}"
        exit 1
    fi

    # Wait for container to be ready
    if ! wait_for_container wp-ai-wp-manager-1; then
        echo -e "${RED}Error: Container failed to start properly${NC}"
        docker logs wp-ai-wp-manager-1
        exit 1
    fi

    echo -e "${GREEN}Container started successfully${NC}"

    # Initialize WordPress environment
    echo -e "${BLUE}Initializing WordPress environment...${NC}"
    if ! docker exec wp-ai-wp-manager-1 bash -c "cd /app && ./wp-next-manager.sh init"; then
        echo -e "${RED}Error: Failed to initialize WordPress environment${NC}"
        docker logs wp-ai-wp-manager-1
        exit 1
    fi

    # Create test WordPress instance
    echo -e "${BLUE}Creating test WordPress instance...${NC}"
    if ! docker exec wp-ai-wp-manager-1 bash -c "cd /app && ./wp-next-manager.sh create-user test"; then
        echo -e "${RED}Error: Failed to create test WordPress instance${NC}"
        docker logs wp-ai-wp-manager-1
        exit 1
    fi

    echo -e "${GREEN}WordPress environment ready!${NC}"
    echo -e "${BLUE}Starting Next.js development server...${NC}"

    # Start Next.js
    pnpm run dev
}

# Function to destroy environment
destroy_environment() {
    echo -e "${RED}Destroying development environment...${NC}"
    
    # Stop and remove containers with force
    echo "Stopping containers..."
    docker rm -f wp-ai-wp-manager-1 wordpress mysql >/dev/null 2>&1 || true

    # Remove network
    echo "Removing network..."
    docker network rm wp-network >/dev/null 2>&1 || true

    # Remove WordPress files
    echo "Removing files..."
    rm -rf wp-sites

    # Remove Docker volumes
    echo "Cleaning up volumes..."
    docker volume prune -f >/dev/null 2>&1

    # Remove Docker image with force
    echo "Removing Docker image..."
    docker rmi -f "${IMAGE_NAME}" >/dev/null 2>&1 || true

    echo -e "${GREEN}Environment destroyed successfully${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Environment Status:${NC}"
    
    # Check Docker containers
    echo "Docker Containers:"
    docker ps -a | grep -E "wp-ai|wordpress|mysql" || echo "No containers found"
    
    # Check WordPress instances
    echo -e "\nWordPress Instances:"
    if check_container "wp-ai-wp-manager-1"; then
        docker exec wp-ai-wp-manager-1 bash -c "cd /app && ./wp-next-manager.sh list" || echo "No WordPress instances found"
    else
        echo "Management container is not running"
    fi
    
    # Show ports in use
    echo -e "\nPorts in use:"
    echo "- Next.js: 3000"
    echo "- WordPress: 8000"
    echo "- MySQL: 3306"
}

# Main command handler
case "$1" in
    "start")
        start_environment
        ;;
    "destroy")
        destroy_environment
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage:"
        echo "  $0 start    # Start development environment"
        echo "  $0 destroy  # Destroy development environment"
        echo "  $0 status   # Show environment status"
        ;;
esac 