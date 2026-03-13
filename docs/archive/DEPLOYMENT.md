# Deployment Guide — Flight Discovery Platform

## Architecture

```
┌─────────────────┐      ┌──────────────────┐
│  Vercel         │─────▶│  Railway         │
│  (Frontend)     │ API  │  (Backend)       │
│  Next.js        │      │  FastAPI + Redis │
└─────────────────┘      └──────────────────┘
```

---

## Backend Deployment (Railway)

**Service:** Railway (free tier: $5/month credit, 500 hours)

### 1. Create Railway Account
- Sign up: https://railway.app
- Connect GitHub

### 2. Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select `yumorepos/flight-discovery`
3. Select root path: `/backend`
4. Railway auto-detects Python

### 3. Configure Environment Variables
Add in Railway dashboard → Variables:

```bash
AMADEUS_API_KEY=your_key_here
AMADEUS_API_SECRET=your_secret_here
REDIS_URL=redis://default:password@redis.railway.internal:6379
ALLOWED_ORIGINS=https://flight-discovery.vercel.app
```

### 4. Add Redis Service
1. Railway dashboard → "New" → "Database" → "Redis"
2. Link to backend service
3. Railway auto-injects `REDIS_URL`

### 5. Deploy
- Railway auto-deploys on push to main
- Public URL: `https://flight-discovery-api.up.railway.app`

---

## Frontend Deployment (Vercel)

**Service:** Vercel (free tier: unlimited bandwidth, 100 GB-hours)

### 1. Create Vercel Account
- Sign up: https://vercel.com
- Connect GitHub

### 2. Import Project
1. Dashboard → "Add New" → "Project"
2. Import `yumorepos/flight-discovery`
3. Root directory: `frontend`
4. Framework: Next.js (auto-detected)

### 3. Configure Environment Variables
Add in Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://flight-discovery-api.up.railway.app
```

### 4. Build Settings
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`

### 5. Deploy
- Vercel auto-deploys on push to main
- Production URL: `https://flight-discovery.vercel.app`

---

## DNS & Custom Domain (Optional)

### Vercel (Frontend)
1. Vercel dashboard → Settings → Domains
2. Add custom domain (e.g., `flights.yourdomain.com`)
3. Update DNS records as instructed

### Railway (Backend)
1. Railway dashboard → Settings → Domains
2. Generate domain: `api.flights.yourdomain.com`
3. Add CNAME record in DNS

---

## Environment Variables Summary

### Backend (.env)
```bash
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
REDIS_URL=redis://localhost:6379  # Local dev
# Railway injects this in production
ALLOWED_ORIGINS=http://localhost:3000,https://flight-discovery.vercel.app
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # Local dev
# Set to Railway URL in Vercel dashboard for production
```

---

## Post-Deployment Checklist

### Backend (Railway)
- [ ] Service running (check logs)
- [ ] Redis connected (check `/health` endpoint)
- [ ] CORS configured (test from Vercel URL)
- [ ] Amadeus API working (check `/api/search` response)
- [ ] Rate limiting active

### Frontend (Vercel)
- [ ] Build successful (check deployment logs)
- [ ] API calls working (test search)
- [ ] Environment variables loaded
- [ ] Static assets serving correctly

### Integration
- [ ] Search returns real flight data
- [ ] Value scoring displays correctly
- [ ] No CORS errors in browser console
- [ ] Performance acceptable (<2s response time)

---

## Monitoring

### Railway
- Dashboard → Metrics (CPU, memory, requests)
- Logs → Real-time API logs
- Set up alerts for high error rates

### Vercel
- Analytics → Page views, performance
- Logs → Build logs, function logs
- Lighthouse scores (check Core Web Vitals)

---

## Troubleshooting

### "Failed to fetch" error in frontend
**Cause:** CORS misconfigured or backend offline  
**Fix:** Check `ALLOWED_ORIGINS` in Railway, verify backend URL in Vercel env vars

### "Rate limit exceeded" on Amadeus
**Cause:** >2,000 calls/month (free tier)  
**Fix:** Enable Redis caching, reduce search frequency, upgrade Amadeus plan

### Build fails on Vercel
**Cause:** Missing dependencies or build errors  
**Fix:** Check build logs, verify `package.json`, test `npm run build` locally

### Redis connection error
**Cause:** Redis service not linked in Railway  
**Fix:** Railway dashboard → Link Redis database to backend service

---

## Cost Estimate (Free Tier)

| Service | Free Tier | Overage Cost |
|---------|-----------|--------------|
| **Vercel** | 100 GB-hours | $20/month (Pro) |
| **Railway** | $5 credit/month | $0.01/hour after credit |
| **Amadeus** | 2,000 calls/month | $0.01/call after limit |

**Expected monthly cost (low traffic):** $0  
**Expected monthly cost (moderate traffic):** $5-10 (if Amadeus limit exceeded)

---

## Scaling Strategy

**When traffic grows:**
1. Upgrade Amadeus to paid tier (10K calls/month for $30)
2. Enable aggressive Redis caching (24h TTL)
3. Add rate limiting on frontend (max 10 searches/user/hour)
4. Consider Railway Pro ($20/month) for dedicated instances

---

**Deployment Status:** Ready to deploy  
**Manual Steps Required:**
1. Railway: Create project + add env vars + link Redis
2. Vercel: Import repo + set `NEXT_PUBLIC_API_URL`
3. Test integration after deployment
