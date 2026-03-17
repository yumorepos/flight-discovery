# Vercel Deployment Fix

**Issue:** https://flight-discovery.vercel.app shows old UI  
**Cause:** Vercel not deploying latest main branch commits  
**Date:** 2026-03-16 20:36 EDT

---

## Problem Analysis

**Local main branch:**
- ✅ Has modern UI (spotlight cards, curated sections)
- ✅ Commit: 962f461 (latest)
- ✅ Frontend code: Modern homepage in `frontend/src/app/page.tsx`

**Vercel deployment:**
- ❌ Shows old UI
- ❌ Not deploying from latest main

---

## Solution Options

### Option 1: Trigger Manual Deployment (Fastest)

**Via Vercel CLI:**
```bash
cd ~/Projects/flight-discovery
vercel --prod
```

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Find "flight-discovery" project
3. Go to "Deployments" tab
4. Click "Redeploy" on latest commit
5. Select "Use existing Build Cache: No"
6. Click "Redeploy"

### Option 2: Check Deployment Branch Settings

**In Vercel Dashboard:**
1. Go to Project Settings
2. Click "Git" tab
3. Check "Production Branch"
4. **If not "main":** Change to "main"
5. Click "Save"
6. Trigger new deployment

### Option 3: Push New Commit (Forces Deploy)

```bash
cd ~/Projects/flight-discovery

# Make trivial change to force deploy
echo "# Deployment trigger" >> README.md
git add README.md
git commit -m "chore: trigger Vercel deployment"
git push origin main
```

---

## Verification

After deployment completes:

1. Visit https://flight-discovery.vercel.app
2. Should see:
   - Orange/amber gradient hero
   - Spotlight cards (Paris, Tokyo, Cancún)
   - "Curated discovery" section
   - Modern premium design

**If still old:** Check Vercel deployment logs for errors

---

## Most Likely Cause

**Hypothesis:** Vercel's automatic deployments might be:
- Disabled for main branch
- Configured for a different branch (e.g., "production")
- Failed silently due to build error

**Check:** Vercel Dashboard → Settings → Git → Auto-deploy

---

## Recommended Action

**Quickest fix:**
1. Go to Vercel Dashboard
2. Deployments → Find latest commit (962f461)
3. Click "Redeploy"
4. Wait 2-3 minutes
5. Verify at https://flight-discovery.vercel.app

**OR:**

```bash
cd ~/Projects/flight-discovery
vercel --prod
```

---

## Build Command (Should Be)

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs"
}
```

Currently in `vercel.json` ✅

---

**Next Step:** Trigger deployment via Vercel Dashboard or CLI
