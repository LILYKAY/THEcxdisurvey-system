#!/bin/bash

###############################################################################
# DEPLOY_AND_DEBUG.sh
# 
# This script deploys the latest code to your DigitalOcean Droplet and 
# monitors logs in real-time while you test the login flow.
#
# Usage:
#   1. SSH into your DigitalOcean Droplet
#   2. Run: bash /path/to/DEPLOY_AND_DEBUG.sh
#   3. Follow the prompts to test the login
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/survey-system"
APP_NAME="survey-system"
LOG_FILE="/home/ubuntu/.pm2/logs/${APP_NAME}-error.log"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Survey System - Deploy & Debug Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Pull latest code from GitHub
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
cd "$APP_DIR"
git pull origin main || {
    echo -e "${RED}Failed to pull from GitHub. Make sure you're connected to the internet.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
pnpm install --frozen-lockfile || {
    echo -e "${RED}Failed to install dependencies.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Build the application
echo -e "${YELLOW}Step 3: Building the application...${NC}"
pnpm run build || {
    echo -e "${RED}Failed to build application.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

# Step 4: Restart PM2 application
echo -e "${YELLOW}Step 4: Restarting PM2 application...${NC}"
pm2 restart "$APP_NAME" || {
    echo -e "${RED}Failed to restart PM2 application.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Application restarted${NC}"
sleep 3
echo ""

# Step 5: Check application status
echo -e "${YELLOW}Step 5: Checking application status...${NC}"
pm2 status "$APP_NAME"
echo ""

# Step 6: Show recent logs
echo -e "${YELLOW}Step 6: Recent application logs:${NC}"
pm2 logs "$APP_NAME" --lines 50 --nostream
echo ""

# Step 7: Instructions for testing
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Ready for Testing!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}The application has been deployed and restarted.${NC}"
echo ""
echo -e "${YELLOW}To test the login flow:${NC}"
echo "1. Open your browser and navigate to: https://thecxdisurveys.com"
echo "2. Click 'Sign In' or go to the login page"
echo "3. Use your test credentials:"
echo "   - Email: test@example.com"
echo "   - Password: (your test password)"
echo "4. Watch the logs below for [LOGIN] messages"
echo ""
echo -e "${YELLOW}In another terminal on the Droplet, run:${NC}"
echo "   pm2 logs survey-system --lines 100"
echo ""
echo -e "${YELLOW}Look for these [LOGIN] trace messages:${NC}"
echo "   [LOGIN] Starting login for email: test@example.com"
echo "   [LOGIN] User lookup: Found user X with openId local_XXXXX"
echo "   [LOGIN] Password valid: true"
echo "   [LOGIN] Token created for openId: local_XXXXX name: Test User"
echo "   [LOGIN] Cookie options: { domain: ..., secure: true, sameSite: strict }"
echo "   [LOGIN] Cookie set with maxAge: 31536000 COOKIE_NAME: __session"
echo ""
echo -e "${YELLOW}If you see these messages, the login is working on the server.${NC}"
echo -e "${YELLOW}If the browser still redirects to login, the issue is with cookie handling.${NC}"
echo ""
echo -e "${BLUE}Debugging checklist:${NC}"
echo "1. Check browser DevTools → Application → Cookies"
echo "   - Look for '__session' cookie"
echo "   - Verify it has a value (not empty)"
echo "   - Check Domain, Path, Secure, SameSite settings"
echo ""
echo "2. Check Nginx configuration:"
echo "   - sudo nginx -t"
echo "   - sudo systemctl status nginx"
echo ""
echo "3. Check if cookies are being sent in requests:"
echo "   - Open DevTools → Network tab"
echo "   - Look at request headers for 'Cookie: __session=...'"
echo ""
echo "4. Check if the storage proxy is working:"
echo "   - Look for 500 errors in the logs"
echo "   - Verify BUILT_IN_FORGE_API_KEY and BUILT_IN_FORGE_API_URL are set"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
