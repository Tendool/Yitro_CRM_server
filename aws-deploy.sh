#!/bin/bash

# =================================================================
# AWS Linux Deployment Script for Yitro CRM
# Optimized for Amazon Linux 2023 / RHEL-based systems
# =================================================================

set -e

# Configuration variables
DOMAIN="${DOMAIN:-crm.yitroglobal.com}"
APP_USER="${APP_USER:-ec2-user}"
APP_HOME="/home/$APP_USER"
APP_PATH="$APP_HOME/yitro-crm"
LOG_PATH="/var/log/yitro-crm"
DATA_PATH="$APP_PATH/data"
BACKEND_PORT=3000

echo "🚀 Starting AWS Linux deployment for Yitro CRM..."
echo "   Domain: $DOMAIN"
echo "   App Path: $APP_PATH"
echo "   App User: $APP_USER"
echo ""

# =================================================================
# 1. System Updates and Package Installation
# =================================================================
echo "📦 Updating system packages..."
sudo dnf update -y

echo "📦 Installing required packages..."
sudo dnf install -y nginx git curl wget unzip

# Install Node.js 18.x for AWS Linux
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install PM2 globally
echo "🔄 Installing PM2 process manager..."
sudo npm install -g pm2

# Install SSL/TLS tools
echo "🔐 Installing SSL tools..."
sudo dnf install -y certbot python3-certbot-nginx

# =================================================================
# 2. User and Directory Setup  
# =================================================================
echo "📁 Setting up application directories..."
sudo mkdir -p $APP_PATH
sudo mkdir -p $DATA_PATH
sudo mkdir -p $LOG_PATH

# Set ownership and permissions
sudo chown -R $APP_USER:$APP_USER $APP_PATH
sudo chown -R $APP_USER:$APP_USER $LOG_PATH
sudo chmod 755 $APP_PATH
sudo chmod 755 $DATA_PATH
sudo chmod 755 $LOG_PATH

# =================================================================
# 3. Nginx Configuration for AWS Linux
# =================================================================
echo "🌐 Configuring Nginx..."

# Backup existing configuration
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create optimized Nginx configuration
sudo tee /etc/nginx/nginx.conf > /dev/null <<EOL
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 64M;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    # SSL/TLS Configuration (will be enhanced by certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HTTP server (redirects to HTTPS)
    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server  
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;

        # SSL certificates (will be configured by certbot)
        # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Serve frontend static files
        root $APP_PATH/dist/spa;
        index index.html;

        # Frontend routes (SPA)
        location / {
            try_files \$uri \$uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                access_log off;
            }
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://localhost:$BACKEND_PORT;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login endpoint rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://localhost:$BACKEND_PORT;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Health check
        location /health {
            proxy_pass http://localhost:$BACKEND_PORT;
            access_log off;
        }
    }
}
EOL

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# =================================================================
# 4. Enable and Start Services
# =================================================================
echo "🏃 Starting and enabling services..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# =================================================================
# 5. Firewall Configuration (if firewalld is available)
# =================================================================
if systemctl is-enabled firewalld &>/dev/null; then
    echo "🔥 Configuring firewall..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --reload
fi

# =================================================================
# 6. SSL Certificate Setup
# =================================================================
echo "🔐 Setting up SSL certificate..."
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    # Get SSL certificate from Let's Encrypt
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo "⚠️  SSL certificate setup failed. You may need to:"
        echo "   1. Ensure domain $DOMAIN points to this server"
        echo "   2. Run: sudo certbot --nginx -d $DOMAIN manually"
        echo "   3. Check firewall settings"
    }
    
    # Set up automatic renewal
    echo "⏰ Setting up SSL certificate auto-renewal..."
    (crontab -l 2>/dev/null | grep -v certbot; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
else
    echo "⚠️  Skipping SSL setup for localhost/IP address"
fi

echo ""
echo "✅ AWS Linux deployment setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy your application code to: $APP_PATH"
echo "   2. Run: npm install && npm run build"
echo "   3. Start with PM2: pm2 start ecosystem.config.cjs"
echo "   4. Save PM2 configuration: pm2 save && pm2 startup"
echo ""
echo "🌐 Your application will be available at: https://$DOMAIN"
echo "📊 Monitor with: pm2 monit"
echo "📝 Check logs with: pm2 logs"
echo "🔍 Nginx logs: sudo journalctl -u nginx -f"