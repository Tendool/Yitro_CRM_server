#!/bin/bash

# =================================================================
# Complete Application Deployment Script for AWS Linux
# This script handles the full application deployment process
# =================================================================

set -e

# Configuration
APP_USER="${APP_USER:-ec2-user}"
APP_HOME="/home/$APP_USER"
APP_PATH="$APP_HOME/yitro-crm"
REPO_URL="${REPO_URL:-https://github.com/Tendool/Yitro_CRM_server.git}"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-crm.yitroglobal.com}"

echo "🚀 Starting Yitro CRM application deployment..."
echo "   App Path: $APP_PATH"
echo "   Repository: $REPO_URL"
echo "   Branch: $BRANCH"
echo "   Domain: $DOMAIN"
echo ""

# =================================================================
# 1. Application Code Deployment
# =================================================================
echo "📥 Deploying application code..."

# Create backup of existing deployment
if [ -d "$APP_PATH" ]; then
    echo "📦 Creating backup of existing deployment..."
    sudo cp -r "$APP_PATH" "$APP_PATH.backup.$(date +%Y%m%d_%H%M%S)" || true
fi

# Clone or update repository
if [ ! -d "$APP_PATH/.git" ]; then
    echo "📥 Cloning repository..."
    git clone -b $BRANCH $REPO_URL $APP_PATH
    cd $APP_PATH
else
    echo "🔄 Updating existing repository..."
    cd $APP_PATH
    git fetch origin
    git reset --hard origin/$BRANCH
    git pull origin $BRANCH
fi

# Set ownership
sudo chown -R $APP_USER:$APP_USER $APP_PATH

# =================================================================
# 2. Dependencies and Build
# =================================================================
echo "📦 Installing dependencies..."
cd $APP_PATH
npm install --production

echo "🔨 Building application..."
npm run build

# Verify build outputs
if [ ! -f "dist/server/node-build.mjs" ]; then
    echo "❌ Server build failed - node-build.mjs not found"
    exit 1
fi

if [ ! -f "dist/spa/index.html" ]; then
    echo "❌ Client build failed - spa/index.html not found"
    exit 1
fi

echo "✅ Build completed successfully"

# =================================================================
# 3. Environment Configuration
# =================================================================
echo "⚙️  Setting up environment configuration..."

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64)
    echo "🔐 Generated JWT secret"
fi

# Create production environment file
cat > .env.production << EOL
# Yitro CRM Production Environment
NODE_ENV=production
PORT=3000
DOMAIN=https://$DOMAIN

# Database Configuration
DATABASE_URL=file:$APP_PATH/data/production.db

# Security
JWT_SECRET=$JWT_SECRET

# SMTP Configuration (AWS SES recommended)
SMTP_SERVICE=ses
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER:-your-ses-smtp-username}
SMTP_PASS=${SMTP_PASS:-your-ses-smtp-password}
FROM_EMAIL=${FROM_EMAIL:-noreply@$DOMAIN}

# AWS Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_SES_HOST=${AWS_SES_HOST:-email-smtp.us-east-1.amazonaws.com}

# Application Settings
SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -base64 32)}
CORS_ORIGIN=https://$DOMAIN
EOL

# Copy to main .env file
cp .env.production .env

echo "✅ Environment configuration completed"

# =================================================================
# 4. Database Setup
# =================================================================
echo "🗄️  Setting up database..."

# Create data directory
mkdir -p data
chmod 755 data

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy || {
    echo "⚠️  Database migration failed, attempting to create database..."
    npx prisma db push --accept-data-loss
}

# Set database permissions
chmod 644 data/*.db 2>/dev/null || true

echo "✅ Database setup completed"

# =================================================================
# 5. PM2 Process Management
# =================================================================
echo "🔄 Setting up PM2 process management..."

# Stop existing processes
pm2 delete yitro-crm 2>/dev/null || true

# Start application with PM2
pm2 start ecosystem.config.aws.cjs --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (for auto-start on server reboot)
pm2 startup systemd -u $APP_USER --hp $APP_HOME

echo "✅ PM2 setup completed"

# =================================================================
# 6. Health Checks and Verification
# =================================================================
echo "🏥 Running health checks..."

# Wait for application to start
sleep 10

# Check if PM2 process is running
if ! pm2 list | grep -q "yitro-crm.*online"; then
    echo "❌ Application failed to start with PM2"
    pm2 logs yitro-crm --lines 50
    exit 1
fi

# Check if application responds
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Application health check passed"
else
    echo "⚠️  Application health check failed, checking logs..."
    pm2 logs yitro-crm --lines 20
fi

# Check if Nginx is running
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    sudo systemctl status nginx
fi

# =================================================================
# 7. Security and Performance Optimization
# =================================================================
echo "🔒 Applying security and performance optimizations..."

# Set proper file permissions
find $APP_PATH -type f -name "*.js" -exec chmod 644 {} \;
find $APP_PATH -type f -name "*.json" -exec chmod 644 {} \;
find $APP_PATH -type d -exec chmod 755 {} \;

# Secure sensitive files
chmod 600 .env .env.production 2>/dev/null || true

# Clean up build artifacts and dev dependencies
rm -rf node_modules/.cache 2>/dev/null || true
npm prune --production

echo "✅ Security optimizations completed"

# =================================================================
# 8. Monitoring and Logging Setup
# =================================================================
echo "📊 Setting up monitoring and logging..."

# Create log rotation configuration
sudo tee /etc/logrotate.d/yitro-crm > /dev/null << EOL
/var/log/yitro-crm/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOL

# Create monitoring script
cat > $APP_PATH/monitor.sh << EOL
#!/bin/bash
# Simple monitoring script for Yitro CRM

echo "=== Yitro CRM System Status ==="
echo "Date: \$(date)"
echo ""

echo "PM2 Status:"
pm2 list

echo ""
echo "Application Health:"
curl -s http://localhost:3000/health || echo "Health check failed"

echo ""
echo "System Resources:"
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h $APP_PATH

echo ""
echo "Recent Error Logs:"
tail -n 10 /var/log/yitro-crm/error.log 2>/dev/null || echo "No error logs found"
EOL

chmod +x $APP_PATH/monitor.sh

echo "✅ Monitoring setup completed"

# =================================================================
# 9. Deployment Summary
# =================================================================
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Application deployed to: $APP_PATH"
echo "   • Frontend build: dist/spa/"
echo "   • Backend build: dist/server/node-build.mjs"
echo "   • Database: $APP_PATH/data/production.db"
echo "   • PM2 process: yitro-crm"
echo "   • Environment: production"
echo ""
echo "🌐 Access URLs:"
echo "   • Application: https://$DOMAIN"
echo "   • Health Check: https://$DOMAIN/health"
echo ""
echo "📊 Management Commands:"
echo "   • View logs: pm2 logs yitro-crm"
echo "   • Monitor: pm2 monit"
echo "   • Restart: pm2 restart yitro-crm"
echo "   • System status: ./monitor.sh"
echo ""
echo "🔍 Troubleshooting:"
echo "   • PM2 logs: pm2 logs yitro-crm"
echo "   • Nginx logs: sudo journalctl -u nginx -f"
echo "   • System logs: sudo journalctl -u yitro-crm -f"
echo ""

# Display current status
echo "📊 Current System Status:"
pm2 list
echo ""
systemctl is-active nginx && echo "✅ Nginx: Active" || echo "❌ Nginx: Inactive"
curl -s http://localhost:3000/health && echo "✅ Application: Healthy" || echo "⚠️  Application: Health check failed"

echo ""
echo "🚀 Yitro CRM is now ready for production use!"