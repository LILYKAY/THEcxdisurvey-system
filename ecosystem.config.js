module.exports = {
  apps: [
    {
      name: 'survey-app',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
        // Database connection (MySQL format)
        // Format: mysql://username:password@host:port/database
        DATABASE_URL: 'mysql://doadmin:AVNS_nfHp3Gbh3n1_RtwlbvD@db-mysql-nyc3-16637-do-user-39091696-0.a.db.ondigitalocean.com:25060/defaultdb',
        
        // Session/JWT configuration
        JWT_SECRET: 'ymmP/DGEDsQIkEe1SIaVvj/qjL7phPFR/8OPTA1rxk0=',
        
        // Application configuration
        CANONICAL_URL: 'https://thecxdisurveys.com',
        
        // OAuth (optional - only needed if you want to use Manus OAuth)
        // Leave these empty for local email/password authentication only
        VITE_APP_ID: '',
        OAUTH_SERVER_URL: '',
        VITE_OAUTH_PORTAL_URL: '',
        OWNER_OPEN_ID: '',
        OWNER_NAME: '',
        
        // Forge API (optional - for LLM, storage, notifications)
        BUILT_IN_FORGE_API_URL: '',
        BUILT_IN_FORGE_API_KEY: '',
        VITE_FRONTEND_FORGE_API_URL: '',
        VITE_FRONTEND_FORGE_API_KEY: '',
        
        // Analytics (optional)
        VITE_ANALYTICS_ENDPOINT: '',
        VITE_ANALYTICS_WEBSITE_ID: '',
        
        // Email service (optional - for forgot password, notifications)
        RESEND_API_KEY: '',
        
        // App branding
        VITE_APP_TITLE: 'CXDi SurveyPro',
        VITE_APP_LOGO: '',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      ignore_watch: ['node_modules', 'logs', '.git'],
    },
  ],
};
