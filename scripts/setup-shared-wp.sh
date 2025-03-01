#!/bin/bash

# Load configuration
source "/app/config.sh"

# Function to download and set up shared WordPress core
setup_shared_core() {
    echo "Setting up shared WordPress core..."
    
    # Create shared WordPress directory
    sudo mkdir -p "$WP_SHARED_DIR"
    sudo chown -R manager:www-data "$WP_SHARED_DIR"
    sudo chmod -R 775 "$WP_SHARED_DIR"
    
    # Check if WordPress is already downloaded
    if [ ! -f "$WP_SHARED_DIR/wp-login.php" ]; then
        echo "WordPress core not found. Downloading WordPress to shared directory..."
        # Download latest WordPress
        wget -q -O /tmp/wordpress.tar.gz https://wordpress.org/latest.tar.gz
        
        # Extract WordPress to shared directory
        tar -xzf /tmp/wordpress.tar.gz -C /tmp
        sudo cp -rf /tmp/wordpress/* "$WP_SHARED_DIR/"
        rm -rf /tmp/wordpress.tar.gz /tmp/wordpress
    else
        echo "WordPress core already exists in shared directory."
    fi
    
    # Set permissions for shared core
    sudo chown -R www-data:www-data "$WP_SHARED_DIR"
    sudo find "$WP_SHARED_DIR" -type d -exec chmod 755 {} \;
    sudo find "$WP_SHARED_DIR" -type f -exec chmod 644 {} \;
    
    echo "Shared WordPress core setup completed!"
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

# Function to create WordPress instance for user with shared core
create_user_instance() {
    local user_id=$1
    local site_dir=$(get_wp_dir "$user_id")
    local site_url=$(get_wp_url "$user_id")
    local db_name=$(get_wp_db_name "$user_id")
    
    echo "Creating WordPress instance for user $user_id with shared core..."
    
    # Create user database
    echo "Creating database: $db_name"
    mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${db_name};"
    
    # Create WordPress directory
    sudo mkdir -p "$site_dir"
    sudo chown -R manager:www-data "$site_dir"
    sudo chmod -R 775 "$site_dir"
    
    # Create symbolic links to shared core
    create_symlinks "$user_id"
    
    # Create wp-content directory and subdirectories
    echo "Creating wp-content directory and subdirectories..."
    sudo mkdir -p "$site_dir/wp-content/plugins"
    sudo mkdir -p "$site_dir/wp-content/themes"
    sudo mkdir -p "$site_dir/wp-content/uploads"
    
    # Copy wp-config-sample.php from shared directory
    sudo cp "$WP_SHARED_DIR/wp-config-sample.php" "$site_dir/wp-config.php"
    
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

# Main command handler
case "$1" in
    "setup-shared")
        setup_shared_core
        ;;
    "create-user")
        if [ -z "$2" ]; then
            echo "Usage: $0 create-user <user_id>"
            exit 1
        fi
        create_user_instance "$2"
        ;;
    *)
        echo "Usage:"
        echo "  $0 setup-shared         # Set up shared WordPress core"
        echo "  $0 create-user <id>     # Create new WordPress instance with shared core"
        ;;
esac 