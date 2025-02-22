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
    sudo mkdir -p "$WP_BASE_DIR" "$WP_CACHE_DIR"
    sudo chown -R manager:www-data "$WP_BASE_DIR" "$WP_CACHE_DIR"
    sudo chmod -R 775 "$WP_BASE_DIR" "$WP_CACHE_DIR"
    
    # Verify MySQL connection
    if mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SELECT 1;" >/dev/null 2>&1; then
        echo "MySQL connection verified"
    else
        echo "Error: Cannot connect to MySQL"
        exit 1
    fi

    echo "Base environment setup completed!"
}

# Function to create WordPress instance for user
create_user_instance() {
    local user_id=$1
    local site_dir=$(get_wp_dir "$user_id")
    local site_url=$(get_wp_url "$user_id")
    local db_name=$(get_wp_db_name "$user_id")
    
    echo "Creating WordPress instance for user $user_id..."
    
    # Create user database
    echo "Creating database: $db_name"
    mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${db_name};"
    
    # Create WordPress directory
    sudo mkdir -p "$site_dir"
    sudo chown -R manager:www-data "$site_dir"
    sudo chmod -R 775 "$site_dir"
    
    # Download and install WordPress
    echo "Downloading WordPress..."
    wp core download --path="$site_dir" --force
    
    # Create wp-config.php
    echo "Configuring WordPress..."
    wp config create \
        --dbname="$db_name" \
        --dbuser="$MYSQL_USER" \
        --dbpass="$MYSQL_PASSWORD" \
        --dbhost="$MYSQL_HOST" \
        --path="$site_dir" \
        --force
        
    # Install WordPress
    echo "Installing WordPress..."
    wp core install \
        --url="$site_url" \
        --title="WordPress Site $user_id" \
        --admin_user="$WP_ADMIN_USER" \
        --admin_password="$WP_ADMIN_PASSWORD" \
        --admin_email="$WP_ADMIN_EMAIL" \
        --path="$site_dir" \
        --skip-email
        
    # Setup Apache virtual host
    create_vhost "$user_id"
        
    # Set final permissions
    sudo chown -R www-data:www-data "$site_dir"
    sudo find "$site_dir" -type d -exec chmod 755 {} \;
    sudo find "$site_dir" -type f -exec chmod 644 {} \;
    
    # Create .htaccess file
    echo "Creating .htaccess file..."
    sudo tee "$site_dir/.htaccess" > /dev/null << EOF
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /user_${user_id}/
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /user_${user_id}/index.php [L]
</IfModule>
# END WordPress
EOF
    
    # Fix permissions for .htaccess
    sudo chown www-data:www-data "$site_dir/.htaccess"
    sudo chmod 644 "$site_dir/.htaccess"
    
    echo "WordPress instance created successfully!"
    echo "Site URL: $site_url"
    echo "Admin URL: $site_url/wp-admin"
    echo "Admin username: $WP_ADMIN_USER"
    echo "Admin password: $WP_ADMIN_PASSWORD"
}

# Function to list WordPress instances
list_instances() {
    echo "WordPress Instances:"
    for site in "$WP_BASE_DIR"/user_*; do
        if [ -d "$site" ]; then
            user_id=$(basename "$site" | sed 's/user_//')
            echo "- User $user_id:"
            echo "  Site: $(get_wp_url "$user_id")"
            echo "  Admin: $(get_wp_url "$user_id")/wp-admin"
        fi
    done
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
    *)
        echo "Usage:"
        echo "  $0 init                # Initialize the environment"
        echo "  $0 create-user <id>    # Create new WordPress instance"
        echo "  $0 list                # List all WordPress instances"
        ;;
esac 