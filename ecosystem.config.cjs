module.exports = {
  apps: [
    {
      name: 'dealhub-crm',
      script: 'start.js',
      instances: 1, // or 'max' for cluster mode
      exec_mode: 'fork', // or 'cluster'
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DOMAIN: 'https://dealhub.yitrobc.net'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DOMAIN: 'https://dealhub.yitrobc.net'
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment-specific settings
      node_args: '--max-old-space-size=1024'
    }
  ]
};
