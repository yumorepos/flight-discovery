# Smart Deal Detection System

## Objective
Automatically detect and highlight unusually good flight deals (price drops, mistake fares, exceptional value).

## Deal Score System (0-100)

### Formula
```python
deal_score = (
    0.50 * price_vs_historical_score +
    0.20 * value_score +
    0.15 * rarity_score +
    0.10 * route_popularity_score +
    0.05 * booking_safety_score
)
```

### Factor Definitions

**1. price_vs_historical_score (50% weight)**
```python
def calculate_price_vs_historical(current_price, avg_price):
    discount = (avg_price - current_price) / avg_price
    
    if discount >= 0.50:  # 50%+ off
        return 100
    elif discount >= 0.30:  # 30-49% off
        return 80
    elif discount >= 0.10:  # 10-29% off
        return 60
    elif discount >= 0:  # At or below average
        return 40
    else:  # Above average
        return max(0, 40 - (abs(discount) * 100))
```

**2. value_score (20% weight)**
Reuse existing value ranking:
```python
value_score = (0.6 * price_score) + (0.3 * safety_score) + (0.1 * date_relevance)
```

**3. rarity_score (15% weight)**
```python
def calculate_rarity(route, current_price):
    # Query last 90 days of prices for this route
    price_history = get_price_history(route, days=90)
    
    # Calculate percentile
    percentile = percentileofscore(price_history, current_price)
    
    # Lower percentile = rarer deal
    return 100 - percentile
```

**4. route_popularity_score (10% weight)**
```python
def calculate_route_popularity(origin, destination):
    # Based on search volume or booking frequency
    monthly_searches = get_search_volume(origin, destination)
    
    # Normalize to 0-100
    if monthly_searches >= 1000:
        return 100
    elif monthly_searches >= 500:
        return 80
    elif monthly_searches >= 100:
        return 60
    else:
        return 40
```

**5. booking_safety_score (5% weight)**
Use existing OTA safety scorer (0-100).

## Deal Classification

| Score Range | Badge | Color | Alert Priority |
|-------------|-------|-------|----------------|
| 90-100 | 🔥 Mistake Fare | Red | Immediate |
| 75-89 | ⚡ Hot Deal | Orange | High |
| 60-74 | ✨ Good Deal | Yellow | Medium |
| 40-59 | 👍 Fair Price | Green | None |
| 0-39 | — Normal Price | Gray | None |

## Database Schema Addition

```sql
-- price_history table
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  price DECIMAL(10,2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_date ON price_history(origin, destination, recorded_at);

-- route_popularity table
CREATE TABLE route_popularity (
  origin VARCHAR(3),
  destination VARCHAR(3),
  search_count INT DEFAULT 0,
  booking_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (origin, destination)
);
```

## Updated Flight Card UI

```jsx
<FlightCard>
  <FlightInfo>
    <Destination>Paris (CDG)</Destination>
    <Price>$423 CAD</Price>
    <HistoricalPrice>Usually $650</HistoricalPrice>
    <Savings>Save 35%</Savings>
  </FlightInfo>
  
  <Badges>
    <DealBadge score={85}>⚡ Hot Deal</DealBadge>
    <SafetyBadge score={100}>🟢 Official Airline</SafetyBadge>
  </Badges>
  
  <Metrics>
    <Metric label="Deal Score" value="85/100" />
    <Metric label="Value Score" value="92/100" />
    <Metric label="Safety Score" value="100/100" />
  </Metrics>
  
  <FlightDetails>
    <Detail>Air Canada • Direct • 7h 20m</Detail>
  </FlightDetails>
  
  <BookButton link={bookingLink}>Book Now →</BookButton>
</FlightCard>
```

## Email Alert Enhancement

**Trigger Condition:**
```python
if deal_score >= 75:
    send_email_alert(subscription)
```

**Email Template:**
```
Subject: 🔥 Mistake Fare Alert: YUL → Paris $423 (35% off!)

Hey Yumo!

We found an incredible deal on the route you're watching:

🔥 DEAL SCORE: 85/100 (Hot Deal)

✈️ Montreal (YUL) → Paris (CDG)
💰 $423 CAD (usually $650)
📊 Save 35% — This deal is in the top 5% of prices for this route
📅 March 15-22, 2026
🛫 Air Canada • Direct • 7h 20m

Safety Rating: 🟢 Official Airline (100/100)

[Book This Deal →]

Why this is a hot deal:
• 35% cheaper than 90-day average ($650)
• This price only appears 2-3 times per year
• Direct flight (saves time + hassle)
• Official airline booking (100% safe)

⏰ Deal expires in ~24 hours

Not interested? [Unsubscribe] | [Manage Preferences]
```

## Performance Optimization

**1. Historical Price Caching**
```python
# Update historical averages once daily (cron job)
@celery.task
def update_historical_averages():
    routes = get_all_active_routes()
    for route in routes:
        avg_price = calculate_90day_average(route)
        redis.setex(f"avg_price:{route}", 86400, avg_price)
```

**2. Rarity Calculation (batch mode)**
```python
# Pre-calculate percentiles for common routes
# Run weekly, store in Redis
```

**3. Deal Score Computation**
- Calculate on search (cached result)
- Recalculate on price update only
- Store in flights table as `deal_score` column

## Implementation Order

1. ✅ Add `price_history` and `route_popularity` tables
2. ✅ Implement historical price tracker (background job)
3. ✅ Build deal score calculation module
4. ✅ Update API response to include deal_score + classification
5. ✅ Update frontend to display deal badges
6. ✅ Enhance email alerts with deal score filtering
7. ✅ Add "Top Deals" landing page (sorted by deal_score DESC)

## New API Endpoints

```
GET /api/top-deals?origin=YUL&limit=10
  → Returns flights sorted by deal_score DESC

GET /api/route-stats?origin=YUL&destination=CDG
  → Returns historical avg price, current price, deal score
```

## Competitive Advantage

**vs Google Flights:** No deal detection, just raw price display  
**vs Skyscanner:** Shows "cheapest month" but no historical context  
**vs Going.com:** Manual curation (slow), no transparency on scoring  
**vs SecretFlying:** No quantified deal quality, just "trust us"

**Our Edge:** Transparent, automated, data-driven deal scoring with historical context.

---
Created: 2026-03-10
Status: Specification Complete
Next: Integrate into backend build
