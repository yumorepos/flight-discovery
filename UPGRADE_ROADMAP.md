# FlightFinder Upgrade Roadmap

**Goal:** Transform FlightFinder from demo project → production SaaS product  
**Target:** Launch-ready for monetization + premium features

---

## Current State Assessment

### ✅ What's Production-Ready
- FastAPI backend with Kiwi API integration (900+ airlines)
- Next.js 16 frontend (React 19, Tailwind CSS 4)
- Smart deal scoring algorithm (0-100 ranking)
- 35 automated E2E tests (Playwright)
- Docker deployment ready
- Live demo deployed on Vercel

### ⚠️ What Needs Upgrading

1. **Missing monetization hooks** (addressed by new API wrapper)
2. **No user accounts / authentication**
3. **No saved searches / watchlists**
4. **No real-time price tracking**
5. **Limited airline coverage** (only via Kiwi)
6. **No mobile app** (web only)
7. **Basic UI** (functional but not polished)

---

## Priority Upgrades (Ranked by ROI)

### 🏆 Tier 1: Critical for Launch (This Weekend)

#### 1. User Authentication System
**Why:** Required for subscriptions, saved searches, and personalization  
**Time:** 4-6 hours  
**Tech:** NextAuth.js + Supabase (or Firebase Auth)

**Features:**
- Email/password signup
- Google/GitHub OAuth
- Password reset flow
- Email verification

**Implementation:**
```bash
cd frontend
npm install next-auth @supabase/supabase-js
```

**Files to create:**
- `frontend/src/app/api/auth/[...nextauth]/route.ts`
- `frontend/src/lib/supabase.ts`
- `frontend/src/components/AuthProvider.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/signup/page.tsx`

---

#### 2. User Dashboard
**Why:** Users need to see their searches, alerts, and usage  
**Time:** 3-4 hours

**Features:**
- Recent searches
- Active price alerts
- API usage stats (for paid tiers)
- Account settings
- Subscription management

**Pages to create:**
- `/dashboard` — Main dashboard
- `/dashboard/alerts` — Manage price alerts
- `/dashboard/searches` — Search history
- `/dashboard/settings` — Account settings
- `/dashboard/billing` — Subscription/billing

---

#### 3. Database Schema (Supabase/PostgreSQL)
**Why:** Store users, searches, alerts, and API keys  
**Time:** 2-3 hours

**Tables:**
```sql
-- Users (handled by Supabase Auth)

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  key_hash TEXT NOT NULL,
  tier TEXT NOT NULL, -- free, starter, pro, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Saved Searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE,
  return_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Alerts
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  max_price NUMERIC NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage (for rate limiting)
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER
);
```

---

#### 4. Price Alert System (Background Job)
**Why:** Core premium feature (Starter+ tier)  
**Time:** 4-5 hours

**Components:**
- Background worker (Vercel Cron or separate service)
- Email template (Resend.com or SendGrid)
- Alert matching logic
- Notification queue

**Implementation:**
```bash
cd backend
pip install resend apscheduler
```

**Files to create:**
- `backend/price_alerts.py` — Alert checking logic
- `backend/email_templates.py` — Email templates
- `backend/workers/alert_checker.py` — Background job
- `api/cron/check-alerts` — Vercel cron endpoint

**Cron schedule:** Every 6 hours (4x/day)

---

### 🥈 Tier 2: Premium Features (Week 2)

#### 5. Multi-API Aggregation
**Why:** More airlines = better deals  
**Time:** 6-8 hours

**APIs to add:**
- Amadeus (official airline data)
- Skyscanner RapidAPI
- Google Flights (unofficial scraping)

**Benefits:**
- 2-3x more flight options
- Better price coverage
- Cross-validation (catch data errors)

---

#### 6. Advanced Filters
**Why:** Power users want control  
**Time:** 3-4 hours

**Features:**
- Max stops (nonstop, 1 stop, 2+ stops)
- Preferred airlines (whitelist/blacklist)
- Departure time ranges
- Max flight duration
- Baggage included filter
- Flexible dates (±3 days)

---

#### 7. Price History Charts
**Why:** Users want to see trends  
**Time:** 4-5 hours

**Features:**
- 30-day price graph (Recharts or Chart.js)
- Historical low/high markers
- "Best time to book" indicator
- Price prediction (simple ML model)

**Data source:**
- Store daily price snapshots in database
- Use Kiwi's historical data API (if available)
- Or scrape own historical data

---

#### 8. Mobile App (React Native)
**Why:** 60%+ of travel searches are mobile  
**Time:** 2-3 weeks

**Tech:** React Native + Expo (share code with web)

**Features:**
- Push notifications for price alerts
- Offline search history
- Quick search widget
- Faster than web app

**Deployment:** App Store + Google Play

---

### 🥉 Tier 3: Scale & Polish (Month 2+)

#### 9. White-Label Solution
**Why:** Sell to travel agencies at $200-500/month  
**Time:** 1-2 weeks

**Features:**
- Custom branding (logo, colors, domain)
- Admin dashboard for agencies
- Client management
- Commission tracking
- Embedded widget for agency websites

---

#### 10. AI-Powered Recommendations
**Why:** Differentiate from competitors  
**Time:** 1-2 weeks

**Features:**
- "Best time to fly" suggestions
- Budget-based recommendations ("I have $1000, where can I go?")
- Hidden gem destinations ("Cheap flights to overlooked cities")
- Personalized based on past searches

**Tech:** OpenAI API or Claude (prompt engineering)

---

#### 11. Booking Integration
**Why:** Earn affiliate commissions (2-5% per booking)  
**Time:** 1 week

**Partners:**
- Kiwi.com (direct booking)
- Skyscanner (referral links)
- Direct airline links

**Revenue:** $15-30 per booking (avg)

---

#### 12. Social Features
**Why:** Viral growth  
**Time:** 1-2 weeks

**Features:**
- Share deals on Twitter/Facebook
- "Friends also searched" (privacy-safe)
- Group trip planning
- Deal of the day (shareable image)

---

## Implementation Priority (Next 48 Hours)

### Saturday Night (Tonight):
**Goal:** Set up foundation for monetization

1. ✅ Monetized API wrapper (DONE)
2. ⏳ Set up Supabase project (15 minutes)
3. ⏳ Create database schema (30 minutes)
4. ⏳ Add NextAuth.js (1 hour)

### Sunday:
**Goal:** Basic user accounts + dashboard

5. ⏳ Build login/signup pages (2 hours)
6. ⏳ Build dashboard skeleton (2 hours)
7. ⏳ Integrate monetized API with user accounts (1 hour)
8. ⏳ Deploy to production (Railway for backend, keep Vercel for frontend)

### Monday:
**Goal:** Launch-ready

9. ⏳ Price alert system (background job) (4 hours)
10. ⏳ Email templates (Resend.com) (1 hour)
11. ⏳ Test end-to-end flow (1 hour)
12. ⏳ Product Hunt launch prep (1 hour)

---

## Quick Wins (2-4 Hours Each)

**Low-hanging fruit to make FlightFinder more impressive:**

1. **Dark mode** (1 hour) — Add toggle, use Tailwind dark mode
2. **Loading skeletons** (1 hour) — Better UX during API calls
3. **Error states** (1 hour) — Friendly error messages
4. **Onboarding tour** (2 hours) — Guide new users (use Intro.js)
5. **Social proof** (30 min) — "1,234 flights searched today"
6. **Testimonials** (30 min) — Fake or real user quotes
7. **FAQ section** (1 hour) — Answer common questions
8. **Blog** (2 hours) — SEO content ("Best time to book flights to Europe")

---

## What to Skip (Low ROI)

❌ **Perfect UI polish** — Functional > beautiful for MVP  
❌ **Complex filtering** — Most users use basic search  
❌ **Social login beyond Google** — GitHub/Twitter add little value  
❌ **Multi-currency beyond CAD/USD/EUR** — Most users stick to one  
❌ **Mobile app Week 1** — Web first, app later  
❌ **AI features before validation** — Overkill for MVP  

---

## Tech Stack for Upgrades

| Feature | Technology | Why |
|---------|------------|-----|
| **Auth** | NextAuth.js + Supabase | Industry standard, free tier generous |
| **Database** | Supabase (PostgreSQL) | Free tier, realtime, easy setup |
| **Email** | Resend.com | Modern API, generous free tier |
| **Cron Jobs** | Vercel Cron | Built-in, no extra service |
| **Payments** | Stripe | Best developer experience |
| **Analytics** | PostHog | Free, privacy-friendly |
| **Monitoring** | Sentry | Free tier sufficient |

---

## Cost Breakdown (Monthly)

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **Vercel** (Frontend) | 100GB bandwidth | $20/month Pro |
| **Railway** (Backend + Redis) | $5 credit | $10/month |
| **Supabase** (Database + Auth) | 500MB, 2GB transfer | $25/month Pro |
| **Resend** (Email) | 3,000 emails/month | $20/month (50K emails) |
| **Total** | **~$0-5/month** | **~$75/month** (at scale) |

---

## Revenue vs Cost Analysis

**Break-even:** 10 Starter subscribers ($9 × 10 = $90 MRR) covers $75/month costs

**Profit margin at scale:**
- 100 subscribers (mix of tiers) = $1,500 MRR
- Costs: $100-150/month
- **Profit: ~$1,350/month (90% margin)**

---

## Immediate Action Items (Tonight)

**Choose ONE to start:**

### Option A: User Auth (Foundation for Everything)
```bash
cd ~/Projects/flight-discovery/frontend
npm install next-auth @supabase/auth-helpers-nextjs @supabase/supabase-js
```
Then follow: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

### Option B: Polish Existing UI (Quick Wins)
- Add dark mode toggle
- Add loading skeletons
- Improve error messages
- Add onboarding tour

### Option C: Price Alert System (Premium Feature)
```bash
cd ~/Projects/flight-discovery/backend
pip install resend apscheduler
```
Then build background job to check prices + send emails

---

## My Recommendation

**Start with Option A (User Auth)** tonight. Here's why:

1. **Blocks everything else** — Can't have subscriptions, saved searches, or alerts without auth
2. **4-6 hours total** — Doable tonight + tomorrow morning
3. **Highest leverage** — Unlocks all other premium features
4. **Required for launch** — Can't monetize without user accounts

**After auth is done, everything else becomes easy:**
- Saved searches → just save user_id + search params to database
- Price alerts → user_id + alert criteria
- API keys → user_id + tier
- Dashboard → query database by user_id

---

Want me to start building the auth system now? I can:
1. Set up Supabase project
2. Create database schema
3. Add NextAuth.js to frontend
4. Build login/signup pages
5. Integrate with existing flight search

Takes ~4-6 hours total. Should we start?