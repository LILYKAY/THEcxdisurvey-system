# Login Debugging Guide

## Problem Summary
Users are being logged out immediately after a successful-looking login attempt. No session cookies are being persisted in the browser.

## Root Cause Analysis

The issue is likely one of these:

1. **Cookie Not Being Set** - The server sets the cookie but the browser doesn't store it
2. **Cookie Not Being Sent** - The browser has the cookie but doesn't send it with requests
3. **Cookie Being Rejected** - The cookie settings (domain, secure, sameSite) don't match the request context
4. **Session Token Invalid** - The token is created but fails verification on the next request

## Step-by-Step Debugging

### Step 1: Check Server Logs for [LOGIN] Messages

SSH into your Droplet and run:

```bash
pm2 logs survey-system --lines 100
```

Look for these messages when you attempt to login:

```
[LOGIN] Starting login for email: test@example.com
[LOGIN] User lookup: Found user 1 with openId local_abc123
[LOGIN] Password valid: true
[LOGIN] Token created for openId: local_abc123 name: Test User
[LOGIN] Cookie options: { domain: 'thecxdisurveys.com', secure: true, sameSite: 'strict' }
[LOGIN] Cookie set with maxAge: 31536000 COOKIE_NAME: __session
```

**If you see all these messages:**
- ✅ Server-side login is working
- ❌ Problem is with cookie handling or context verification

**If you don't see these messages:**
- ❌ Login mutation is not being called
- ❌ Login is failing before these logs
- Check for error messages in the logs

### Step 2: Check Browser DevTools for Cookie

1. Open your browser's DevTools (F12)
2. Go to **Application** tab → **Cookies**
3. Look for the `__session` cookie
4. Check:
   - **Name**: `__session`
   - **Value**: Should be a long JWT-like string (not empty)
   - **Domain**: Should match your domain (e.g., `thecxdisurveys.com`)
   - **Path**: Should be `/`
   - **Secure**: Should be ✓ (checked)
   - **SameSite**: Should be `Strict`

**If the cookie exists and looks correct:**
- ✅ Cookie is being set by the server
- ❌ Problem is with cookie being sent or verified

**If the cookie is missing or empty:**
- ❌ Server is not setting the cookie
- Check Nginx configuration (see Step 3)

### Step 3: Check Nginx Configuration

SSH into your Droplet and verify Nginx is configured correctly:

```bash
# Test Nginx configuration
sudo nginx -t

# View the configuration
sudo cat /etc/nginx/sites-enabled/survey-system

# Check Nginx status
sudo systemctl status nginx
```

Look for these important settings in the Nginx config:

```nginx
# Should NOT have:
proxy_cookie_path / "/";
proxy_cookie_domain ~ "^(.*)$" "$host";

# Should have:
proxy_cookie_path / "/";
proxy_cookie_domain off;

# Should pass cookies through:
proxy_pass_header Set-Cookie;
```

**If proxy_cookie_domain is set to a regex or specific domain:**
- ❌ Nginx might be rewriting the cookie domain
- Update Nginx config to use `proxy_cookie_domain off;`
- Run: `sudo systemctl reload nginx`

### Step 4: Check Cookie Being Sent in Requests

1. Open DevTools → **Network** tab
2. Attempt to login
3. Look at the requests to `/api/trpc/auth.login`
4. Click on the request and check **Request Headers**
5. Look for: `Cookie: __session=...`

**If you see the cookie in the request:**
- ✅ Browser is sending the cookie
- ❌ Problem is with server-side session verification

**If you don't see the cookie:**
- ❌ Browser is not sending the cookie
- Check cookie domain/path settings (Step 2)
- Check Nginx proxy settings (Step 3)

### Step 5: Check Session Verification in Context

The issue might be in `server/_core/context.ts` where the session is verified.

Check the logs for any errors after the cookie is set:

```bash
pm2 logs survey-system --grep "context\|session\|verify" --lines 100
```

Look for errors like:
- `Failed to verify session token`
- `Session token expired`
- `Invalid token format`

### Step 6: Check Cookie Security Settings

Open `server/_core/cookies.ts` and verify:

```typescript
const cookieOptions = {
  httpOnly: true,        // ✓ Should be true (prevents JS access)
  secure: true,          // ✓ Should be true (HTTPS only)
  sameSite: 'strict',    // ✓ Should be 'strict'
  domain: 'thecxdisurveys.com', // ✓ Should match your domain
  path: '/',             // ✓ Should be '/'
};
```

**If any setting is wrong:**
- Update `cookies.ts`
- Rebuild: `pnpm run build`
- Restart: `pm2 restart survey-system`

## Common Issues & Solutions

### Issue 1: Cookie Domain Mismatch

**Symptom**: Cookie exists but isn't sent with requests

**Solution**:
1. Check if you're accessing via `thecxdisurveys.com` vs `www.thecxdisurveys.com`
2. Cookies set for `thecxdisurveys.com` work for both domains
3. Update Nginx to ensure consistent domain handling

### Issue 2: Secure Flag on HTTP

**Symptom**: Cookie is not set when accessing via HTTP

**Solution**:
1. Always use HTTPS in production
2. Verify SSL certificate is valid: `sudo certbot certificates`
3. Update Nginx to redirect HTTP to HTTPS

### Issue 3: SameSite=Strict Too Restrictive

**Symptom**: Cookie is set but not sent in cross-site requests

**Solution**:
1. This is expected behavior for security
2. Verify frontend and backend are on the same domain
3. If they're on different domains, change to `sameSite: 'lax'`

### Issue 4: Nginx Not Passing Cookies

**Symptom**: Cookie is set in Nginx but not reaching the browser

**Solution**:
1. Check Nginx proxy settings
2. Ensure `proxy_pass_header Set-Cookie;` is set
3. Ensure `proxy_cookie_domain off;` is set
4. Reload Nginx: `sudo systemctl reload nginx`

## Testing Checklist

- [ ] Run `pm2 logs survey-system` and attempt login
- [ ] See all [LOGIN] trace messages in the logs
- [ ] Check DevTools → Cookies for `__session` cookie
- [ ] Cookie has correct domain, path, secure, sameSite settings
- [ ] Check DevTools → Network → see `Cookie: __session=...` in request headers
- [ ] After login, check that `trpc.auth.me.useQuery()` returns the user object
- [ ] Verify you're not redirected back to login page

## If Still Stuck

1. **Capture full logs**:
   ```bash
   pm2 logs survey-system --lines 500 > /tmp/survey-logs.txt
   ```

2. **Check browser console for errors**:
   - Open DevTools → Console tab
   - Look for any error messages or failed requests

3. **Test with curl**:
   ```bash
   # Test login endpoint directly
   curl -v -X POST https://thecxdisurveys.com/api/trpc/auth.login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   
   # Check for Set-Cookie header in response
   ```

4. **Check environment variables**:
   ```bash
   pm2 env survey-system | grep -E "COOKIE|JWT|SESSION"
   ```

## Next Steps

1. Run the deployment script: `bash DEPLOY_AND_DEBUG.sh`
2. Follow the debugging checklist above
3. Share the logs and findings
4. We'll identify and fix the root cause

---

**Last Updated**: 2026-06-24
**Version**: 1.0
