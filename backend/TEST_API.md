# API Testing Guide

Quick reference for testing the Kiwi-integrated Flight Discovery API.

## Start the Server

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Server will be available at: `http://localhost:8000`

## Test Endpoints

### 1. Health Check (Optional - can add this)

```bash
curl http://localhost:8000/api/airports
```

Expected: List of origin airports (YUL, YYZ, JFK, etc.)

### 2. Search Flights by Month

**With Kiwi API key configured:**

```bash
curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'
```

Expected: Real flights from Kiwi API with `"source": "kiwi"`

**Without API key (mock data fallback):**

```bash
curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'
```

Expected: Mock flights with value scores

### 3. Search Specific Destination

```bash
curl 'http://localhost:8000/api/search?origin=YUL&destination=CDG&month=2026-04'
```

### 4. Top Deals

```bash
curl 'http://localhost:8000/api/top-deals?origin=YUL&limit=5'
```

Expected: Top 5 flights sorted by deal score

## Verify Kiwi Integration

### With Real API Key

1. Add to `.env`:
   ```
   KIWI_API_KEY=your_actual_key_here
   ```

2. Restart server

3. Test search:
   ```bash
   curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03' | jq '.[] | {id, origin, destination, price, source}'
   ```

4. Look for:
   - `"source": "kiwi"` (confirms real API data)
   - `"id": "kiwi_..."` (Kiwi flight IDs)
   - `"booking_url": "https://www.kiwi.com/deep?..."`

### Check Logs

Server logs will show:

```
INFO:main:Kiwi API available: True
INFO:kiwi_client:Kiwi API request: {'fly_from': 'YUL', 'curr': 'CAD', ...}
INFO:kiwi_client:Kiwi API calls this month: 1/100
INFO:kiwi_client:Retrieved 47 flights from Kiwi API
INFO:main:Retrieved 47 flights from Kiwi API
INFO:main:Returning 47 flights to frontend
```

### Without API Key

Logs will show:

```
WARNING:kiwi_client:Kiwi API key not found - will return empty results
INFO:main:Kiwi API available: False
INFO:main:Using mock data (Kiwi unavailable or returned no results)
INFO:main:Returning 10 flights to frontend
```

## Response Format

Each flight should include:

```json
{
  "id": "kiwi_abc123",
  "origin": "YUL",
  "destination": "CDG",
  "price": 391,
  "total_price": 450,
  "tax_amount": 59,
  "date": "2026-03-15",
  "airline": "AC",
  "duration_hours": 7.33,
  "duration": "7h 20m",
  "stops": 0,
  "currency": "CAD",
  "source": "kiwi",
  "booking_url": "https://www.kiwi.com/deep?...",
  "city": "Paris",
  "country": "France",
  "region": "EU",
  "destination_emoji": "🗼",
  "value_score": 82.5,
  "safety_score": 80.0,
  "deal_score": 67.8,
  "deal_classification": "Good Deal"
}
```

## Frontend Integration Test

1. Start backend: `uvicorn main:app --reload --port 8000`
2. Start frontend: `npm run dev` (in frontend directory)
3. Open: `http://localhost:3000`
4. Select origin: YUL
5. Select month: March 2026
6. Click "Search Flights"
7. Verify:
   - Results load within 2 seconds
   - Flights sorted by value_score (descending)
   - Booking links work (open Kiwi.com)

## Rate Limit Testing

To test rate limit handling:

```bash
# Make 5 requests quickly
for i in {1..5}; do
  curl -s 'http://localhost:8000/api/search?origin=YUL&month=2026-0'$i | jq '.[] | {source}' | head -5
  echo "Request $i completed"
done
```

Check logs for:
```
INFO:kiwi_client:Kiwi API calls this month: 5/100
```

## Troubleshooting

### No results returned

**Check:**
1. Server is running: `curl http://localhost:8000/api/airports`
2. Valid origin code: Must be 3-letter IATA (YUL, JFK, etc.)
3. Valid month format: YYYY-MM
4. Check logs for errors

### All results are mock data

**Possible causes:**
1. `KIWI_API_KEY` not set in `.env`
2. Invalid API key
3. Rate limit exceeded (100/month)
4. Network issue (firewall blocking Kiwi API)

**Debug:**
```bash
# Test Kiwi API directly
curl -H "apikey: YOUR_KEY" \
  'https://api.tequila.kiwi.com/v2/search?fly_from=YUL&date_from=15/03/2026&date_to=15/03/2026&curr=CAD&limit=10'
```

### Value scores look wrong

**Check:**
- Value algorithm in `main.py` → `rank_flights()` function
- Should be: 40% price + 30% duration + 20% stops + 10% safety
- Lower prices = higher scores
- Shorter flights = higher scores
- Fewer stops = higher scores

### Booking URLs don't work

**Kiwi deep links expire** after ~24 hours. This is normal.

**Fallback:** Use `booking_url` pattern:
```
https://www.google.com/travel/flights?q=Flights+from+Montreal+to+Paris+on+2026-03-15
```

## Run Full Test Suite

```bash
cd backend
source .venv/bin/activate
python3 test_kiwi_integration.py
```

Expected: `✓ ALL TESTS PASSED`

## Production Checklist

- [ ] `KIWI_API_KEY` set in production environment
- [ ] Redis configured for caching (`REDIS_URL`)
- [ ] Server logs monitored for rate limit warnings
- [ ] Frontend updated (no code changes needed)
- [ ] Backup mock data enabled (already in place)
- [ ] API call budget tracked (100/month)
