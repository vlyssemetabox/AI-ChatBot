# Vercel Deployment Guide

## Prerequisites
✅ Vercel CLI installed
✅ Code committed and pushed to GitHub

## Step 1: Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account.

## Step 2: Deploy to Vercel
```bash
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) or Yes (if updating)
- **Project name?** → `ai-chatbot` (or your preferred name)
- **Directory?** → `.` (current directory)
- **Override settings?** → No

## Step 3: Configure Environment Variables

After deployment, you MUST add these environment variables in the Vercel dashboard:

### Required Environment Variables:
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

2. Add the following variables:

```
CEREBRAS_API_KEY=csk-2ryxw3hcen539vp88cdy6kwktkejvrk4md49dey853nw3k3w
JINA_API_KEY=jina_ddb676f05c6346caa00304d1c44942f32VLC6U0_QJ53UsVs6zjWcPMz94Vk
NEXT_PUBLIC_SUPABASE_URL=https://qkagsmttupzvrwqpwjxc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYWdzbXR0dXB6dnJ3cXB3anhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNzY0OTMsImV4cCI6MjA1Mzg1MjQ5M30.sb_publishable_1FLM1eXrSc_UIM1CLSFynw_XoIVf2yn6Ik-
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrYWdzbXR0dXB6dnJ3cXB3anhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg5NjQ5MywiZXhwIjoyMDg1NDcyNDkzfQ.U-XsIVlCF7bHqBOkCi3CIywpOg8UW9OAiuXUUQvv6Ik
```

> **Important**: Make sure to select **All Environments** (Production, Preview, Development) for each variable.

## Step 4: Redeploy After Adding Environment Variables
```bash
vercel --prod
```

## Step 5: Verify Deployment

1. Visit your deployment URL (shown in terminal)
2. Test document upload
3. Test RAG retrieval
4. Check browser console for any errors

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Ensure they're set for all environments
- Redeploy after adding variables

### Supabase Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies allow access

## Production Deployment
```bash
vercel --prod
```

This deploys to your production domain.

## Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

Vercel automatically deploys when you push to your GitHub repository:
- **Main branch** → Production
- **Other branches** → Preview deployments

To enable:
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Connect your GitHub repository
3. Configure branch settings
