#!/bin/bash

# Base configuration
export WP_BASE_URL="http://localhost:8000"
export WP_BASE_DIR="/var/www/sites"
export WP_CACHE_DIR="/var/www/wp-cache"

# MySQL configuration
export MYSQL_HOST="127.0.0.1"
export MYSQL_ROOT_PASSWORD="secure_root_password"
export MYSQL_USER="wp_user"
export MYSQL_PASSWORD="wp_password"
export MYSQL_OPTS="--protocol=tcp"

# Apache configuration
export APACHE_LOG_DIR="/var/log/apache2"
export APACHE_SITES_DIR="/etc/apache2/sites-available"

# WordPress defaults
export WP_ADMIN_USER="admin"
export WP_ADMIN_PASSWORD="admin"
export WP_ADMIN_EMAIL="admin@example.com"

# Function to get WordPress URL for user
get_wp_url() {
    local user_id=$1
    echo "${WP_BASE_URL}/user_${user_id}"
}

# Function to get WordPress directory for user
get_wp_dir() {
    local user_id=$1
    echo "${WP_BASE_DIR}/user_${user_id}"
}

# Function to get database name for user
get_wp_db_name() {
    local user_id=$1
    echo "wp_${user_id}"
} 