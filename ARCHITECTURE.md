# Flight Discovery Platform - System Architecture

## Design Principles
- Value ranking over pure cost (safety + price)
- Sub-2s response time (aggressive caching)
- OTA trust scoring as competitive moat
- Minimal, inspiring UI (travel-focused animations)

## Tech Stack

### Frontend (Vercel)
- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Animations:** Framer Motion (lightweight)
- **Components:**
  - Search bar (origin IATA + optional month)
  - Destination cards (animated, image + price + safety badge)
  - Region grouping (Domestic/NA/EU/Asia/SA/AF/Oceania)

### Backend (Render/Railway)
- **Framework:** FastAPI (Python 3.11+)
- **Cache:** Redis (24h TTL for searches)
- **Queue:** Celery (for email alerts cron)
- **APIs:**
  - Skyscanner (primary flight data)
  - Kiwi Tequila (backup for travel hacks)
  - Resend (email alerts)

### Database (PostgreSQL)
```sql
-- flights
CREATE TABLE flights (
  id SERIAL PRIMARY KEY,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  destination_city VARCHAR(100),
  price DECIMAL(10,2),
  taxes DECIMAL(10,2),
  total_price DECIMAL(10,2),
  airline VARCHAR(50),
  depart_date DATE,
  return_date DATE,
  booking_link TEXT,
  link_safety_score INT, -- 0-100
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_origin_date ON flights(origin, depart_date);
CREATE INDEX idx_total_price ON flights(total_price);

-- subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  destination VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, destination)
);

-- users (future premium)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  subscription_plan VARCHAR(20), -- free/premium
  subscription_status VARCHAR(20), -- active/cancelled
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Core Modules

### 1. Flight Search Engine
**File:** `backend/app/services/flight_search.py`

**Flow:**
1. Receive request (origin, month)
2. Check Redis cache (key: `flights:{origin}:{month}`)
3. If miss → call Skyscanner API
4. Calculate value scores for each result
5. Group by region, sort by value
6. Cache for 24h
7. Return top 20 per region

**Value Score Formula:**
```python
value_score = (0.6 * price_score) + (0.3 * safety_score) + (0.1 * date_relevance)

# price_score: normalized inverse (cheaper = higher score)
# safety_score: 0-100 from OTA trust checker
# date_relevance: proximity to target month
```

### 2. OTA Safety Scorer
**File:** `backend/app/services/safety_scorer.py`

**Scoring Logic:**
```python
def calculate_safety_score(booking_link: str) -> int:
    score = 0
    domain = extract_domain(booking_link)
    
    # Official airline domains (+50)
    if domain in AIRLINE_WHITELIST:
        score += 50
    
    # Trusted OTAs (+30)
    elif domain in TRUSTED_OTA_LIST:
        score += 30
    
    # HTTPS (+20)
    if booking_link.startswith('https://'):
        score += 20
    
    # Domain age check (+10)
    if domain_age(domain) > 365:
        score += 10
    
    # Redirect chain check (+10)
    if redirect_count(booking_link) <= 1:
        score += 10
    
    # Known scam list (-100)
    if domain in SCAM_BLACKLIST:
        return 0
    
    return min(score, 100)
```

**Whitelists:**
- `AIRLINE_WHITELIST`: aa.com, united.com, aircanada.com, etc.
- `TRUSTED_OTA_LIST`: booking.com, expedia.com, kayak.com, momondo.com

### 3. Email Alert System
**File:** `backend/app/services/email_alerts.py`

**Cron Job (Daily 6 AM):**
1. Fetch all subscriptions from DB
2. For each subscription:
   - Query current price for destination
   - Compare with cached price from yesterday
   - If drop > 10% → send alert email
3. Update cached prices

**Email Template:**
```
Subject: 🔥 Price Drop Alert: YUL → Paris $423 (-15%)

Hey traveler!

Good news — the flight you're watching just dropped:

✈️ Montreal (YUL) → Paris (CDG)
💰 $423 CAD (was $498)
📅 March 15-22, 2026
🛫 Air Canada

Safety Rating: 🟢 Official Airline (100/100)

[Book Now →]

Not interested anymore? [Unsubscribe]
```

### 4. Caching Strategy
**Redis Keys:**
- `flights:{origin}:{month}` → TTL 24h
- `price_history:{origin}:{destination}` → TTL 7d (for alerts)

**Invalidation:**
- Manual flush endpoint (admin only)
- Auto-refresh if age > 20h

## API Endpoints

### Public
```
GET  /api/search?origin=YUL&month=2026-03
POST /api/subscribe
GET  /api/destinations/:code (destination details)
```

### Admin
```
POST /api/cache/flush
GET  /api/admin/stats (usage metrics)
```

## Performance Targets
- **Search response:** <2s (cached) / <5s (uncached)
- **Cache hit rate:** >80%
- **Email delivery:** <30s from trigger

## Security
- Rate limit: 10 req/min per IP
- Email validation (regex + DNS check)
- Honeypot field for spam prevention
- API keys in env vars only

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy --prod
```

### Backend (Render)
```yaml
# render.yaml
services:
  - type: web
    name: flight-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SKYSCANNER_API_KEY
        sync: false
      - key: REDIS_URL
        fromDatabase: redis
      - key: DATABASE_URL
        fromDatabase: postgres

databases:
  - name: postgres
    plan: starter
  - name: redis
    plan: starter
```

## MVP Build Order
1. ✅ Blueprint + Research
2. ✅ Architecture Design
3. **Next:** Backend scaffolding (FastAPI + DB models)
4. Flight search endpoint + Skyscanner integration
5. OTA safety scorer
6. Frontend UI (search + results)
7. Email alert system
8. Deploy + test
9. SEO page generator (post-launch)
10. Social automation (post-launch)

---
Created: 2026-03-10
Status: Architecture Complete
Next: Scaffold backend
