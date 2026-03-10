# Kiwi Tequila API Setup Guide

This guide explains how to integrate the Kiwi.com Tequila API for real-time flight search.

## Why Kiwi Tequila?

After Amadeus shut down their free tier in March 2026, we migrated to Kiwi Tequila API:

- **Simple authentication**: API key only (no OAuth complexity)
- **Free tier**: 100 searches/month
- **Good coverage**: Global flight inventory
- **Direct booking**: Deep links to Kiwi.com booking flow
- **Flexible search**: Date ranges, multi-destination, currency support

## Quick Start

### 1. Get Your API Key

1. Visit: https://tequila.kiwi.com/portal/login
2. Sign up for a free account
3. Navigate to **Dashboard** → **API Keys**
4. Copy your API key

### 2. Configure Environment

Add to `backend/.env`:

```bash
KIWI_API_KEY=your_kiwi_api_key_here
```

### 3. Test the Integration

```bash
# Activate virtual environment
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Start the server
uvicorn main:app --reload --port 8000

# Test API (in another terminal)
curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'
```

You should see real flight data from Kiwi API.

## API Features

### Endpoints Used

**Primary endpoint**: `GET https://api.tequila.kiwi.com/v2/search`

**Parameters**:
- `fly_from`: Origin IATA code (e.g., "YUL")
- `fly_to`: Destination IATA code (optional - omit for multi-destination)
- `date_from`: Start date in `DD/MM/YYYY` format
- `date_to`: End date in `DD/MM/YYYY` format
- `curr`: Currency code (default: "CAD")
- `limit`: Max results (max 100)
- `vehicle_type`: "aircraft" (excludes buses/trains)

**Authentication**: Header `apikey: YOUR_KEY`

### Response Format

Kiwi returns flight data with this structure:

```json
{
  "data": [
    {
      "id": "unique_flight_id",
      "flyFrom": "YUL",
      "flyTo": "CDG",
      "price": 450,
      "duration": {"total": 26400},  // seconds
      "route": [/* segments */],
      "airlines": ["AC"],
      "dTime": 1710518400,  // Unix timestamp
      "deep_link": "https://www.kiwi.com/deep?..."
    }
  ]
}
```

### Mapping to Our Format

Our `kiwi_client.py` normalizes Kiwi responses:

| Kiwi Field | Our Field | Transformation |
|------------|-----------|----------------|
| `price` | `total_price` | Direct (CAD) |
| `price / 1.15` | `price` | Base price (remove 15% tax estimate) |
| `duration.total` | `duration_hours` | Seconds → hours (÷ 3600) |
| `route.length - 1` | `stops` | Number of segments - 1 |
| `airlines[0]` | `airline` | First airline code |
| `flyTo` | `destination` | IATA code |
| `dTime` | `date` | Unix timestamp → YYYY-MM-DD |
| `deep_link` | `booking_url` | Direct booking link |

## Rate Limits

**Free tier**: 100 API calls per month

### Rate Limit Handling

The client tracks calls and resets monthly:

```python
self._call_count = 0
self._month_start = datetime.now().replace(day=1)
```

**Strategies**:
1. **Caching**: 1h in-memory + 24h Redis cache
2. **Mock fallback**: Returns local data when limit reached
3. **Counter tracking**: Logs remaining calls (`X/100`)
4. **429 handling**: Detects rate limit errors and fails gracefully

### Monthly Budget Planning

100 calls/month = ~3 calls/day average

**Recommended allocation**:
- Frontend searches: 60 calls
- Background monitoring: 20 calls
- Development/testing: 20 calls

## Caching Strategy

### Two-tier cache:

1. **In-memory** (1 hour TTL)
   - Fast retrieval
   - Process-scoped
   - Resets on server restart

2. **Redis** (24 hour TTL)
   - Shared across workers
   - Persistent across restarts
   - Production-ready

**Cache key format**: `flight_search:ORIGIN:MONTH:DESTINATION`

Example: `flight_search:YUL:2026-03:CDG`

## Error Handling

### Fallback Behavior

1. API key missing → Empty results (logs warning)
2. Rate limit exceeded → Empty results (logs error)
3. Network error → Empty results (logs exception)
4. 429 status → Empty results (logs rate limit hit)
5. Invalid response → Skip malformed offers

### No Mock Data in Production

Unlike Amadeus integration, Kiwi client returns `[]` on errors, allowing `main.py` to fall back to local mock data.

## Testing

### Local Development

```bash
# With API key
KIWI_API_KEY=abc123 uvicorn main:app --reload

# Without API key (mock data fallback)
uvicorn main:app --reload
```

### Test Queries

```bash
# Single destination, specific month
curl 'http://localhost:8000/api/search?origin=YUL&destination=CDG&month=2026-03'

# Multi-destination, month range
curl 'http://localhost:8000/api/search?origin=YUL&month=2026-04'

# All destinations from YUL (uses flexible date range)
curl 'http://localhost:8000/api/search?origin=YUL'
```

## Troubleshooting

### No Results Returned

**Check**:
1. API key is valid: `echo $KIWI_API_KEY`
2. Server logs: Look for "Kiwi API available: True"
3. Rate limit: Check "Kiwi API calls this month: X/100"
4. Network: `curl -H "apikey: YOUR_KEY" https://api.tequila.kiwi.com/v2/search?fly_from=YUL`

### Rate Limit Reached

**Solutions**:
1. Wait until next month (counter resets automatically)
2. Use cached results (frontend won't notice)
3. Rely on mock data fallback (58 hardcoded flights)
4. Upgrade to paid plan (if needed)

### Response Format Changed

Kiwi may update their API. If flights stop parsing:

1. Check their docs: https://tequila.kiwi.com/portal/docs/tequila_api/search_api
2. Update `_parse_response()` in `kiwi_client.py`
3. Test with: `python3 -c "from kiwi_client import KiwiFlightClient; c = KiwiFlightClient(); print(c.search_flights('YUL', 'CDG'))"`

## Migration from Amadeus

### What Changed

| Aspect | Amadeus | Kiwi |
|--------|---------|------|
| Auth | OAuth (client ID + secret) | API key header |
| Rate limit | 2,000/month (test API) | 100/month (free) |
| Response format | Complex nested structure | Flatter, simpler |
| Booking | No direct links | Deep links to Kiwi.com |
| Coverage | GDS inventory | OTA + GDS + budget carriers |

### Value Algorithm (Preserved)

The scoring algorithm remains **unchanged**:

```python
value_score = (
    price_score * 0.40 +      # Lower price = better
    duration_score * 0.30 +   # Shorter flight = better
    stops_score * 0.20 +      # Fewer stops = better
    safety_score * 0.10       # OTA trust score
)
```

This ensures frontend compatibility and consistent recommendations.

## Production Deployment

### Environment Variables

Ensure `.env` is **not** committed to Git:

```bash
# backend/.env (never commit!)
KIWI_API_KEY=prod_kiwi_key_here
REDIS_URL=redis://prod-redis:6379/0
```

### Heroku Example

```bash
heroku config:set KIWI_API_KEY=your_key_here
heroku config:set REDIS_URL=redis://your-redis-instance
```

### Health Check

Add endpoint to verify API status:

```python
@app.get("/api/health")
async def health_check():
    return {
        "kiwi_available": kiwi_client.is_available(),
        "redis_available": redis_client is not None,
    }
```

## Resources

- **Kiwi Portal**: https://tequila.kiwi.com/portal/login
- **API Docs**: https://tequila.kiwi.com/portal/docs/tequila_api/search_api
- **Support**: https://tequila-support.kiwi.com/

## Next Steps

1. ✅ Sign up for Kiwi account
2. ✅ Get API key
3. ✅ Add to `.env`
4. ✅ Test locally
5. ⬜ Monitor rate limits
6. ⬜ Deploy to production
7. ⬜ Set up monitoring alerts (optional)
