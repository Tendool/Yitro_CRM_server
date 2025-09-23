module.exports = {
  apps: [{
    name: 'yitro-crm',
    script: './start.js',
    cwd: '/home/ec2-user/yitro-crm',
    instances: 1,
    exec_mode: 'fork', // Use fork mode for better stability with SQLite
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'file:/home/ec2-user/yitro-crm/data/production.db',
      DOMAIN: 'https://crm.yitroglobal.com',
      JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION',
      
      // SMTP Configuration for AWS SES (recommended for production)
      SMTP_HOST: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
      SMTP_PORT: process.env.SMTP_PORT || 587,
      SMTP_USER: process.env.SMTP_USER || 'your-ses-smtp-username',
      SMTP_PASS: process.env.SMTP_PASS || 'your-ses-smtp-password',
      FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@crm.yitroglobal.com',
      SMTP_SERVICE: process.env.SMTP_SERVICE || 'ses',
      
      // AWS specific configurations
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_SES_HOST: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
    },
    
    // Logging configuration
    log_file: '/var/log/yitro-crm/combined.log',
    out_file: '/var/log/yitro-crm/out.log',
    error_file: '/var/log/yitro-crm/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true,
    
    // Process management
    watch: false, // Disable watch in production
    ignore_watch: ['node_modules', 'logs', 'data'],
    watch_delay: 1000,
    
    // Memory and performance
    max_memory_restart: '512M',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 4000,
    
    // Health monitoring
    health_check_http: {
      url: 'http://localhost:3000/health',
      interval: 30000,
      timeout: 5000,
      max_failures: 3
    },
    
    // Process behavior
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    
    // Auto restart on crash
    autorestart: true,
    
    // Source map support
    source_map_support: true,
    
    // Instance variables for load balancing (if scaling to multiple instances)
    instance_var: 'INSTANCE_ID',
    
    // Additional environment for development/staging
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000,
      DATABASE_URL: 'file:/home/ec2-user/yitro-crm/data/staging.db',
      DOMAIN: 'https://staging-crm.yitroglobal.com'
    },
    
    // Development environment
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'file:./dev.db',
      DOMAIN: 'http://localhost:3000'
    }
  }],
  
  // Deployment configuration for PM2 deploy
  deploy: {
    production: {
      user: 'ec2-user',
      host: ['YOUR_SERVER_IP'], // Replace with your server IP
      ref: 'origin/main',
      repo: 'https://github.com/Tendool/Yitro_CRM_server.git',
      path: '/home/ec2-user/yitro-crm',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.aws.cjs --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'ec2-user',
      host: ['YOUR_STAGING_SERVER_IP'], // Replace with staging server IP
      ref: 'origin/develop',
      repo: 'https://github.com/Tendool/Yitro_CRM_server.git',
      path: '/home/ec2-user/yitro-crm-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.aws.cjs --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};