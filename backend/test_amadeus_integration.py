"""
Test script for Amadeus API integration
Run: python test_amadeus_integration.py
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def run_endpoint_check(name: str, url: str):
    """Test a single API endpoint."""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Results: {len(data) if isinstance(data, list) else 'N/A'}")
        
        if isinstance(data, list) and len(data) > 0:
            sample = data[0]
            print(f"\n📋 Sample Flight:")
            print(f"   ID: {sample.get('id')}")
            print(f"   Route: {sample.get('origin')} → {sample.get('destination')} ({sample.get('city')})")
            print(f"   Price: ${sample.get('price')} + ${sample.get('tax_amount')} tax = ${sample.get('total_price')}")
            print(f"   Date: {sample.get('date')}")
            print(f"   Airline: {sample.get('airline')}")
            print(f"   Duration: {sample.get('duration')} ({sample.get('duration_hours')}h)")
            print(f"   Stops: {sample.get('stops')}")
            print(f"   Value Score: {sample.get('value_score')}/100")
            print(f"   Deal: {sample.get('deal_classification')} ({sample.get('deal_score')}/100)")
            print(f"   Source: {sample.get('source', 'mock')}")
            
            # Check if data is from Amadeus or mock
            source = sample.get('source', 'mock')
            if source == 'amadeus':
                print(f"\n🎯 Using REAL Amadeus API data!")
            else:
                print(f"\n🧪 Using mock data (Amadeus not available)")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Cannot connect to backend")
        print(f"   Make sure the server is running: uvicorn main:app --reload")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Error: Request timeout")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"   Response: {e.response.text}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def main():
    print("\n🚀 Amadeus API Integration Test Suite")
    print("="*60)
    
    tests = [
        ("Search by Origin + Month", f"{BASE_URL}/api/search?origin=YUL&month=2026-03"),
        ("Search by Origin + Destination", f"{BASE_URL}/api/search?origin=YUL&destination=CDG"),
        ("Search by Origin + Month + Destination", f"{BASE_URL}/api/search?origin=YUL&month=2026-04&destination=NRT"),
        ("Search Different Origin (JFK)", f"{BASE_URL}/api/search?origin=JFK&month=2026-03"),
        ("Top Deals", f"{BASE_URL}/api/top-deals?origin=YUL&limit=5"),
        ("Available Airports", f"{BASE_URL}/api/airports"),
        ("Destinations from YUL", f"{BASE_URL}/api/destinations?origin=YUL"),
    ]
    
    results = []
    for name, url in tests:
        success = run_endpoint_check(name, url)
        results.append((name, success))
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 Test Summary")
    print(f"{'='*60}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        print("\n📋 Next Steps:")
        print("   1. Check server logs for 'Amadeus API available: True'")
        print("   2. If using mock data, add real credentials to .env")
        print("   3. See AMADEUS_SETUP.md for setup instructions")
    else:
        print("\n⚠️  Some tests failed - check errors above")
        sys.exit(1)


if __name__ == "__main__":
    main()
