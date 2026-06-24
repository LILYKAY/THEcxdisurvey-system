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
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null
then
    echo "Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm (if not already installed)
if ! command -v pnpm &> /dev/null
then
    echo "pnpm not found. Installing pnpm..."
    curl -fsSL https://get.pnpm.io/ | sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# Install PM2
if ! command -v pm2 &> /dev/null
then
    echo "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
fi

# --- Clone Application ---
echo "Cloning application from Git repository..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
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
# Create or update .env file with production variables
cat <<EOF > .env
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
EOF

# --- Run Database Migrations ---
echo "Running database migrations..."
pnpm drizzle-kit push:pg

# --- Configure PM2 ---
echo "Configuring PM2..."
pm2 stop survey-system || true
pm2 delete survey-system || true
pm2 start "pnpm start" --name "survey-system"
pm2 save
pm2 startup systemd -u $USER --hp $HOME

# --- Configure Nginx ---
echo "Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default

sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null <<'NGINX_EOF'
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

sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# --- Configure Certbot for SSL ---
echo "Configuring Certbot for SSL..."
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx --non-interactive --agree-tos -m ${SSL_EMAIL} -d ${DOMAIN} -d www.${DOMAIN}

# --- Setup Cron for SSL Auto-Renewal ---
echo "Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "Deployment complete!"
echo "Your application is now running at https://${DOMAIN}"
echo ""
echo "Next steps:"
echo "1. Upload your CXDi logo to DigitalOcean Spaces"
echo "2. Update RESEND_API_KEY in .env with your actual Resend API key"
echo "3. Monitor the application with: pm2 logs survey-system"
