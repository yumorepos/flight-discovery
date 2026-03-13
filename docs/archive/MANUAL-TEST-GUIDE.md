# Manual Testing Guide - Flight Discovery Platform

## Prerequisites
- Backend running on http://localhost:8000
- Frontend running on http://localhost:3000
- Modern browser with developer tools

---

## Test 1: Basic Search Flow

### Steps:
1. Open http://localhost:3000 in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. In the search form on the page:
   - Enter: **YUL**
   - Select: **March**
5. Click **Search** button

### Expected Console Output:
```
Searching for flights from YUL in 2026-03
Fetching flights...
```

### Expected Network Request:
- Method: GET
- URL: `http://localhost:8000/api/search?origin=YUL&month=2026-03`
- Status: 200 OK

### Expected UI Behavior:
1. Results section should populate with flight cards
2. Flights grouped by region:
   - **NA** (North America): New York, Los Angeles
   - **EU** (Europe): Paris
   - **AF** (Africa): Johannesburg
   - **Oceania**: Auckland

3. Each card should show:
   - City name (e.g., "New York" not "JFK")
   - Current price
   - Historical price
   - Savings percentage
   - Airline name
   - Deal score (0-100)
   - Value score (0-100)
   - Safety score (0-100)

---

## Test 2: Input Validation

### Test 2a: Invalid IATA Code

**Steps:**
1. Enter: **NYC** (invalid - too many letters)
2. Select: March
3. Click Search

**Expected:**
- Alert: "Please enter a valid 3-letter IATA airport code"
- No API call made

### Test 2b: Empty IATA Code

**Steps:**
1. Leave origin empty
2. Select: March
3. Click Search

**Expected:**
- Alert: "Please enter a valid 3-letter IATA airport code"
- No API call made

### Test 2c: No Month Selected

**Steps:**
1. Enter: **YUL**
2. Leave month as "Any Month"
3. Click Search

**Expected:**
- Alert: "Please select a month"
- No API call made

---

## Test 3: Different Origin Airports

### Test 3a: JFK Search

**Steps:**
1. Enter: **JFK**
2. Select: **March**
3. Click Search

**Expected:**
- API call: `http://localhost:8000/api/search?origin=JFK&month=2026-03`
- Results: 1 flight to London (EU)

### Test 3b: LAX Search

**Steps:**
1. Enter: **LAX**
2. Select: **March**
3. Click Search

**Expected:**
- API call: `http://localhost:8000/api/search?origin=LAX&month=2026-03`
- Results: 1 flight to Buenos Aires (SA)

### Test 3c: Unknown Airport

**Steps:**
1. Enter: **ZZZ** (non-existent airport)
2. Select: **March**
3. Click Search

**Expected:**
- API call made successfully
- Results: Empty (no flights from ZZZ)
- No console errors

---

## Test 4: Different Months

### Steps:
1. Enter: **YUL**
2. Select: **April**
3. Click Search

**Expected:**
- API call: `http://localhost:8000/api/search?origin=YUL&month=2026-04`
- Results: 5 flights (different dates than March)
- Different prices (April flights have slightly higher prices)

---

## Test 5: Region Grouping

### Steps:
1. Search: YUL → March
2. Scroll through results

**Expected Regions:**
1. **NA** (North America)
   - New York ($200)
   - Los Angeles ($350)

2. **EU** (Europe)
   - Paris ($450)

3. **AF** (Africa)
   - Johannesburg ($950)

4. **Oceania**
   - Auckland ($1200)

### Verification:
- Each region has a heading (h2)
- Flights within each region are grouped together
- Regions appear in the order returned by API

---

## Test 6: Deal Badges

### Check Deal Classifications:

**Good Deal** (60-74 score):
- Should have yellow/orange badge
- Text: "✨ Good Deal"
- Most YUL flights should show this

**Hot Deal** (75-89 score):
- Orange badge with pulse animation
- Text: "⚡ Hot Deal"

**Mistake Fare** (90+ score):
- Red badge
- Text: "🔥 Mistake Fare"

**Normal/Fair Price** (<60 score):
- No badge displayed

---

## Test 7: Price Calculations

### Verify Savings Display:

For each flight, the card should show:
```
Price: $200 (Save 33%)
Usually $300
```

**Formula:**
- Savings % = ((historical_price - price) / historical_price) * 100
- Example: ((300 - 200) / 300) * 100 = 33%

---

## Test 8: Hot Reload

### Backend Changes:

**Steps:**
1. With search results displayed
2. Edit `backend/main.py`
3. Change mock_flights price (e.g., JFK from $200 to $250)
4. Save file
5. Re-run search (YUL → March)

**Expected:**
- Backend auto-reloads
- New search shows updated price
- No need to restart server

### Frontend Changes:

**Steps:**
1. With search results displayed
2. Edit `frontend/src/app/components/DestinationCard.tsx`
3. Change any text (e.g., "Book" button to "View Deal")
4. Save file

**Expected:**
- Frontend auto-reloads
- UI updates without page refresh
- No need to restart dev server

---

## Test 9: Console Error Check

### Steps:
1. Open Console (F12)
2. Perform several searches
3. Check for errors

**Expected:**
- No red errors in console
- Only log messages should be:
  - "Searching for flights from..."
  - "Fetching flights..."

**Common Issues to Watch:**
- ❌ CORS errors → Backend CORS not configured
- ❌ 404 Not Found → API endpoint wrong
- ❌ TypeScript errors → Type mismatch in components
- ❌ Undefined field errors → Backend schema mismatch

---

## Test 10: Network Tab Verification

### Steps:
1. Open Network tab (F12)
2. Search: YUL → March
3. Find the API request

**Expected Request:**
- URL: `http://localhost:8000/api/search?origin=YUL&month=2026-03`
- Method: GET
- Status: 200 OK
- Type: fetch

**Expected Response Headers:**
```
Content-Type: application/json
Access-Control-Allow-Origin: *
```

**Expected Response Body (Preview):**
```json
[
  {
    "id": 1,
    "origin": "YUL",
    "destination": "JFK",
    "city": "New York",
    "price": 200,
    "date": "2026-03-15",
    "airline": "Air Canada",
    "region": "NA",
    "historical_price": 300.0,
    "safety_score": 80.0,
    "value_score": 78.0,
    "deal_score": 65.89,
    "deal_classification": "Good Deal"
  },
  ...
]
```

---

## Troubleshooting

### Issue: No results display

**Check:**
1. Console for errors
2. Network tab for failed requests
3. Backend server is running (`ps aux | grep uvicorn`)
4. API returns data: `curl "http://localhost:8000/api/search?origin=YUL&month=2026-03"`

### Issue: Results don't update

**Check:**
1. Search button actually triggers handleSearch
2. searchParams state is updating (add console.log)
3. useEffect dependencies include [origin, month]

### Issue: Field undefined errors

**Check:**
1. Backend response matches Flight interface
2. Field names are correct (snake_case vs camelCase)
3. DestinationCard props match API response

### Issue: Validation doesn't work

**Check:**
1. SearchForm has onSearch prop
2. origin.length check works
3. month is not empty string

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Search triggers API call
✅ Results display with correct data
✅ Region grouping works
✅ Deal badges appear
✅ Validation prevents bad input
✅ Hot reload works for both servers

---

## Performance Check

### Expected Load Times:
- Initial page load: < 2s
- API response: < 500ms (local server)
- UI update after search: < 100ms

### Expected Resource Usage:
- Backend memory: < 100 MB
- Frontend bundle size: < 5 MB
- API response size: < 50 KB (for typical search)

---

## Final Verification Command

```bash
# Run all automated tests
cd projects/flight-discovery
./test-integration.sh

# If all pass, manually test in browser:
# 1. http://localhost:3000
# 2. Search: YUL → March
# 3. Verify results display
```

**Status: ✅ Platform is working if all tests pass**
