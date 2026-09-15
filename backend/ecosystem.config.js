// PM2 process definition for the backend in production.
// Run from inside backend/: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'hqhb-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
