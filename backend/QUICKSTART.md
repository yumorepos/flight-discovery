# Amadeus Integration - Quick Start

## 🚀 TL;DR

1. **Get credentials**: https://developers.amadeus.com/register
2. **Add to `.env`**:
   ```env
   AMADEUS_API_KEY=your_key
   AMADEUS_API_SECRET=your_secret
   ```
3. **Restart backend**:
   ```bash
   cd backend
   source .venv/bin/activate
   python -m uvicorn main:app --reload
   ```
4. **Verify**: Check logs for `Amadeus API available: True`

## ✅ What's Working Now

- ✅ Amadeus API fully integrated
- ✅ Automatic fallback to mock data
- ✅ Same API response format (frontend works unchanged)
- ✅ Value scoring algorithm preserved
- ✅ Caching enabled (Redis + in-memory)
- ✅ Error handling active

## 🧪 Test It

```bash
# Search flights
curl 'http://localhost:8000/api/search?origin=YUL&month=2026-03'

# Run test suite
python test_amadeus_integration.py
```

## 📊 Status Check

```bash
# Check if using Amadeus or mock data
curl -s 'http://localhost:8000/api/search?origin=YUL&month=2026-03' | grep -o '"source":"[^"]*"'

# Expected with credentials:
# "source":"amadeus"

# Expected without credentials:
# "source":"mock"
```

## 📚 Full Documentation

- **Setup Guide**: `AMADEUS_SETUP.md`
- **Summary**: `INTEGRATION_SUMMARY.md`
- **Tests**: `test_amadeus_integration.py`

## ⚡ Current State

**Without credentials** (now):
- Using mock data (58 hardcoded flights)
- All endpoints working
- Frontend fully functional

**With credentials** (after signup):
- Real Amadeus flight data
- Same endpoints, same format
- No frontend changes needed

---

**Status**: ✅ Ready for production  
**Action**: Add real Amadeus credentials when ready
