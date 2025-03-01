#!/bin/bash

# Load configuration
source "/app/config.sh"

# Function to create Apache virtual host
create_vhost() {
    local user_id=$1
    local site_dir=$(get_wp_dir "$user_id")
    local conf_file="${APACHE_SITES_DIR}/user_${user_id}.conf"

    # Create Apache configuration
    sudo tee "$conf_file" > /dev/null << EOF
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/sites
    Alias /user_${user_id} ${site_dir}

    <Directory ${site_dir}>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
        
        <FilesMatch \.php$>
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>

    # PHP Configuration
    <IfModule mod_php.c>
        php_flag display_errors on
        php_value error_reporting E_ALL
    </IfModule>
</VirtualHost>
EOF

    # Enable site and restart Apache
    sudo a2ensite "user_${user_id}.conf"
    sudo apache2ctl configtest
    sudo apache2ctl graceful
}

# Function to setup base environment
setup_environment() {
    echo "Setting up WordPress environment..."
    
    # Create required directories
    sudo mkdir -p "$WP_BASE_DIR" "$WP_CACHE_DIR" "$WP_SHARED_DIR"
    sudo chown -R manager:www-data "$WP_BASE_DIR" "$WP_CACHE_DIR" "$WP_SHARED_DIR"
    
    # Start MySQL and Apache
    echo "Starting services..."
    sudo service mysql start
    sudo service apache2 start
    
    # Enable required Apache modules
    echo "Enabling Apache modules..."
    sudo a2enmod rewrite
    sudo a2enmod vhost_alias
    sudo apache2ctl restart
    
    # Install WP-CLI if not already installed
    if ! command -v wp &> /dev/null; then
        echo "Installing WP-CLI..."
        curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
        chmod +x wp-cli.phar
        sudo mv wp-cli.phar /usr/local/bin/wp
    fi
    
    # Setup shared WordPress core
    echo "Setting up shared WordPress core..."
    bash /app/setup-shared-wp.sh setup-shared
    
    echo "WordPress environment setup completed!"
}

# Function to create symbolic links to shared core
create_symlinks() {
    local user_id=$1
    local site_dir=$(get_wp_dir "$user_id")
    local shared_dir="$WP_SHARED_DIR"
    
    echo "Creating symbolic links to shared WordPress core for user $user_id..."
    
    # Create symbolic links for all core files except wp-content
    for item in $(find "$shared_dir" -maxdepth 1 -not -name "wp-content" -not -name "wp-config-sample.php" -not -name "wp-config.php" -not -name "."); do
        local basename=$(basename "$item")
        sudo ln -sf "$item" "$site_dir/$basename"
    done
    
    echo "Symbolic links created successfully!"
}

# Function to create WordPress instance for user
create_user_instance() {
    local user_id=$1
    
    echo "Creating WordPress instance for user $user_id..."
    
    # Call the setup-shared-wp.sh script to create user instance
    bash /app/setup-shared-wp.sh create-user "$user_id"
}

# Function to list all WordPress instances
list_instances() {
    echo "Listing all WordPress instances..."
    
    # List all user directories
    echo "User directories:"
    ls -la "$WP_BASE_DIR" | grep "user_"
    
    # List all databases
    echo "WordPress databases:"
    mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SHOW DATABASES LIKE 'wp_%';"
}

# Function to upload plugin to user's WordPress
upload_plugin() {
    local user_id=$1
    local plugin_zip=$2
    local site_dir=$(get_wp_dir "$user_id")
    
    echo "Uploading plugin to user $user_id's WordPress..."
    
    # Check if plugin zip exists
    if [ ! -f "$plugin_zip" ]; then
        echo "Error: Plugin zip file not found: $plugin_zip"
        exit 1
    fi
    
    # Install plugin using WP-CLI
    wp plugin install "$plugin_zip" --path="$site_dir" --force
    
    echo "Plugin uploaded successfully!"
}

# Function to update shared WordPress core
update_shared_core() {
    echo "Updating shared WordPress core..."
    
    # Backup current shared core
    local backup_dir="/var/www/wp-backups/core-$(date +%Y%m%d%H%M%S)"
    sudo mkdir -p "$backup_dir"
    sudo cp -r "$WP_SHARED_DIR"/* "$backup_dir/"
    
    # Update WordPress core
    bash /app/setup-shared-wp.sh setup-shared
    
    echo "Shared WordPress core updated successfully!"
}

# Main command handler
case "$1" in
    "init")
        setup_environment
        ;;
    "create-user")
        if [ -z "$2" ]; then
            echo "Usage: $0 create-user <user_id>"
            exit 1
        fi
        create_user_instance "$2"
        ;;
    "list")
        list_instances
        ;;
    "upload-plugin")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 upload-plugin <user_id> <plugin_zip_path>"
            exit 1
        fi
        upload_plugin "$2" "$3"
        ;;
    "update-core")
        update_shared_core
        ;;
    "start")
        echo "Starting WordPress services..."
        sudo service mysql start
        sudo service apache2 start
        echo "WordPress services started!"
        ;;
    "stop")
        echo "Stopping WordPress services..."
        sudo service apache2 stop
        sudo service mysql stop
        echo "WordPress services stopped!"
        ;;
    *)
        echo "Usage:"
        echo "  $0 init                # Initialize the environment"
        echo "  $0 create-user <id>    # Create new WordPress instance"
        echo "  $0 list                # List all WordPress instances"
        echo "  $0 upload-plugin <user_id> <plugin_zip_path>  # Upload plugin to user's WordPress"
        echo "  $0 update-core         # Update shared WordPress core"
        echo "  $0 start               # Start WordPress services"
        echo "  $0 stop                # Stop WordPress services"
        ;;
esac 