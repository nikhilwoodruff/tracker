# Deployment to GitHub Pages

This app can be deployed to GitHub Pages using GitHub Actions. Follow these steps:

## 1. Set up GitHub repository

First, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tracker.git
git push -u origin main
```

## 2. Configure GitHub secrets

Go to your repository's Settings → Secrets and variables → Actions, and add these secrets:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key  
- `ANTHROPIC_API_KEY`: Your Anthropic API key

## 3. Enable GitHub Pages

1. Go to Settings → Pages
2. Under "Source", select "GitHub Actions"

## 4. Deploy

The app will automatically deploy when you:
- Push to the main/master branch
- Manually trigger the workflow from Actions tab

## 5. Access your app

After deployment, your app will be available at:
```
https://YOUR_USERNAME.github.io/tracker
```

## Important notes

- The app is configured for static export, which means:
  - API routes run at build time only
  - Real-time features require client-side implementation
  - Authentication works via Supabase client SDK
  
- Make sure your Supabase project allows connections from github.io domains
- Update CORS settings in Supabase if needed

## Manual deployment

To build and test locally:

```bash
# Build static site
npm run build

# Test the static export
npx serve out
```

## Troubleshooting

If deployment fails:

1. Check GitHub Actions logs for errors
2. Verify all secrets are correctly set
3. Ensure Supabase project is configured for public access
4. Check that your repository name matches the basePath in next.config.ts