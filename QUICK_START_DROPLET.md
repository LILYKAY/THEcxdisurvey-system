# Quick Start Guide — Deploy to DigitalOcean Droplet

## Prerequisites

- DigitalOcean Droplet with Ubuntu 22.04+ running
- SSH access to the Droplet
- Node.js 20+ installed
- PM2 installed globally
- Nginx configured as reverse proxy
- PostgreSQL database set up (or connection string ready)
- SSL certificate configured (Certbot)
- GitHub repository cloned at `/home/ubuntu/survey-system`

## Quick Deployment (5 minutes)

### 1. SSH into your Droplet

```bash
ssh root@your-droplet-ip
```

### 2. Navigate to the project directory

```bash
cd /home/ubuntu/survey-system
```

### 3. Run the deployment script

```bash
bash DEPLOY_AND_DEBUG.sh
```

This script will:
- ✅ Pull latest code from GitHub
- ✅ Install dependencies
- ✅ Build the application
- ✅ Restart PM2
- ✅ Show recent logs
- ✅ Display testing instructions

### 4. Test the login

Follow the instructions printed by the script:
1. Open browser: `https://thecxdisurveys.com`
2. Go to login page
3. Enter test credentials
4. Watch the logs for `[LOGIN]` messages

## Monitoring Logs

In a separate terminal, watch logs in real-time:

```bash
pm2 logs survey-system --lines 100
```

Look for these `[LOGIN]` trace messages:
```
[LOGIN] Starting login for email: test@example.com
[LOGIN] User lookup: Found user 1 with openId local_abc123
[LOGIN] Password valid: true
[LOGIN] Token created for openId: local_abc123 name: Test User
[LOGIN] Cookie options: { domain: 'thecxdisurveys.com', secure: true, sameSite: 'strict' }
[LOGIN] Cookie set with maxAge: 31536000 COOKIE_NAME: __session
```

## Debugging Commands

### Check PM2 Status

```bash
pm2 status survey-system
pm2 info survey-system
```

### View Logs

```bash
# Last 100 lines
pm2 logs survey-system --lines 100

# Follow in real-time
pm2 logs survey-system

# Search for specific messages
pm2 logs survey-system --grep "ERROR\|LOGIN"
```

### Restart Application

```bash
pm2 restart survey-system
```

### Check Nginx

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Check Database Connection

```bash
# Test PostgreSQL connection
psql "postgresql://user:password@host:5432/database"

# Or check environment variable
pm2 env survey-system | grep DATABASE_URL
```

## Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs survey-system --lines 200

# Check if port 3000 is in use
sudo lsof -i :3000

# Check Node.js version
node --version
```

### Nginx not proxying correctly

```bash
# Check Nginx configuration
sudo cat /etc/nginx/sites-enabled/survey-system

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Database connection failed

```bash
# Check DATABASE_URL environment variable
pm2 env survey-system | grep DATABASE_URL

# Test connection manually
psql "your-connection-string"
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL configuration
sudo grep -A 5 "ssl_certificate" /etc/nginx/sites-enabled/survey-system
```

## Environment Variables

The application needs these environment variables (set in PM2 ecosystem file):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session
JWT_SECRET=your-secret-key

# OAuth (if using Manus OAuth)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# LLM (OpenAI)
OPENAI_API_KEY=sk-...

# Storage (DigitalOcean Spaces)
DO_SPACES_KEY=your-key
DO_SPACES_SECRET=your-secret
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=your-bucket

# Application
NODE_ENV=production
VITE_APP_TITLE=CXDi SurveyPro
```

## Common Tasks

### Update code

```bash
cd /home/ubuntu/survey-system
git pull origin main
bash DEPLOY_AND_DEBUG.sh
```

### View application logs

```bash
pm2 logs survey-system --lines 500
```

### Restart application

```bash
pm2 restart survey-system
```

### Check application health

```bash
curl https://thecxdisurveys.com/api/trpc/auth.me
```

### Database backup

```bash
pg_dump "your-connection-string" > /tmp/backup-$(date +%Y%m%d).sql
```

## Support

For detailed debugging, see: `LOGIN_DEBUG_GUIDE.md`

For deployment details, see: `DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2026-06-24
**Version**: 1.0
