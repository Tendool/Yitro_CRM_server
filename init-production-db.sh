#!/bin/bash

# =================================================================
# Production Database Initialization Script for AWS Linux
# =================================================================

set -e

APP_PATH="${APP_PATH:-/home/ec2-user/yitro-crm}"
DATABASE_URL="${DATABASE_URL:-file:$APP_PATH/data/production.db}"

echo "🗄️  Initializing Yitro CRM production database..."
echo "   App Path: $APP_PATH"
echo "   Database URL: $DATABASE_URL"
echo ""

# Navigate to application directory
cd $APP_PATH

# Create data directory if it doesn't exist
echo "📁 Creating data directory..."
mkdir -p data
chmod 755 data

# Set environment variable
export DATABASE_URL="$DATABASE_URL"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database exists
if [ ! -f "data/production.db" ]; then
    echo "📊 Creating new production database..."
    
    # Run database migrations to create the database
    npx prisma migrate deploy || {
        echo "⚠️  Migration failed, trying db push..."
        npx prisma db push --accept-data-loss
    }
    
    echo "✅ Database created successfully"
else
    echo "📊 Updating existing production database..."
    
    # Run migrations on existing database
    npx prisma migrate deploy
    
    echo "✅ Database updated successfully"
fi

# Set proper permissions for SQLite database
echo "🔒 Setting database permissions..."
chmod 644 data/production.db
chown $USER:$USER data/production.db

# Verify database connection
echo "🧪 Testing database connection..."
if npx prisma db pull --preview-feature >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection test failed, but this may be expected"
fi

# Display database info
echo ""
echo "📊 Database Information:"
echo "   • Location: $APP_PATH/data/production.db"
echo "   • Size: $(du -h $APP_PATH/data/production.db 2>/dev/null | cut -f1 || echo 'N/A')"
echo "   • Permissions: $(ls -la $APP_PATH/data/production.db 2>/dev/null | cut -d' ' -f1 || echo 'N/A')"

# Check if we have tables
if sqlite3 "$APP_PATH/data/production.db" ".tables" 2>/dev/null | grep -q "User\|Account\|Contact"; then
    echo "   • Tables: ✅ Found application tables"
    
    # Count records in main tables
    echo "   • Records:"
    echo "     - Users: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM User;" 2>/dev/null || echo 'N/A')"
    echo "     - Accounts: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM Account;" 2>/dev/null || echo 'N/A')"
    echo "     - Contacts: $(sqlite3 "$APP_PATH/data/production.db" "SELECT COUNT(*) FROM Contact;" 2>/dev/null || echo 'N/A')"
else
    echo "   • Tables: ⚠️  Application tables not found - may need seeding"
fi

echo ""
echo "✅ Database initialization completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify application can connect: npm run start"
echo "   2. Check logs: pm2 logs yitro-crm"
echo "   3. Access application: https://your-domain.com"
echo ""
echo "🔧 Useful database commands:"
echo "   • Backup: sqlite3 data/production.db .dump > backup.sql"
echo "   • Restore: sqlite3 data/production.db < backup.sql"
echo "   • Browse: sqlite3 data/production.db"