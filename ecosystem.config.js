/**
 * PM2 Ecosystem Configuration
 *
 * Process manager configuration for production deployment on Hostinger VPS.
 * PM2 provides automatic restarts, load balancing, and process monitoring.
 *
 * Installation:
 *   npm install -g pm2
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 logs talkivo
 *   pm2 status
 *
 * Setup auto-restart on server reboot:
 *   pm2 startup
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      // Application name
      name: 'talkivo',

      // Script to run (for Next.js built app)
      script: 'npm',
      args: 'start',

      // Number of instances (1 for single VPS, 'max' for all CPU cores)
      instances: 1,

      // Execution mode ('cluster' for load balancing, 'fork' for single process)
      exec_mode: 'fork',

      // Auto-restart application on crash
      autorestart: true,

      // Don't watch for file changes in production
      watch: false,

      // Maximum memory before restart (prevents memory leaks)
      max_memory_restart: '1G',

      // Environment variables for production
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Error log file path
      error_file: './logs/pm2-error.log',

      // Output log file path
      out_file: './logs/pm2-out.log',

      // Log date format
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Merge logs from all instances
      merge_logs: true,

      // Number of times to restart app if it crashes in a short time
      max_restarts: 10,

      // Minimum uptime before considering the app stable (in ms)
      min_uptime: '10s',

      // Time to wait before restarting after crash (in ms)
      restart_delay: 4000,

      // Listen for restart signal from app
      listen_timeout: 3000,

      // Time to wait for app to gracefully shutdown (in ms)
      kill_timeout: 5000,

      // Note: wait_ready removed -- Next.js does not call process.send('ready'),
      // so PM2 would wait indefinitely. App readiness relies on min_uptime instead.
    },
  ],
};
