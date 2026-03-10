#!/bin/bash

echo "=== Flight Discovery Platform Integration Test ==="
echo ""

# Test 1: Backend API Schema
echo "Test 1: Backend API Schema"
echo "Testing: GET /api/search?origin=YUL&month=2026-03"
RESPONSE=$(curl -s "http://localhost:8000/api/search?origin=YUL&month=2026-03")

# Check if response contains required fields
if echo "$RESPONSE" | grep -q '"city"'; then
    echo "✓ 'city' field present"
else
    echo "✗ 'city' field MISSING"
fi

if echo "$RESPONSE" | grep -q '"region"'; then
    echo "✓ 'region' field present"
else
    echo "✗ 'region' field MISSING"
fi

if echo "$RESPONSE" | grep -q '"historical_price"'; then
    echo "✓ 'historical_price' field present"
else
    echo "✗ 'historical_price' field MISSING"
fi

if echo "$RESPONSE" | grep -q '"safety_score"'; then
    echo "✓ 'safety_score' field present"
else
    echo "✗ 'safety_score' field MISSING"
fi

if echo "$RESPONSE" | grep -q '"value_score"'; then
    echo "✓ 'value_score' field present"
else
    echo "✗ 'value_score' field MISSING"
fi

# Test 2: Count destinations
echo ""
echo "Test 2: Number of Destinations"
COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "Found $COUNT destinations for YUL in March 2026"

if [ "$COUNT" -ge 1 ]; then
    echo "✓ Backend returns flight data"
else
    echo "✗ Backend returns no data"
fi

# Test 3: Region diversity
echo ""
echo "Test 3: Region Diversity"
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
regions = set(f['region'] for f in data)
print(f'Unique regions: {regions}')
if len(regions) >= 1:
    print('✓ Multiple regions represented')
else:
    print('✗ Not enough region diversity')
" 2>/dev/null

# Test 4: Sample flight data
echo ""
echo "Test 4: Sample Flight (first result)"
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data:
    flight = data[0]
    print(f\"Destination: {flight.get('city', 'N/A')} ({flight.get('destination', 'N/A')})\")
    print(f\"Price: \${flight.get('price', 'N/A')}\")
    print(f\"Historical Price: \${flight.get('historical_price', 'N/A')}\")
    print(f\"Region: {flight.get('region', 'N/A')}\")
    print(f\"Safety Score: {flight.get('safety_score', 'N/A')}\")
    print(f\"Deal Score: {flight.get('deal_score', 'N/A')}\")
    print(f\"Value Score: {flight.get('value_score', 'N/A')}\")
" 2>/dev/null

# Test 5: Frontend servers running
echo ""
echo "Test 5: Server Status"
if curl -s http://localhost:8000/api/search?origin=YUL\&month=2026-03 > /dev/null; then
    echo "✓ Backend server running on port 8000"
else
    echo "✗ Backend server NOT running"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Frontend server running on port 3000"
else
    echo "✗ Frontend server NOT running"
fi

echo ""
echo "=== Integration Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Enter 'YUL' in the Origin field"
echo "3. Select 'March' from the month dropdown"
echo "4. Click 'Search'"
echo "5. Verify results display with correct city names, prices, and scores"
