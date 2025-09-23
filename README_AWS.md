# AWS Linux Deployment - Quick Start

This repository is now fully optimized for deployment on AWS Linux (Amazon Linux 2023) and other RHEL-based distributions.

## 🚀 Quick Deployment

### Option 1: One-Command Deployment
```bash
# Download and run complete setup
curl -fsSL https://raw.githubusercontent.com/Tendool/Yitro_CRM_server/main/aws-deploy.sh | sudo bash
```

### Option 2: Step-by-Step Deployment
```bash
# 1. Clone repository
git clone https://github.com/Tendool/Yitro_CRM_server.git yitro-crm
cd yitro-crm

# 2. Run server setup (installs dependencies, configures nginx, ssl)
sudo ./aws-deploy.sh

# 3. Setup environment variables
./setup-aws-env.sh

# 4. Initialize database
./init-production-db.sh

# 5. Deploy application
./deploy-aws.sh

# 6. Monitor status
./monitor-aws.sh
```

## 📋 What's Included

### AWS-Optimized Scripts
- `aws-deploy.sh` - Complete server environment setup
- `deploy-aws.sh` - Application deployment and PM2 configuration  
- `setup-aws-env.sh` - Environment variables and security setup
- `init-production-db.sh` - Database initialization
- `monitor-aws.sh` - System health monitoring
- `ecosystem.config.aws.cjs` - PM2 configuration for AWS

### Key Improvements for AWS Linux
- ✅ **Package Manager**: Uses `dnf` instead of `apt` (RHEL-based)
- ✅ **Nginx Configuration**: Optimized for AWS with security headers, rate limiting
- ✅ **SSL/TLS**: Automated Let's Encrypt certificate setup
- ✅ **PM2 Process Management**: Production-ready configuration with logging
- ✅ **AWS SES Integration**: Email service configuration
- ✅ **Security**: Firewall configuration, secure file permissions
- ✅ **Monitoring**: Comprehensive health checks and system monitoring
- ✅ **Performance**: Gzip compression, static file caching, optimized Nginx

## 🔧 Requirements

- AWS EC2 instance (t3.micro or larger)
- Amazon Linux 2023 or RHEL-based distribution
- Domain name pointing to server IP
- Security groups configured for ports 22, 80, 443

## 📊 Management Commands

```bash
# Application Management
npm run deploy:aws          # Deploy application
npm run setup:aws           # Setup server environment
npm run setup:aws-env       # Configure environment variables
npm run init:production-db   # Initialize database
npm run monitor              # System health check

# PM2 Process Management
pm2 status                   # View application status
pm2 logs yitro-crm          # View application logs
pm2 restart yitro-crm       # Restart application
pm2 monit                    # Resource monitoring

# System Management
sudo systemctl status nginx # Nginx status
sudo journalctl -u nginx -f # Nginx logs
```

## 🌐 Access Your Application

After successful deployment:
- **Application**: https://your-domain.com
- **Health Check**: https://your-domain.com/health
- **Admin Panel**: https://your-domain.com/admin

## 📖 Documentation

- [Complete AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Deployment Instructions](./DEPLOYMENT.md)

## 🆘 Troubleshooting

```bash
# Check system status
./monitor-aws.sh

# View application logs
pm2 logs yitro-crm

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Database issues
sqlite3 data/production.db ".tables"
```

## 🔒 Security Features

- Automated SSL certificate management
- Security headers and HSTS
- Rate limiting on API endpoints
- Firewall configuration
- Secure file permissions
- JWT and session security

---

**Ready for production deployment on AWS Linux! 🚀**