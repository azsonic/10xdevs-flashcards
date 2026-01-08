# Cloudflare Pages Deployment Guide

This guide explains how to deploy the 10xdevs-flashcards application to Cloudflare Pages.

## Prerequisites

Before deploying, ensure you have:

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. A Cloudflare Pages project created
3. GitHub repository access with admin permissions
4. Required API keys (Supabase, OpenRouter)

## Initial Setup

### 1. Create Cloudflare Pages Project

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Choose **Connect to Git** or **Direct Upload**
5. Name your project (e.g., `10xdevs-flashcards`)
6. Note down your **Account ID** from the URL or account settings

### 2. Generate Cloudflare API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template or create a custom token with:
   - **Permissions:**
     - Account > Cloudflare Pages > Edit
   - **Account Resources:**
     - Include > Your Account
4. Click **Continue to summary** → **Create Token**
5. **Copy the token immediately** (you won't be able to see it again)

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token for deployment | Created in step 2 above |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Dashboard URL or Account Settings |
| `SUPABASE_URL` | Your Supabase project URL | Supabase Project Settings → API |
| `SUPABASE_KEY` | Supabase anonymous key | Supabase Project Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter API key | [OpenRouter Dashboard](https://openrouter.ai/keys) |

> **Note:** The project name is configured in `wrangler.toml` and does not need to be a secret.

### 4. Configure Environment Variables in Cloudflare

Environment variables need to be set in Cloudflare Pages for runtime access:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add the following variables for **Production**:

| Variable Name | Value |
|---------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anonymous key |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

4. Click **Save**

### 5. Configure Compatibility Flags (Critical - Do This First!)

**⚠️ IMPORTANT:** You must configure this BEFORE your first deployment or it will fail!

To ensure React 19 works correctly with Cloudflare Workers:

1. Go to your Cloudflare Pages project in the dashboard
2. Navigate to **Settings** → **Functions**
3. Scroll down to **Compatibility flags**
4. In the "Compatibility flag" input, type `nodejs_compat`
5. Click **Add flag** or press Enter
6. Click **Save changes**

> **Note:** This flag enables Node.js compatibility APIs like `MessageChannel` which are required by React 19. Without this flag, deployments will fail with "MessageChannel is not defined" error.

## Deployment Process

**⚠️ Prerequisites:** Before your first deployment, ensure you have completed steps 1-5 above, especially configuring the `nodejs_compat` compatibility flag in Cloudflare dashboard!

### Automatic Deployment

The application automatically deploys when you push to the `master` branch:

```bash
git add .
git commit -m "feat: your changes"
git push origin master
```

The GitHub Actions workflow will:
1. ✅ Run linting checks
2. ✅ Execute unit tests with coverage
3. ✅ Build the production bundle
4. ✅ Deploy to Cloudflare Pages

### Manual Deployment

To deploy manually using Wrangler CLI:

1. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy to Cloudflare Pages:
   ```bash
   wrangler pages deploy dist
   ```
   
   The project name will be read from `wrangler.toml`.

## Monitoring Deployments

### GitHub Actions

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select the **Deploy to Cloudflare Pages** workflow
4. View the latest run to see deployment status

### Cloudflare Dashboard

1. Go to your Cloudflare Pages project
2. View the **Deployments** tab
3. See deployment history, logs, and status

## Troubleshooting

### Build Fails

**Problem:** Build fails during GitHub Actions

**Solutions:**
- Check the Actions logs for specific error messages
- Ensure all dependencies are listed in `package.json`
- Verify Node.js version matches `.nvmrc` (22.14.0)
- Run `npm run build` locally to reproduce the issue

### Environment Variables Not Working

**Problem:** Application can't access environment variables

**Solutions:**
- Verify variables are set in Cloudflare Pages Settings → Environment variables
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding/changing environment variables
- Check that variables are set for the correct environment (Production/Preview)

### Deployment Succeeds but Site Doesn't Work

**Problem:** Deployment completes but the site shows errors

**Solutions:**
- Check Cloudflare Pages logs in the dashboard
- Verify Supabase credentials are correct
- Ensure database migrations have been run
- Check browser console for client-side errors

### MessageChannel is not defined Error

**Problem:** Deployment fails with "MessageChannel is not defined" error

**Solutions:**
- Ensure `nodejs_compat` compatibility flag is enabled
- Add flag in Cloudflare Pages Settings → Functions → Compatibility flags
- Verify deployment command includes `--compatibility-flags="nodejs_compat"`
- This is required for React 19 server-side rendering

### API Token Issues

**Problem:** Deployment fails with authentication errors

**Solutions:**
- Verify `CLOUDFLARE_API_TOKEN` is correct and not expired
- Ensure token has correct permissions (Cloudflare Pages Edit)
- Check token is for the correct account
- Regenerate token if necessary

## Rollback

To rollback to a previous deployment:

1. Go to Cloudflare Pages dashboard
2. Navigate to **Deployments**
3. Find the working deployment
4. Click **Rollback to this deployment**

## Custom Domain

To add a custom domain:

1. Go to your Cloudflare Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Follow the instructions to configure DNS

## Performance Optimization

Cloudflare Pages provides automatic optimizations:

- ✅ Global CDN with 200+ data centers
- ✅ Automatic HTTPS
- ✅ HTTP/3 support
- ✅ Brotli compression
- ✅ Automatic asset optimization

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues related to:
- **Cloudflare Pages:** [Cloudflare Community](https://community.cloudflare.com/)
- **This Application:** Open an issue on GitHub
- **Astro Framework:** [Astro Discord](https://astro.build/chat)

