# CXDi SurveyPro - DigitalOcean Deployment Guide

This guide will help you deploy the survey platform to your DigitalOcean Droplet (165.227.116.42).

## Prerequisites

✅ **Already Configured:**
- DigitalOcean Droplet: `cxdi-surveys-app` (165.227.116.42)
- PostgreSQL Database: DigitalOcean Managed Database
- Domain: `thecxdisurveys.com` (DNS already pointing to Droplet)
- GitHub Repository: `https://github.com/LILYKAY/THEcxdisurvey-system`

## Deployment Steps

### Step 1: Access DigitalOcean Web Console

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click on your Droplet: **cxdi-surveys-app**
3. Click the **"Web Console"** button in the top-right corner
4. Wait for the console to load (you should see a terminal)

### Step 2: Become Root User

In the Web Console, type:
```bash
sudo su -
```

Press Enter. You should now be logged in as root.

### Step 3: Create the Deployment Script

Copy and paste this command into the Web Console:

```bash
cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration Variables ---
APP_DIR="/var/www/survey-system"
REPO_URL="https://github.com/LILYKAY/THEcxdisurvey-system.git"
DOMAIN="thecxdisurveys.com"

# DigitalOcean Managed PostgreSQL Connection Details
DB_USERNAME="doadmin"
DB_PASSWORD="AVNS_LcSSmGlgOXC-MTd066d"
DB_HOST="db-pgsql-nyc3-11782-do-user-39091696-0.j.db.ondigitalocean.com"
DB_PORT="25060"
DB_NAME="defaultdb"

# Construct DATABASE_URL
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# OpenAI API Key
OPENAI_API_KEY="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"

# DigitalOcean Spaces Credentials
DO_SPACES_ACCESS_KEY="86+amEVSy8jljDHsehh9RoO+rcGs2kQSkB1ao5EuHlM"
DO_SPACES_SECRET_KEY="yQcbWvxlBoEe6YghTBu2GXAs8AVPBo39i1s9ia6rFcQ"
DO_SPACES_BUCKET="survey-system"

# Email for SSL
SSL_EMAIL="thecxdi2@gmail.com"

# --- Update System and Install Dependencies ---
echo "Updating system and installing dependencies..."
apt update
apt upgrade -y
apt install -y curl git nginx build-essential

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install pnpm (if not already installed)
if ! command -v pnpm &> /dev/null
then
    echo "pnpm not found. Installing pnpm..."
    curl -fsSL https://get.pnpm.io/ | sh -
    export PNPM_HOME="/root/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# Install PM2
if ! command -v pm2 &> /dev/null
then
    echo "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# --- Clone Application ---
echo "Cloning application from Git repository..."
mkdir -p $APP_DIR
cd $APP_DIR

# Check if .git directory exists, if so, pull latest, otherwise clone
if [ -d ".git" ]; then
    echo "Git repository already exists. Pulling latest changes..."
    git pull
else
    echo "Cloning new Git repository..."
    git clone $REPO_URL .
fi

# --- Install Dependencies and Build Application ---
echo "Installing application dependencies..."
pnpm install

echo "Building application..."
pnpm run build

# --- Configure Environment Variables ---
echo "Configuring environment variables..."
cat <<ENVEOF > .env
NODE_ENV=production
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="$(openssl rand -base64 32)"
OPENAI_API_KEY="${OPENAI_API_KEY}"
DO_SPACES_ACCESS_KEY="${DO_SPACES_ACCESS_KEY}"
DO_SPACES_SECRET_KEY="${DO_SPACES_SECRET_KEY}"
DO_SPACES_BUCKET="${DO_SPACES_BUCKET}"
RESEND_API_KEY="your_resend_api_key"
VITE_APP_TITLE="CXDi SurveyPro"
VITE_APP_LOGO="https://${DO_SPACES_BUCKET}.nyc3.digitaloceanspaces.com/cxdi-logo.jpg"
ENVEOF

# --- Run Database Migrations ---
echo "Running database migrations..."
cd $APP_DIR
pnpm drizzle-kit push:pg

# --- Configure PM2 ---
echo "Configuring PM2..."
pm2 stop survey-system || true
pm2 delete survey-system || true
pm2 start "pnpm start" --name "survey-system" --cwd $APP_DIR
pm2 save
pm2 startup systemd -u root --hp /root

# --- Configure Nginx ---
echo "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/${DOMAIN} <<'NGINX_EOF'
server {
    listen 80;
    server_name thecxdisurveys.com www.thecxdisurveys.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# --- Configure Certbot for SSL ---
echo "Configuring Certbot for SSL..."
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot || true
certbot --nginx --non-interactive --agree-tos -m ${SSL_EMAIL} -d ${DOMAIN} -d www.${DOMAIN}

# --- Setup Cron for SSL Auto-Renewal ---
echo "Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo "Your application is now running at:"
echo "  https://${DOMAIN}"
echo ""
echo "Next steps:"
echo "1. Monitor the application: pm2 logs survey-system"
echo "2. Upload your CXDi logo to DigitalOcean Spaces"
echo "3. Update RESEND_API_KEY in .env with your actual Resend API key"
echo "4. Restart the app: pm2 restart survey-system"
echo ""
EOF
```

Press Enter to create the script.

### Step 4: Make the Script Executable

```bash
chmod +x /tmp/deploy.sh
```

### Step 5: Run the Deployment Script

```bash
/tmp/deploy.sh
```

This will take 10-15 minutes to complete. The script will:
- Update system packages
- Install Node.js, pnpm, PM2, Nginx, and Certbot
- Clone your GitHub repository
- Install dependencies and build the application
- Configure PostgreSQL connection
- Set up PM2 process management
- Configure Nginx reverse proxy
- Obtain and configure SSL certificates

### Step 6: Monitor the Deployment

While the script is running, you can monitor progress in the Web Console. Once it completes, you should see:

```
==========================================
Deployment complete!
==========================================
Your application is now running at:
  https://thecxdisurveys.com
```

### Step 7: Verify the Deployment

Once the deployment is complete:

1. **Check if the app is running:**
   ```bash
   pm2 logs survey-system
   ```

2. **Visit your domain:**
   - Open https://thecxdisurveys.com in your browser
   - You should see the CXDi SurveyPro landing page

3. **Check SSL certificate:**
   - Your browser should show a green lock icon
   - SSL certificate should be valid

### Step 8: Post-Deployment Configuration

1. **Update Resend API Key:**
   ```bash
   nano /var/www/survey-system/.env
   ```
   - Find the line: `RESEND_API_KEY="your_resend_api_key"`
   - Replace with your actual Resend API key
   - Save and exit (Ctrl+X, Y, Enter)

2. **Restart the application:**
   ```bash
   pm2 restart survey-system
   ```

3. **Upload CXDi Logo to DigitalOcean Spaces:**
   - Go to your DigitalOcean dashboard
   - Navigate to Spaces → survey-system bucket
   - Upload your CXDi logo as `cxdi-logo.jpg`

## Troubleshooting

### Application won't start
```bash
pm2 logs survey-system
```
Check the logs for error messages.

### Database connection error
Verify the PostgreSQL connection string in `.env`:
```bash
cat /var/www/survey-system/.env | grep DATABASE_URL
```

### SSL certificate issues
Check Certbot status:
```bash
certbot status
```

### Nginx not proxying correctly
Test Nginx configuration:
```bash
nginx -t
```

## Support

For issues or questions, check:
- PM2 logs: `pm2 logs survey-system`
- Nginx error log: `tail -f /var/log/nginx/error.log`
- Application logs: `tail -f /var/www/survey-system/.manus-logs/devserver.log`

---

**Platform:** CXDi SurveyPro  
**Deployment Date:** 2026-06-24  
**Server:** DigitalOcean Droplet (165.227.116.42)  
**Domain:** thecxdisurveys.com
