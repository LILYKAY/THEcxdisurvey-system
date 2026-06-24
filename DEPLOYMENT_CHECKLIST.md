# Deployment Checklist for DigitalOcean Droplet

## Droplet Information

- **Public IPv4**: 165.227.116.42
- **Private IP**: 10.108.0.3
- **Domain**: thecxdisurveys.com

## Pre-Deployment Checklist

Before running the deployment script, verify:

- [ ] SSH key is configured and you can connect to the Droplet
- [ ] Node.js 20+ is installed: `node --version`
- [ ] pnpm is installed: `pnpm --version`
- [ ] PM2 is installed globally: `pm2 --version`
- [ ] PostgreSQL database is set up and accessible
- [ ] Environment variables are configured in PM2 ecosystem file
- [ ] Nginx is configured and running: `sudo systemctl status nginx`
- [ ] SSL certificate is installed: `sudo certbot certificates`
- [ ] GitHub repository is cloned at `/home/ubuntu/survey-system`

## Quick SSH Connection

```bash
# Connect to your Droplet
ssh root@165.227.116.42

# Or if you have a different user
ssh ubuntu@165.227.116.42
```

## Deployment Steps

### Step 1: Connect to Droplet

```bash
ssh root@165.227.116.42
```

### Step 2: Navigate to Project Directory

```bash
cd /home/ubuntu/survey-system
```

### Step 3: Run Deployment Script

```bash
bash DEPLOY_AND_DEBUG.sh
```

The script will:
1. Pull latest code from GitHub
2. Install dependencies (pnpm install)
3. Build the application (pnpm run build)
4. Restart PM2 (pm2 restart survey-system)
5. Show recent logs
6. Display testing instructions

### Step 4: Monitor Logs in Real-Time

In a separate terminal:

```bash
ssh root@165.227.116.42
pm2 logs survey-system --lines 100
```

### Step 5: Test Login

1. Open browser: https://thecxdisurveys.com
2. Go to login page
3. Enter test credentials:
   - Email: test@example.com
   - Password: (your test password)
4. Watch logs for `[LOGIN]` messages

## Expected Log Output

When you attempt to login, you should see:

```
[LOGIN] Starting login for email: test@example.com
[LOGIN] User lookup: Found user 1 with openId local_abc123
[LOGIN] Password valid: true
[LOGIN] Token created for openId: local_abc123 name: Test User
[LOGIN] Cookie options: { domain: 'thecxdisurveys.com', secure: true, sameSite: 'strict' }
[LOGIN] Cookie set with maxAge: 31536000 COOKIE_NAME: __session
```

## Browser Testing Checklist

After seeing the server-side logs, check:

- [ ] Browser DevTools → Application → Cookies
  - [ ] `__session` cookie exists
  - [ ] Cookie has a value (not empty)
  - [ ] Domain is `thecxdisurveys.com`
  - [ ] Path is `/`
  - [ ] Secure is checked (✓)
  - [ ] SameSite is `Strict`

- [ ] Browser DevTools → Network tab
  - [ ] Look at requests to `/api/trpc/auth.login`
  - [ ] Check request headers for `Cookie: __session=...`
  - [ ] Check response headers for `Set-Cookie: __session=...`

- [ ] After login
  - [ ] User is NOT redirected back to login page
  - [ ] Dashboard loads successfully
  - [ ] User profile is visible in top-right corner

## Troubleshooting

### If deployment fails

```bash
# Check if there are TypeScript errors
cd /home/ubuntu/survey-system
pnpm tsc --noEmit

# Check if dependencies are installed
pnpm install --frozen-lockfile

# Try building manually
pnpm run build

# Check PM2 logs
pm2 logs survey-system --lines 200
```

### If login doesn't work

1. Check server logs for `[LOGIN]` messages
2. Check browser DevTools for cookie issues
3. Check Nginx configuration: `sudo nginx -t`
4. Check database connection: `pm2 env survey-system | grep DATABASE_URL`

### If you see 500 errors

1. Check full error in PM2 logs: `pm2 logs survey-system --lines 500`
2. Check if database is accessible
3. Check if environment variables are set correctly: `pm2 env survey-system`

## Post-Deployment Verification

After successful deployment:

- [ ] Application is running: `pm2 status survey-system`
- [ ] Nginx is proxying correctly: `sudo systemctl status nginx`
- [ ] SSL certificate is valid: `sudo certbot certificates`
- [ ] Database is accessible
- [ ] Login works and cookies are set
- [ ] Dashboard loads without errors
- [ ] Surveys can be created and viewed

## Rollback Plan

If something goes wrong:

```bash
# Restart the application
pm2 restart survey-system

# Or restart from a previous version
git log --oneline -10
git checkout <previous-commit-hash>
bash DEPLOY_AND_DEBUG.sh

# Or check PM2 process list
pm2 list
pm2 restart survey-system
```

## Next Steps After Successful Deployment

1. Test all core features (login, create survey, send survey, view responses)
2. Monitor logs for any errors
3. Set up automated backups for database
4. Set up monitoring and alerting
5. Create runbook for common maintenance tasks
6. Document any custom configurations

## Support

For detailed debugging: See `LOGIN_DEBUG_GUIDE.md`

For quick reference: See `QUICK_START_DROPLET.md`

---

**Last Updated**: 2026-06-24
**Version**: 1.0
