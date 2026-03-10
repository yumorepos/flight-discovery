# Flight Discovery Platform Blueprint

## Mission
Build a web platform that answers: "Where can I fly cheaply from my airport?"

## Core Value Prop
- Cheap flight discovery
- Travel inspiration
- Trusted booking links
- Automated deal alerts
- Shareable travel content

## User Flow
1. Enter origin airport (IATA code)
2. Optional: travel month
3. Get cheapest destinations grouped by region
4. Sort by: price → safety rating
5. Click to book via trusted links

## Tech Stack
- **Frontend:** Next.js + React + TailwindCSS → Vercel
- **Backend:** FastAPI (Python) → Render/Railway
- **Database:** PostgreSQL
- **Flight APIs:** Amadeus/Skyscanner/Kiwi Tequila (research required)
- **Email:** Resend/SendGrid/AWS SES

## Database Models
```sql
-- flights
origin, destination, price, taxes, total_price, airline, 
depart_date, return_date, booking_link, link_safety_score, last_updated

-- subscriptions
email, destination, created_at

-- users (optional)
email, subscription_plan, subscription_status
```

## Ranking Algorithm
- 60% price score
- 30% safety score
- 10% date relevance

## Booking Link Trust Score (0-100)
- Official airline domains
- Known OTA whitelist
- HTTPS security
- Domain reputation
- Redirect chain behavior

## Performance Rules
- Cache searches by origin + month (24h TTL)
- Return results <2s
- Minimize external API calls

## Monetization
1. Affiliate flight links
2. Premium deal alerts ($5-10/month)
3. Sponsored deals
4. Future data API

## Growth Strategy
- SEO: auto-generate "cheap flights from [city]" pages
- Social: auto-post deals to X/Reddit/travel forums
- Email: daily price drop alerts

## Build Phases
1. API research & selection
2. System architecture
3. MVP (search + ranking + UI)
4. Email alerts (cron job)
5. SEO page generator
6. Social automation

---
Created: 2026-03-10
Status: Blueprint Complete
Next: API research
