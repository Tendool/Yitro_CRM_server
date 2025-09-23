#!/bin/bash

# =================================================================
# Yitro CRM System Monitoring and Health Check Script
# =================================================================

set -e

APP_PATH="${APP_PATH:-/home/ec2-user/yitro-crm}"
DOMAIN="${DOMAIN:-crm.yitroglobal.com}"

echo "🔍 Yitro CRM System Health Check"
echo "================================="
echo "Date: $(date)"
echo "Server: $(hostname)"
echo "App Path: $APP_PATH"
echo "Domain: $DOMAIN"
echo ""

# =================================================================
# 1. System Resources
# =================================================================
echo "📊 System Resources:"
echo "-------------------"

# Memory usage
echo "Memory Usage:"
free -h | grep -E "Mem:|Swap:"

echo ""

# Disk usage
echo "Disk Usage:"
df -h $APP_PATH 2>/dev/null || df -h /

echo ""

# Load average
echo "Load Average:"
uptime

echo ""

# =================================================================
# 2. Service Status
# =================================================================
echo "🔧 Service Status:"
echo "-----------------"

# PM2 status
echo "PM2 Processes:"
if command -v pm2 >/dev/null 2>&1; then
    pm2 list 2>/dev/null || echo "PM2 not running or no processes"
else
    echo "PM2 not installed"
fi

echo ""

# Nginx status
echo "Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Active"
    echo "   Uptime: $(systemctl show nginx --property=ActiveEnterTimestamp --value | cut -d' ' -f2-)"
else
    echo "❌ Nginx: Inactive"
fi

echo ""

# =================================================================
# 3. Application Health
# =================================================================
echo "🏥 Application Health:"
echo "---------------------"

# Local health check
echo "Local Health Check (localhost:3000):"
if curl -s --max-time 5 http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Application responding locally"
    
    # Get response details
    RESPONSE=$(curl -s --max-time 5 http://localhost:3000/health)
    echo "   Response: $RESPONSE"
else
    echo "❌ Application not responding locally"
fi

echo ""

# External health check (if domain is configured)
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo "External Health Check (https://$DOMAIN):"
    if curl -s --max-time 10 https://$DOMAIN/health >/dev/null 2>&1; then
        echo "✅ Application accessible externally"
        
        # Check response time
        RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null https://$DOMAIN/health)
        echo "   Response time: ${RESPONSE_TIME}s"
    else
        echo "❌ Application not accessible externally"
        echo "   Check: DNS, SSL certificate, firewall"
    fi
else
    echo "⚠️  External health check skipped (localhost domain)"
fi

echo ""

# =================================================================
# 4. Database Status
# =================================================================
echo "🗄️  Database Status:"
echo "-------------------"

if [ -f "$APP_PATH/data/production.db" ]; then
    echo "Database File:"
    echo "   Location: $APP_PATH/data/production.db"
    echo "   Size: $(du -h $APP_PATH/data/production.db | cut -f1)"
    echo "   Modified: $(stat -c %y $APP_PATH/data/production.db | cut -d' ' -f1-2)"
    echo "   Permissions: $(stat -c %a $APP_PATH/data/production.db)"
    
    # Check if database is accessible
    if sqlite3 "$APP_PATH/data/production.db" ".tables" >/dev/null 2>&1; then
        echo "✅ Database accessible"
        
        # Count records in main tables
        echo "   Record counts:"
        echo "     - Users: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM User;" 2>/dev/null || echo 'N/A')"
        echo "     - Accounts: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM Account;" 2>/dev/null || echo 'N/A')"
        echo "     - Contacts: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM Contact;" 2>/dev/null || echo 'N/A')"
    else
        echo "❌ Database not accessible"
    fi
else
    echo "❌ Database file not found: $APP_PATH/data/production.db"
fi

echo ""

# =================================================================
# 5. Log Analysis
# =================================================================
echo "📝 Recent Logs:"
echo "--------------"

# PM2 logs (recent errors)
echo "Recent Application Errors (last 10):"
if [ -f "/var/log/yitro-crm/error.log" ]; then
    tail -n 10 /var/log/yitro-crm/error.log 2>/dev/null || echo "No recent errors"
else
    # Try PM2 logs
    pm2 logs yitro-crm --lines 5 --err 2>/dev/null || echo "No PM2 error logs available"
fi

echo ""

# Nginx error logs
echo "Recent Nginx Errors (last 5):"
sudo tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "No recent Nginx errors"

echo ""

# =================================================================
# 6. Security Status
# =================================================================
echo "🔒 Security Status:"
echo "------------------"

# SSL certificate status
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo "SSL Certificate:"
    if command -v certbot >/dev/null 2>&1; then
        CERT_INFO=$(sudo certbot certificates 2>/dev/null | grep -A 5 "$DOMAIN" || echo "Certificate not found")
        echo "$CERT_INFO"
    else
        echo "Certbot not installed"
    fi
else
    echo "SSL Certificate: N/A (localhost)"
fi

echo ""

# File permissions
echo "Critical File Permissions:"
if [ -f "$APP_PATH/.env" ]; then
    echo "   .env: $(stat -c %a $APP_PATH/.env)"
else
    echo "   .env: File not found"
fi

if [ -f "$APP_PATH/data/production.db" ]; then
    echo "   database: $(stat -c %a $APP_PATH/data/production.db)"
fi

echo ""

# =================================================================
# 7. Network Status
# =================================================================
echo "🌐 Network Status:"
echo "-----------------"

# Check listening ports
echo "Listening Ports:"
echo "   Port 80: $(ss -tlnp | grep :80 | wc -l) processes"
echo "   Port 443: $(ss -tlnp | grep :443 | wc -l) processes"
echo "   Port 3000: $(ss -tlnp | grep :3000 | wc -l) processes"

echo ""

# =================================================================
# 8. Performance Metrics
# =================================================================
echo "⚡ Performance Metrics:"
echo "----------------------"

# CPU usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print "   Load: " $2 " " $3 " " $4}'

echo ""

# Memory usage details
echo "Memory Details:"
echo "   $(free -h | grep Mem | awk '{print "Total: " $2 ", Used: " $3 " (" $3/$2*100 "%), Available: " $7}')"

echo ""

# Process information
echo "Yitro CRM Processes:"
ps aux | grep -E "(node|yitro-crm)" | grep -v grep | head -5

echo ""

# =================================================================
# 9. Recommendations
# =================================================================
echo "💡 Health Check Summary:"
echo "========================"

ISSUES=0

# Check critical services
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx is not running"
    ISSUES=$((ISSUES + 1))
fi

if ! pm2 list 2>/dev/null | grep -q "yitro-crm.*online"; then
    echo "❌ Yitro CRM application is not running"
    ISSUES=$((ISSUES + 1))
fi

if ! curl -s --max-time 5 http://localhost:3000/health >/dev/null 2>&1; then
    echo "❌ Application health check failed"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f "$APP_PATH/data/production.db" ]; then
    echo "❌ Database file missing"
    ISSUES=$((ISSUES + 1))
fi

# Check disk space
DISK_USAGE=$(df $APP_PATH | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  Disk usage is high: ${DISK_USAGE}%"
    ISSUES=$((ISSUES + 1))
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    echo "⚠️  Memory usage is high: ${MEMORY_USAGE}%"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All systems operational"
    echo ""
    echo "🚀 System Status: HEALTHY"
else
    echo ""
    echo "⚠️  System Status: $ISSUES ISSUES DETECTED"
    echo ""
    echo "🔧 Troubleshooting Commands:"
    echo "   • Check PM2 logs: pm2 logs yitro-crm"
    echo "   • Restart application: pm2 restart yitro-crm"
    echo "   • Check Nginx: sudo systemctl status nginx"
    echo "   • View system logs: sudo journalctl -f"
fi

echo ""
echo "📊 Monitor completed at $(date)"