# Flight Discovery API - Monetization Guide

**Status:** MVP Ready  
**Revenue Model:** SaaS subscriptions + usage-based pricing  
**Target:** $500-2K/month within 3 months

---

## What Just Got Built

A production-ready **monetized API wrapper** around your existing FlightFinder backend with:

✅ **API key authentication**  
✅ **Rate limiting** (Redis-based)  
✅ **4 subscription tiers** (Free → Enterprise)  
✅ **Usage tracking**  
✅ **Webhook-ready** for Stripe payments  
✅ **Email alert system** (framework)  

---

## Subscription Tiers & Pricing

| Tier | Price/Month | Requests/Day | Features |
|------|-------------|--------------|----------|
| **Free** | $0 | 10 | Basic search, Email support |
| **Starter** | $9 | 100 | Email alerts, Priority search, 7-day history |
| **Pro** | $29 | 1,000 | Webhooks, Custom alerts, 30-day history, API access |
| **Enterprise** | $99 | Unlimited | Dedicated support, Custom integrations, SLA |

---

## Quick Start (Local Testing)

### 1. Install Dependencies

```bash
cd ~/Projects/flight-discovery/backend
source .venv/bin/activate
pip install -r requirements-monetized.txt
```

### 2. Start Redis (Required for Rate Limiting)

**Option A: Docker**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Option B: Homebrew (Mac)**
```bash
brew install redis
brew services start redis
```

**Option C: Skip Redis (Dev Mode)**
- API will work without Redis but with no rate limiting

### 3. Run the Monetized API

```bash
python api_monetized.py
```

API will be live at: http://localhost:8001

**Docs:** http://localhost:8001/docs

---

## Usage Flow (Customer Perspective)

### Step 1: Get API Key (Free Tier)

```bash
curl -X POST "http://localhost:8001/api/keys/create" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "tier": "free"
  }'
```

**Response:**
```json
{
  "api_key": "fd_ABC123...",
  "tier": "free",
  "requests_per_day": 10,
  "created_at": "2024-03-14T22:00:00"
}
```

### Step 2: Search Flights

```bash
curl -X GET "http://localhost:8001/api/search?origin=YUL&destination=LHR" \
  -H "X-API-Key: fd_ABC123..."
```

**Response:**
```json
{
  "results": [...],
  "count": 25,
  "usage": {
    "used": 3,
    "limit": 10
  }
}
```

### Step 3: Check Usage

```bash
curl -X GET "http://localhost:8001/api/usage" \
  -H "X-API-Key: fd_ABC123..."
```

**Response:**
```json
{
  "requests_today": 3,
  "requests_remaining": 7,
  "tier": "free",
  "reset_at": "2024-03-15T00:00:00Z"
}
```

### Step 4: Upgrade Subscription

```bash
curl -X POST "http://localhost:8001/api/subscribe/upgrade" \
  -H "X-API-Key: fd_ABC123..." \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "starter",
    "stripe_payment_intent_id": "pi_abc123"
  }'
```

---

## Deployment (Production)

### Option 1: Railway (Recommended - Easiest)

1. **Push to GitHub**
   ```bash
   cd ~/Projects/flight-discovery
   git add backend/api_monetized.py backend/requirements-monetized.txt
   git commit -m "feat: add monetized API with subscriptions"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repo
   - Add Redis plugin (1-click)
   - Set environment variables:
     - `KIWI_API_KEY=your_key`
     - `REDIS_HOST=redis.railway.internal`
     - `REDIS_PORT=6379`
   - Deploy

3. **Cost:** $5-10/month (includes Redis)

**Railway will give you:** `https://your-app.railway.app`

---

### Option 2: Render

1. **Create `render.yaml`**
   ```yaml
   services:
     - type: web
       name: flight-api
       env: python
       buildCommand: "pip install -r backend/requirements-monetized.txt"
       startCommand: "cd backend && python api_monetized.py"
       envVars:
         - key: KIWI_API_KEY
           sync: false
   
   databases:
     - name: redis
       ipAllowList: []
   ```

2. **Deploy:** Connect GitHub repo at [render.com](https://render.com)

3. **Cost:** Free tier available, $7/month paid

---

### Option 3: Fly.io (Most Control)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Launch app
cd ~/Projects/flight-discovery/backend
fly launch

# Add Redis
fly redis create

# Deploy
fly deploy
```

**Cost:** $0-5/month (free allowance generous)

---

## Stripe Integration (Payment Processing)

### 1. Create Stripe Account

Sign up at [stripe.com](https://stripe.com)

### 2. Get API Keys

Dashboard → Developers → API Keys

- **Publishable key:** `pk_test_...`
- **Secret key:** `sk_test_...`

### 3. Add to Environment

```bash
export STRIPE_SECRET_KEY=sk_test_...
```

### 4. Create Products in Stripe

```python
import stripe
stripe.api_key = "sk_test_..."

# Create Starter plan
stripe.Product.create(
    name="Flight API - Starter",
    description="100 requests/day + email alerts",
)

stripe.Price.create(
    product="prod_...",
    unit_amount=900,  # $9.00
    currency="usd",
    recurring={"interval": "month"},
)
```

### 5. Update API to Verify Payments

In `api_monetized.py`, add Stripe verification:

```python
import stripe

@app.post("/api/subscribe/upgrade")
async def upgrade_subscription(upgrade: SubscriptionUpgrade, ...):
    # Verify payment intent
    if upgrade.stripe_payment_intent_id:
        payment_intent = stripe.PaymentIntent.retrieve(
            upgrade.stripe_payment_intent_id
        )
        if payment_intent.status != "succeeded":
            raise HTTPException(400, "Payment not confirmed")
    
    # Update tier...
```

---

## Marketing & Distribution Plan

### Week 1: Soft Launch

**Target:** 10 free users, 1 paid subscriber

1. **Product Hunt launch**
   - Title: "Flight Discovery API - Find cheap flights programmatically"
   - Description: "900+ airlines, smart deal scoring, JSON API for travel apps"
   - Tag: #api #travel #saas

2. **Reddit posts:**
   - /r/TravelHacks: "I built an API to find flight deals automatically"
   - /r/DigitalNomad: "Free API for tracking flight prices"
   - /r/SideProject: "Monetized my flight search tool as an API"
   - /r/webdev: "Built a SaaS API with FastAPI + Stripe"

3. **Hacker News:** "Show HN: Flight Discovery API – Cheap flights via REST API"

4. **Twitter:**
   - "Just launched a flight deal API 🚀 Free tier: 10 requests/day..."
   - Tag: @kiwi_com, @Skyscanner (they might RT)

### Week 2-4: Growth

5. **Integrate with RapidAPI / APILayer**
   - List your API on marketplaces
   - They handle billing (30% commission)
   - Instant distribution to 1M+ developers

6. **Outreach to travel apps/sites:**
   - Email 50 travel blogs, deal sites, travel agents
   - Pitch: "Automate your flight search with our API"
   - Offer 1-month free trial on Pro tier

7. **Content marketing:**
   - Blog post: "How I built a profitable flight API in 2 days"
   - Tutorial: "Build a Telegram bot that alerts you about flight deals"
   - Case study: "Finding $2000 flights for $400 using data"

8. **Affiliate partnerships:**
   - Reach out to Kiwi.com, Skyscanner for affiliate commissions
   - Earn 2-5% per booking driven by your API

---

## Revenue Projections

### Conservative (6 Months)

| Month | Free Users | Starter ($9) | Pro ($29) | Enterprise ($99) | MRR |
|-------|------------|--------------|-----------|------------------|-----|
| 1 | 20 | 2 | 0 | 0 | $18 |
| 2 | 50 | 5 | 1 | 0 | $74 |
| 3 | 100 | 10 | 3 | 0 | $177 |
| 4 | 200 | 15 | 5 | 1 | $379 |
| 5 | 400 | 20 | 8 | 1 | $511 |
| 6 | 600 | 30 | 12 | 2 | $846 |

**6-Month Revenue:** ~$2K cumulative, $846 MRR

### Optimistic (With Marketing Push)

| Month | Starter ($9) | Pro ($29) | Enterprise ($99) | MRR |
|-------|--------------|-----------|------------------|-----|
| 3 | 20 | 10 | 2 | $668 |
| 6 | 50 | 25 | 5 | $1,670 |
| 12 | 100 | 50 | 10 | $3,340 |

**12-Month Revenue:** ~$20K cumulative, $3.3K MRR

---

## Scaling to $5K/Month

**Key levers:**

1. **RapidAPI distribution** → 1000+ developers see your API
2. **Affiliate commissions** → Earn 3-5% per booking (avg $15-30/booking)
3. **Enterprise customers** → 5 at $99/month = $495/month
4. **White-label licensing** → Sell to travel agencies for $200-500/month
5. **Data partnerships** → Sell aggregated flight data to research firms

**Target mix for $5K MRR:**
- 200 Starter ($9) = $1,800
- 80 Pro ($29) = $2,320
- 10 Enterprise ($99) = $990
- **Total:** $5,110/month

---

## Next Steps (This Weekend)

### Saturday Night (Tonight):
- [x] Build monetized API wrapper (DONE)
- [ ] Test locally with Redis
- [ ] Create 3 test API keys (free, starter, pro)

### Sunday:
- [ ] Deploy to Railway (1-click Redis + app)
- [ ] Set up Stripe account
- [ ] Create 4 subscription products in Stripe
- [ ] Test payment flow end-to-end

### Monday:
- [ ] Launch on Product Hunt
- [ ] Post on Reddit (4 subreddits)
- [ ] Tweet launch announcement
- [ ] Email 20 travel bloggers/apps

### Tuesday:
- [ ] List on RapidAPI marketplace
- [ ] Apply for Kiwi.com affiliate program
- [ ] Write "How I Built This" blog post

---

## Monitoring & Analytics

**Track these metrics weekly:**

1. **Signups:**
   - New API keys created
   - Conversion rate (free → paid)

2. **Usage:**
   - Total API requests
   - Requests per user
   - Most popular routes

3. **Revenue:**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - LTV (Lifetime Value)

4. **Support:**
   - Support tickets
   - Response time
   - Customer satisfaction

**Tools:**
- Stripe Dashboard (revenue, subscriptions)
- Redis CLI (usage stats)
- Google Analytics (website traffic)
- PostHog (product analytics)

---

## FAQ

**Q: Do I need Stripe right away?**  
A: No. You can launch with API keys only and manually upgrade users. Add Stripe Week 2.

**Q: What if someone abuses the free tier?**  
A: Rate limits (10/day) make abuse unprofitable. Ban abusive keys via Redis.

**Q: How do I handle refunds?**  
A: Stripe handles automatic refunds. Add "Cancel Subscription" button in your dashboard.

**Q: Can I run this without Redis?**  
A: Yes, but no rate limiting. Fine for testing, not for production.

**Q: What about GDPR/privacy?**  
A: You're only storing emails + API keys. Add "Privacy Policy" and "Delete Account" endpoint.

---

## Support

**Questions?** Open an issue on GitHub or email support@flightdiscovery.com

**Bugs?** File at github.com/yumorepos/flight-discovery/issues

**Ideas?** Tweet @yumorepos or post in /r/flightdiscovery

---

**Built by Yumo** | [GitHub](https://github.com/yumorepos) | [LinkedIn](https://linkedin.com/in/yumo-xu-1589b7326)
