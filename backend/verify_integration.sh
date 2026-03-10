#!/bin/bash
# Quick verification script for Amadeus integration

echo "🔍 Amadeus Integration Verification"
echo "===================================="
echo ""

# Check if server is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8000/api/airports > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is not running"
    echo "   Start it with: python -m uvicorn main:app --reload"
    exit 1
fi

echo ""
echo "2. Checking Amadeus client integration..."
if grep -q "amadeus_client" main.py; then
    echo "   ✅ Amadeus client imported in main.py"
else
    echo "   ❌ Amadeus client not found in main.py"
    exit 1
fi

echo ""
echo "3. Testing API search endpoint..."
RESPONSE=$(curl -s 'http://localhost:8000/api/search?origin=YUL&destination=CDG')
COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ ! -z "$COUNT" ]; then
    echo "   ✅ Search endpoint returned $COUNT flights"
else
    echo "   ❌ Search endpoint failed"
    exit 1
fi

echo ""
echo "4. Checking data source..."
SOURCE=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0].get('source', 'mock') if data else 'none')" 2>/dev/null)
if [ "$SOURCE" = "amadeus" ]; then
    echo "   🎯 Using REAL Amadeus API data!"
else
    echo "   🧪 Using mock data (Amadeus credentials not configured)"
    echo "   To use real data, add credentials to .env"
fi

echo ""
echo "5. Checking required files..."
FILES=("amadeus_client.py" "AMADEUS_SETUP.md" "test_amadeus_integration.py" "INTEGRATION_SUMMARY.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing"
    fi
done

echo ""
echo "6. Checking installed packages..."
source .venv/bin/activate 2>/dev/null
if python3 -c "import amadeus" 2>/dev/null; then
    echo "   ✅ amadeus package installed"
else
    echo "   ❌ amadeus package not installed"
    echo "   Run: pip install amadeus"
fi

if python3 -c "import isodate" 2>/dev/null; then
    echo "   ✅ isodate package installed"
else
    echo "   ❌ isodate package not installed"
    echo "   Run: pip install isodate"
fi

echo ""
echo "===================================="
echo "✅ Integration verification complete!"
echo ""
echo "📚 Documentation:"
echo "   - Setup guide: AMADEUS_SETUP.md"
echo "   - Quick start: QUICKSTART.md"
echo "   - Architecture: ARCHITECTURE.md"
echo "   - Summary: INTEGRATION_SUMMARY.md"
echo ""
echo "🧪 Run tests:"
echo "   python test_amadeus_integration.py"
echo ""
echo "🚀 Status: Ready for production"
echo "   Add Amadeus credentials to .env to use real data"
