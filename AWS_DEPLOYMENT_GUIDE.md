# AWS Linux Deployment Guide for Yitro CRM

This guide provides complete instructions for deploying Yitro CRM on AWS Linux (Amazon Linux 2023) or any RHEL-based Linux distribution.

## Prerequisites

- AWS EC2 instance running Amazon Linux 2023 or similar RHEL-based distribution
- Domain name pointing to your server's IP address
- SSH access to your server
- Basic knowledge of Linux command line

### Minimum Server Requirements

- **Instance Type**: t3.micro or larger (t3.small recommended for production)
- **Memory**: 1GB RAM minimum (2GB recommended)
- **Storage**: 20GB minimum (40GB recommended)
- **Network**: Security groups configured for HTTP (80), HTTPS (443), and SSH (22)

## Quick Deployment (Automated)

For a complete automated deployment, run these commands on your AWS Linux server:

```bash
# 1. Download and run server setup
wget https://raw.githubusercontent.com/Tendool/Yitro_CRM_server/main/aws-deploy.sh
chmod +x aws-deploy.sh
sudo ./aws-deploy.sh

# 2. Deploy the application
wget https://raw.githubusercontent.com/Tendool/Yitro_CRM_server/main/deploy-aws.sh
chmod +x deploy-aws.sh
./deploy-aws.sh
```

## Step-by-Step Manual Deployment

### Step 1: Server Preparation

#### 1.1 Update System Packages
```bash
sudo dnf update -y
sudo dnf install -y git curl wget unzip nginx
```

#### 1.2 Install Node.js 18.x
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

#### 1.3 Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

#### 1.4 Install SSL Tools
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

### Step 2: Application Setup

#### 2.1 Clone Repository
```bash
cd /home/ec2-user
git clone https://github.com/Tendool/Yitro_CRM_server.git yitro-crm
cd yitro-crm
```

#### 2.2 Install Dependencies and Build
```bash
npm install
npm run build
```

#### 2.3 Setup Environment
```bash
chmod +x setup-aws-env.sh
./setup-aws-env.sh
```

Follow the interactive prompts to configure:
- SMTP settings (AWS SES recommended)
- Domain configuration
- Security settings

### Step 3: Database Initialization

```bash
chmod +x init-production-db.sh
./init-production-db.sh
```

### Step 4: Nginx Configuration

The AWS deployment script automatically configures Nginx with:
- HTTP to HTTPS redirect
- Static file serving for the React frontend
- Reverse proxy for API requests
- Security headers and gzip compression
- Rate limiting for API endpoints

### Step 5: SSL Certificate Setup

```bash
# Replace with your actual domain
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

### Step 6: Start Application with PM2

```bash
pm2 start ecosystem.config.aws.cjs --env production
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### Step 7: Enable Services

```bash
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## AWS-Specific Configuration

### Security Groups

Configure your EC2 security group to allow:

| Type  | Protocol | Port Range | Source    | Description      |
|-------|----------|------------|-----------|------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access       |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | HTTP traffic     |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | HTTPS traffic    |

### Elastic IP (Recommended)

Associate an Elastic IP with your instance to prevent IP changes on restarts.

### Route 53 DNS

Configure your domain in Route 53 or your DNS provider:
- Create an A record pointing your domain to your server's IP
- Add a CNAME for www subdomain if needed

### AWS SES Configuration

For production email functionality:

1. **Set up AWS SES**:
   ```bash
   # Go to AWS SES Console
   # https://console.aws.amazon.com/ses/
   ```

2. **Verify your domain**:
   - Add your domain to SES
   - Add required DNS records
   - Verify domain ownership

3. **Create SMTP credentials**:
   - Generate SMTP username and password
   - Update `.env` file with credentials

4. **Move out of sandbox** (for sending to any email):
   - Request production access in SES console

### Environment Variables for AWS

Your `.env.production` file should include:

```env
# Application
NODE_ENV=production
PORT=3000
DOMAIN=https://your-domain.com

# Database
DATABASE_URL=file:/home/ec2-user/yitro-crm/data/production.db

# Security
JWT_SECRET=your-generated-jwt-secret
SESSION_SECRET=your-generated-session-secret

# AWS SES Configuration
SMTP_SERVICE=ses
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
FROM_EMAIL=noreply@your-domain.com

# AWS Configuration
AWS_REGION=us-east-1
AWS_SES_HOST=email-smtp.us-east-1.amazonaws.com
```

## Monitoring and Maintenance

### Application Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs yitro-crm

# Monitor resources
pm2 monit

# Restart application
pm2 restart yitro-crm
```

### System Monitoring

```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo journalctl -u nginx -f

# Check system resources
htop
df -h
free -h
```

### Health Checks

The application includes a health check endpoint:

```bash
# Local health check
curl http://localhost:3000/health

# External health check
curl https://your-domain.com/health
```

### Automated Monitoring Script

Run the monitoring script to get a comprehensive status overview:

```bash
./monitor.sh
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
sqlite3 /home/ec2-user/yitro-crm/data/production.db .dump > backup-$(date +%Y%m%d).sql

# Restore backup
sqlite3 /home/ec2-user/yitro-crm/data/production.db < backup-20231201.sql
```

### Application Backup

```bash
# Create full application backup
tar -czf yitro-crm-backup-$(date +%Y%m%d).tar.gz /home/ec2-user/yitro-crm
```

### Automated Backups

Add to crontab for automated daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/bin/sqlite3 /home/ec2-user/yitro-crm/data/production.db .dump > /home/ec2-user/backups/crm-backup-$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs yitro-crm

# Check application files
ls -la /home/ec2-user/yitro-crm/dist/

# Verify environment variables
grep -E "^(NODE_ENV|PORT|DATABASE_URL)" /home/ec2-user/yitro-crm/.env
```

#### 2. Database Connection Issues
```bash
# Check database file permissions
ls -la /home/ec2-user/yitro-crm/data/

# Test database connection
cd /home/ec2-user/yitro-crm
npx prisma db pull
```

#### 3. Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo journalctl -u nginx -f

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew --nginx

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -I https://your-domain.com
```

#### 5. Email Not Working
```bash
# Check SES configuration
grep SMTP /home/ec2-user/yitro-crm/.env

# Test email functionality
cd /home/ec2-user/yitro-crm
npm run test-email
```

### Performance Optimization

#### 1. PM2 Clustering
For higher traffic, enable clustering:

```javascript
// In ecosystem.config.aws.cjs
module.exports = {
  apps: [{
    name: 'yitro-crm',
    script: './start.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster'
  }]
};
```

#### 2. Nginx Caching
Add to Nginx configuration for better performance:

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

#### 3. Database Optimization
For better SQLite performance:

```bash
# Optimize database
sqlite3 /home/ec2-user/yitro-crm/data/production.db "VACUUM;"
sqlite3 /home/ec2-user/yitro-crm/data/production.db "ANALYZE;"
```

## Security Best Practices

### 1. Server Security
- Keep system packages updated: `sudo dnf update -y`
- Configure firewall properly
- Use SSH keys instead of passwords
- Regular security updates

### 2. Application Security
- Rotate JWT and session secrets regularly
- Monitor application logs for suspicious activity
- Keep Node.js and npm packages updated
- Use HTTPS exclusively

### 3. Database Security
- Regular backups
- Proper file permissions
- Monitor database access

## Updates and Deployment

### Updating the Application

```bash
cd /home/ec2-user/yitro-crm

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild application
npm run build

# Restart with PM2
pm2 restart yitro-crm
```

### Zero-Downtime Deployment

```bash
# Use PM2 reload for zero-downtime
pm2 reload yitro-crm
```

## Support

For additional support:
- Check application logs: `pm2 logs yitro-crm`
- Review system logs: `sudo journalctl -f`
- Monitor system resources: `htop`
- Run health checks: `./monitor.sh`

---

**Note**: Replace `your-domain.com` with your actual domain name throughout this guide.