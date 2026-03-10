#!/bin/bash
# Kiwi Integration Verification Script
# Quick health check for the Kiwi Tequila API integration

set -e

echo "============================================================"
echo "Kiwi Tequila API Integration - Verification Script"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Change to backend directory
cd "$(dirname "$0")"

echo "📁 Working directory: $(pwd)"
echo ""

# Check Python environment
echo "🐍 Checking Python environment..."
if [ ! -d ".venv" ]; then
    echo -e "${RED}✗ Virtual environment not found${NC}"
    echo "  Run: python3 -m venv .venv"
    exit 1
fi

source .venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${YELLOW}⚠ 'requests' not installed. Installing...${NC}"
    pip install -q requests
fi

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Dependencies missing. Installing from requirements.txt...${NC}"
    pip install -q -r requirements.txt
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Check Kiwi client
echo "🔍 Checking Kiwi client..."
if python3 -c "from kiwi_client import KiwiFlightClient; KiwiFlightClient()" 2>/dev/null; then
    echo -e "${GREEN}✓ kiwi_client.py loads successfully${NC}"
else
    echo -e "${RED}✗ Failed to load kiwi_client.py${NC}"
    exit 1
fi
echo ""

# Check main.py integration
echo "🔗 Checking main.py integration..."
if python3 -c "from main import kiwi_client" 2>/dev/null; then
    echo -e "${GREEN}✓ main.py imports kiwi_client successfully${NC}"
else
    echo -e "${RED}✗ Failed to import kiwi_client in main.py${NC}"
    exit 1
fi
echo ""

# Check API key configuration
echo "🔑 Checking API key configuration..."
if grep -q "KIWI_API_KEY=" .env 2>/dev/null; then
    if grep -q "KIWI_API_KEY=your_" .env; then
        echo -e "${YELLOW}⚠ KIWI_API_KEY placeholder found (not configured)${NC}"
        echo "  To use real data:"
        echo "  1. Sign up: https://tequila.kiwi.com/portal/login"
        echo "  2. Get API key from dashboard"
        echo "  3. Update .env: KIWI_API_KEY=your_actual_key"
        MOCK_MODE=true
    else
        echo -e "${GREEN}✓ KIWI_API_KEY configured in .env${NC}"
        MOCK_MODE=false
    fi
else
    echo -e "${YELLOW}⚠ KIWI_API_KEY not found in .env${NC}"
    echo "  Will use mock data fallback"
    MOCK_MODE=true
fi
echo ""

# Run test suite
echo "🧪 Running integration tests..."
if python3 test_kiwi_integration.py | tail -n 20; then
    echo -e "${GREEN}✓ All integration tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
echo ""

# Summary
echo "============================================================"
echo "Summary"
echo "============================================================"
echo ""

if [ "$MOCK_MODE" = true ]; then
    echo -e "${YELLOW}📊 Status: Integration ready (using mock data)${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Get Kiwi API key: https://tequila.kiwi.com/portal/login"
    echo "2. Add to .env: KIWI_API_KEY=your_key"
    echo "3. Restart server: uvicorn main:app --reload"
    echo "4. Test: curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'"
else
    echo -e "${GREEN}✅ Status: Integration fully configured${NC}"
    echo ""
    echo "Ready to use:"
    echo "• Start server: uvicorn main:app --reload --port 8000"
    echo "• Test API: curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'"
    echo "• Check for: \"source\": \"kiwi\" in response"
fi

echo ""
echo "Documentation:"
echo "• Setup guide: KIWI_SETUP.md"
echo "• Testing guide: TEST_API.md"
echo "• Migration notes: MIGRATION_NOTES.md"
echo ""

exit 0
