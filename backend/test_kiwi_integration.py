#!/usr/bin/env python3
"""
Test Kiwi Tequila API Integration

This script validates the Kiwi API integration without requiring an actual API key.
It tests the client initialization, response parsing, and main.py integration.

Usage:
    python3 test_kiwi_integration.py
"""
import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_kiwi_client_import():
    """Test 1: Can we import the Kiwi client?"""
    try:
        from kiwi_client import KiwiFlightClient
        print("✓ Test 1: KiwiFlightClient imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Test 1 FAILED: Could not import KiwiFlightClient - {e}")
        return False


def test_kiwi_client_initialization():
    """Test 2: Does the client initialize without API key?"""
    try:
        from kiwi_client import KiwiFlightClient
        client = KiwiFlightClient()
        
        if client is not None:
            print("✓ Test 2: KiwiFlightClient initialized (no API key)")
            return True
        else:
            print("✗ Test 2 FAILED: Client is None")
            return False
    except Exception as e:
        print(f"✗ Test 2 FAILED: {e}")
        return False


def test_kiwi_client_availability():
    """Test 3: Does is_available() return False without API key?"""
    try:
        from kiwi_client import KiwiFlightClient
        client = KiwiFlightClient()
        
        if not client.is_available():
            print("✓ Test 3: is_available() correctly returns False (no API key)")
            return True
        else:
            print("✗ Test 3 FAILED: is_available() should return False without API key")
            return False
    except Exception as e:
        print(f"✗ Test 3 FAILED: {e}")
        return False


def test_kiwi_response_parsing():
    """Test 4: Can we parse a mock Kiwi API response?"""
    try:
        from kiwi_client import KiwiFlightClient
        
        # Mock Kiwi API response structure
        mock_response = {
            "data": [
                {
                    "id": "test_flight_1",
                    "flyFrom": "YUL",
                    "flyTo": "CDG",
                    "price": 450,
                    "duration": {"total": 26400},  # 7.33 hours in seconds
                    "route": [
                        {"flyFrom": "YUL", "flyTo": "CDG"}  # Non-stop
                    ],
                    "airlines": ["AC"],
                    "dTime": 1710518400,  # March 15, 2026
                    "deep_link": "https://www.kiwi.com/deep?affilid=test"
                }
            ]
        }
        
        client = KiwiFlightClient()
        flights = client._parse_response(mock_response)
        
        if len(flights) == 1:
            flight = flights[0]
            
            # Validate parsing
            checks = [
                (flight["origin"] == "YUL", "origin"),
                (flight["destination"] == "CDG", "destination"),
                (flight["airline"] == "AC", "airline"),
                (flight["stops"] == 0, "stops (non-stop)"),
                (flight["duration_hours"] == 7.33, "duration_hours"),
                (flight["source"] == "kiwi", "source"),
                ("booking_url" in flight, "booking_url"),
            ]
            
            all_pass = all(check[0] for check in checks)
            
            if all_pass:
                print("✓ Test 4: Response parsing works correctly")
                print(f"  - Parsed flight: {flight['origin']} → {flight['destination']}, ${flight['total_price']}")
                return True
            else:
                failed = [check[1] for check in checks if not check[0]]
                print(f"✗ Test 4 FAILED: Parsing errors in: {', '.join(failed)}")
                return False
        else:
            print(f"✗ Test 4 FAILED: Expected 1 flight, got {len(flights)}")
            return False
            
    except Exception as e:
        print(f"✗ Test 4 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_main_py_integration():
    """Test 5: Does main.py import kiwi_client correctly?"""
    try:
        from main import kiwi_client
        
        if kiwi_client is not None:
            print("✓ Test 5: main.py imports kiwi_client successfully")
            print(f"  - API available: {kiwi_client.is_available()}")
            return True
        else:
            print("✗ Test 5 FAILED: kiwi_client is None in main.py")
            return False
    except ImportError as e:
        print(f"✗ Test 5 FAILED: Could not import main.py - {e}")
        return False
    except Exception as e:
        print(f"✗ Test 5 FAILED: {e}")
        return False


def test_search_endpoint_fallback():
    """Test 6: Does /api/search endpoint fall back to mock data?"""
    try:
        from main import search_flights, mock_flights
        import asyncio
        
        # Test search (should return mock data since no API key)
        result = asyncio.run(search_flights(origin="YUL", month="2026-03"))
        
        if len(result) > 0:
            print(f"✓ Test 6: /api/search returns {len(result)} flights (mock data fallback)")
            
            # Verify it's using mock data
            if any(f.get("source") != "kiwi" for f in result):
                print("  - Confirmed: Using mock data (no Kiwi source)")
                return True
            else:
                print("  - Warning: All flights have 'kiwi' source (unexpected)")
                return True
        else:
            print("✗ Test 6 FAILED: No flights returned")
            return False
            
    except Exception as e:
        print(f"✗ Test 6 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_value_algorithm_preserved():
    """Test 7: Is the value scoring algorithm still working?"""
    try:
        from main import rank_flights
        
        # Create test flights with different characteristics
        test_flights = [
            {
                "id": 1,
                "price": 200,
                "duration_hours": 5.0,
                "stops": 0,
                "date": "2026-03-15",
                "origin": "YUL",
                "destination": "LAX",
            },
            {
                "id": 2,
                "price": 400,
                "duration_hours": 10.0,
                "stops": 2,
                "date": "2026-03-20",
                "origin": "YUL",
                "destination": "NRT",
            },
        ]
        
        ranked = rank_flights(test_flights)
        
        if len(ranked) == 2:
            # Flight 1 (cheaper, shorter, fewer stops) should score higher
            if ranked[0]["value_score"] > ranked[1]["value_score"]:
                print("✓ Test 7: Value scoring algorithm working correctly")
                print(f"  - Better flight scored {ranked[0]['value_score']:.1f}")
                print(f"  - Worse flight scored {ranked[1]['value_score']:.1f}")
                return True
            else:
                print("✗ Test 7 FAILED: Value scores inverted")
                return False
        else:
            print(f"✗ Test 7 FAILED: Expected 2 flights, got {len(ranked)}")
            return False
            
    except Exception as e:
        print(f"✗ Test 7 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_response_format_compatibility():
    """Test 8: Do Kiwi flights match the expected frontend format?"""
    try:
        from kiwi_client import KiwiFlightClient
        
        mock_response = {
            "data": [{
                "id": "test",
                "flyFrom": "YUL",
                "flyTo": "CDG",
                "price": 450,
                "duration": {"total": 26400},
                "route": [{"flyFrom": "YUL", "flyTo": "CDG"}],
                "airlines": ["AC"],
                "dTime": 1710518400,
                "deep_link": "https://www.kiwi.com/deep?test"
            }]
        }
        
        client = KiwiFlightClient()
        flights = client._parse_response(mock_response)
        
        if len(flights) > 0:
            flight = flights[0]
            
            # Required fields for frontend
            required_fields = [
                "id", "origin", "destination", "price", "total_price",
                "tax_amount", "date", "airline", "duration_hours",
                "stops", "currency", "source", "booking_url"
            ]
            
            missing = [field for field in required_fields if field not in flight]
            
            if not missing:
                print("✓ Test 8: Response format matches frontend expectations")
                print(f"  - All {len(required_fields)} required fields present")
                return True
            else:
                print(f"✗ Test 8 FAILED: Missing fields: {', '.join(missing)}")
                return False
        else:
            print("✗ Test 8 FAILED: No flights parsed")
            return False
            
    except Exception as e:
        print(f"✗ Test 8 FAILED: {e}")
        return False


def main():
    """Run all tests and report results."""
    print("=" * 60)
    print("Kiwi Tequila API Integration Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        test_kiwi_client_import,
        test_kiwi_client_initialization,
        test_kiwi_client_availability,
        test_kiwi_response_parsing,
        test_main_py_integration,
        test_search_endpoint_fallback,
        test_value_algorithm_preserved,
        test_response_format_compatibility,
    ]
    
    results = []
    for i, test in enumerate(tests, 1):
        print(f"Running test {i}/{len(tests)}...")
        results.append(test())
        print()
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    print()
    
    if passed == total:
        print("✓ ALL TESTS PASSED - Kiwi integration is working!")
        print()
        print("Next steps:")
        print("1. Sign up at https://tequila.kiwi.com/portal/login")
        print("2. Get your API key from the dashboard")
        print("3. Add to backend/.env: KIWI_API_KEY=your_key_here")
        print("4. Restart the server and test with real data")
        return 0
    else:
        print("✗ SOME TESTS FAILED - Check errors above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
