#!/bin/bash
set -e

echo "Starting docker-entrypoint.sh..."
echo "Current user and groups:"
id

# Load configuration
source "/app/config.sh"

# Create required directories
sudo mkdir -p /var/run/apache2 /var/lock/apache2 /var/lib/mysql-files /var/run/mysqld
sudo chown -R www-data:www-data /var/run/apache2 /var/lock/apache2
sudo chown -R mysql:mysql /var/lib/mysql-files /var/lib/mysql /var/run/mysqld
sudo chmod 775 /var/run/mysqld

# Start MySQL with proper permissions
echo "Starting MySQL..."
sudo service mysql start || {
    echo "Failed to start MySQL, checking status..."
    sudo service mysql status
    echo "MySQL error log:"
    sudo tail -n 50 /var/log/mysql/error.log || true
    exit 1
}

# Wait for MySQL with better error handling
echo "Verifying MySQL connection..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"127.0.0.1" -e "SELECT 1;" >/dev/null 2>&1; then
        echo "MySQL is ready"
        break
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
    
    if [ $((attempt % 10)) -eq 0 ]; then
        echo
        echo "Attempt $attempt: Checking MySQL status..."
        sudo service mysql status
        ls -la /var/run/mysqld/
        sudo tail -n 5 /var/log/mysql/error.log || true
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "Failed to connect to MySQL after $max_attempts attempts"
    exit 1
fi

# Create required directories from config
echo "Creating required directories..."
sudo mkdir -p "$WP_BASE_DIR" "$WP_CACHE_DIR"
sudo chown -R manager:www-data "$WP_BASE_DIR" "$WP_CACHE_DIR"
sudo chmod -R 775 "$WP_BASE_DIR" "$WP_CACHE_DIR"

# Ensure WordPress database exists
echo "Verifying WordPress database..."
mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"127.0.0.1" -e "CREATE DATABASE IF NOT EXISTS wordpress;"

# Start Apache
echo "Starting Apache..."
sudo mkdir -p /var/run/apache2
sudo chown -R www-data:www-data /var/run/apache2

# Debug Apache configuration
echo "Apache configuration:"
apache2ctl -S
echo "Enabled mods:"
ls -l /etc/apache2/mods-enabled/
echo "Enabled sites:"
ls -l /etc/apache2/sites-enabled/
echo "Site directories:"
ls -l /var/www/sites/

# Test Apache configuration
echo "Testing Apache configuration..."
if ! sudo apache2ctl configtest; then
    echo "Apache configuration test failed"
    exit 1
fi

# Start Apache
if ! sudo service apache2 start; then
    echo "Failed to start Apache"
    exit 1
fi
echo "Apache started successfully"

# Keep container running
if [ "$1" = "apache2-foreground.sh" ]; then
    # If apache2-foreground is specified, keep the container running
    echo "Keeping container running..."
    tail -f /dev/null
else
    # Otherwise, run the specified command
    exec "$@"
fi