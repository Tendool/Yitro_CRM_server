module.exports = {
  apps: [
    {
      name: 'dealhub-crm',
      script: './start.js',
      cwd: '/root/Deploy-yitro',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:/root/Deploy-yitro/data/production.db',
        JWT_SECRET: 'XgkpTh2CVqEKKocfu1VoFZ14UQy3lirPUL/LgHDDw1o=',
        DOMAIN: 'https://dealhub.yitrobc.net'
      },
      max_restarts: 10,
      min_uptime: '10s',
      log_file: '/root/Deploy-yitro/logs/combined.log',
      out_file: '/root/Deploy-yitro/logs/out.log',
      error_file: '/root/Deploy-yitro/logs/error.log'
    }
  ]
};
