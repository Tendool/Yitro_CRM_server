#!/bin/bash

# =================================================================
# AWS Production Environment Setup Script
# Creates and validates production environment configuration
# =================================================================

set -e

# Configuration
APP_PATH="${APP_PATH:-/home/ec2-user/yitro-crm}"
DOMAIN="${DOMAIN:-crm.yitroglobal.com}"

echo "⚙️  Setting up Yitro CRM production environment..."
echo "   App Path: $APP_PATH"
echo "   Domain: $DOMAIN"
echo ""

cd "$APP_PATH"

# =================================================================
# 1. Generate Secure Secrets
# =================================================================
echo "🔐 Generating secure secrets..."

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64)
    echo "   ✅ Generated JWT secret (64 bytes)"
fi

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "   ✅ Generated session secret (32 bytes)"

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "   ✅ Generated encryption key (32 bytes hex)"

# =================================================================
# 2. Collect Configuration
# =================================================================
echo ""
echo "📝 Configuring environment variables..."

# Prompt for missing environment variables if running interactively
if [ -t 0 ]; then
    echo "🔧 Interactive configuration mode"
    
    # SMTP Configuration
    if [ -z "$SMTP_USER" ]; then
        echo ""
        echo "📧 SMTP Configuration:"
        echo "   AWS SES is recommended for production"
        echo "   You can also use Gmail, SendGrid, or other providers"
        echo ""
        read -p "SMTP Username (AWS SES SMTP username): " SMTP_USER
    fi
    
    if [ -z "$SMTP_PASS" ]; then
        read -s -p "SMTP Password (AWS SES SMTP password): " SMTP_PASS
        echo ""
    fi
    
    if [ -z "$FROM_EMAIL" ]; then
        read -p "From Email Address [$FROM_EMAIL]: " FROM_EMAIL_INPUT
        FROM_EMAIL="${FROM_EMAIL_INPUT:-noreply@$DOMAIN}"
    fi
    
    # AWS Configuration
    if [ -z "$AWS_REGION" ]; then
        read -p "AWS Region [us-east-1]: " AWS_REGION_INPUT
        AWS_REGION="${AWS_REGION_INPUT:-us-east-1}"
    fi
else
    echo "🤖 Non-interactive mode - using defaults and environment variables"
fi

# Set defaults for missing values
SMTP_USER="${SMTP_USER:-your-ses-smtp-username}"
SMTP_PASS="${SMTP_PASS:-your-ses-smtp-password}"
FROM_EMAIL="${FROM_EMAIL:-noreply@$DOMAIN}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_SES_HOST="${AWS_SES_HOST:-email-smtp.$AWS_REGION.amazonaws.com}"

# =================================================================
# 3. Create Environment Files
# =================================================================
echo ""
echo "📄 Creating environment configuration files..."

# Create production environment file
cat > .env.production << EOL
# ================================================
# Yitro CRM Production Environment Configuration
# Generated on: $(date)
# ================================================

# Application Settings
NODE_ENV=production
PORT=3000
DOMAIN=https://$DOMAIN

# Database Configuration
DATABASE_URL=file:$APP_PATH/data/production.db

# Security Configuration
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# CORS and Security
CORS_ORIGIN=https://$DOMAIN
CORS_CREDENTIALS=true

# SMTP Configuration
SMTP_SERVICE=ses
SMTP_HOST=$AWS_SES_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
FROM_EMAIL=$FROM_EMAIL

# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_SES_HOST=$AWS_SES_HOST

# Application Features
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5

# Session Configuration
SESSION_MAX_AGE=86400000
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/yitro-crm/app.log

# Health Check
HEALTH_CHECK_ENDPOINT=/health
HEALTH_CHECK_TOKEN=health-$(openssl rand -hex 16)
EOL

# Copy to main .env file
cp .env.production .env

# Create environment template for future reference
cat > .env.template << EOL
# ================================================
# Yitro CRM Environment Template
# Copy this file to .env and fill in your values
# ================================================

# Application Settings
NODE_ENV=production
PORT=3000
DOMAIN=https://your-domain.com

# Database Configuration  
DATABASE_URL=file:/path/to/your/data/production.db

# Security Configuration (GENERATE NEW VALUES!)
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# SMTP Configuration (AWS SES recommended)
SMTP_SERVICE=ses
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
FROM_EMAIL=noreply@your-domain.com

# AWS Configuration
AWS_REGION=us-east-1
AWS_SES_HOST=email-smtp.us-east-1.amazonaws.com
EOL

echo "   ✅ Created .env.production"
echo "   ✅ Created .env (production copy)"
echo "   ✅ Created .env.template (for reference)"

# =================================================================
# 4. Secure Files
# =================================================================
echo ""
echo "🔒 Setting secure file permissions..."
chmod 600 .env .env.production
chmod 644 .env.template
echo "   ✅ Set restrictive permissions on environment files"

# =================================================================
# 5. Validate Configuration
# =================================================================
echo ""
echo "🧪 Validating configuration..."

# Check required variables
REQUIRED_VARS="NODE_ENV PORT DATABASE_URL JWT_SECRET DOMAIN"
MISSING_VARS=""

for var in $REQUIRED_VARS; do
    if ! grep -q "^$var=" .env; then
        MISSING_VARS="$MISSING_VARS $var"
    fi
done

if [ -n "$MISSING_VARS" ]; then
    echo "   ❌ Missing required variables:$MISSING_VARS"
    exit 1
else
    echo "   ✅ All required variables present"
fi

# Test database path
DB_PATH=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2 | sed 's/file://')
DB_DIR=$(dirname "$DB_PATH")

if [ ! -d "$DB_DIR" ]; then
    echo "   ⚠️  Database directory doesn't exist, creating: $DB_DIR"
    mkdir -p "$DB_DIR"
    chmod 755 "$DB_DIR"
fi

echo "   ✅ Database path validated"

# =================================================================
# 6. Environment Summary
# =================================================================
echo ""
echo "📊 Environment Configuration Summary:"
echo "   • Environment: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo "   • Port: $(grep PORT .env | cut -d'=' -f2)"
echo "   • Domain: $(grep DOMAIN .env | cut -d'=' -f2)"
echo "   • Database: $(grep DATABASE_URL .env | cut -d'=' -f2)"
echo "   • SMTP Host: $(grep SMTP_HOST .env | cut -d'=' -f2)"
echo "   • AWS Region: $(grep AWS_REGION .env | cut -d'=' -f2)"
echo ""

# =================================================================
# 7. Security Recommendations
# =================================================================
echo "🛡️  Security Recommendations:"
echo ""
echo "   1. 🔐 AWS SES Setup:"
echo "      • Go to AWS SES Console: https://console.aws.amazon.com/ses/"
echo "      • Verify your domain: $DOMAIN"
echo "      • Create SMTP credentials"
echo "      • Update SMTP_USER and SMTP_PASS in .env"
echo ""
echo "   2. 🌐 Domain Configuration:"
echo "      • Point $DOMAIN to this server's IP"
echo "      • Ensure DNS propagation is complete"
echo "      • SSL certificate will be auto-configured"
echo ""
echo "   3. 🔒 Security Best Practices:"
echo "      • Never commit .env files to version control"
echo "      • Regularly rotate JWT and session secrets"
echo "      • Monitor application logs for security events"
echo "      • Keep system and packages updated"
echo ""

echo "✅ Environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Update SMTP credentials in .env file"
echo "   2. Run database initialization: ./init-production-db.sh"
echo "   3. Deploy application: ./deploy-aws.sh"
echo "   4. Test the application: curl https://$DOMAIN/health"
echo ""

# Display current configuration (without secrets)
echo "🔍 Current configuration preview:"
grep -E "^(NODE_ENV|PORT|DOMAIN|DATABASE_URL|SMTP_HOST|AWS_REGION)=" .env | sed 's/=/ = /'