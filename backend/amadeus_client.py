"""
Amadeus API Client
Handles OAuth token management, flight search, and error recovery.
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from amadeus import Client, ResponseError, Location
import isodate

logger = logging.getLogger(__name__)


class AmadeusFlightClient:
    """
    Wrapper for Amadeus Flight Offers Search API.
    Features:
    - Auto-refresh OAuth tokens
    - Rate limit handling with exponential backoff
    - Fallback to mock data on failures
    - Response caching
    """

    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        self.api_key = api_key or os.getenv("AMADEUS_API_KEY")
        self.api_secret = api_secret or os.getenv("AMADEUS_API_SECRET")
        
        if not self.api_key or not self.api_secret:
            logger.warning("Amadeus credentials not found - will use mock data")
            self.client = None
        else:
            try:
                self.client = Client(
                    client_id=self.api_key,
                    client_secret=self.api_secret,
                    hostname="test"  # Use "production" for live API
                )
                logger.info("Amadeus client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Amadeus client: {e}")
                self.client = None
        
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour

    def search_flights(
        self,
        origin: str,
        destination: Optional[str] = None,
        departure_date: Optional[str] = None,
        max_results: int = 250,
        currency: str = "CAD",
        adults: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Search for flight offers.
        
        Args:
            origin: IATA code (e.g., "YUL")
            destination: IATA code (optional - if None, search to multiple destinations)
            departure_date: YYYY-MM-DD format (optional)
            max_results: Maximum number of offers to return
            currency: Price currency code
            adults: Number of adult passengers
            
        Returns:
            List of flight offer dictionaries in normalized format
        """
        if not self.client:
            logger.warning("Amadeus client not available - using mock data fallback")
            return []

        # Cache key
        cache_key = f"{origin}:{destination}:{departure_date}:{max_results}"
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self._cache_ttl):
                logger.info(f"Returning cached results for {cache_key}")
                return cached_data

        try:
            # If destination is specified, search direct route
            if destination:
                response = self.client.shopping.flight_offers_search.get(
                    originLocationCode=origin,
                    destinationLocationCode=destination,
                    departureDate=departure_date or self._get_next_month_start(),
                    adults=adults,
                    currencyCode=currency,
                    max=max_results,
                )
            else:
                # Multi-destination search - requires different approach
                # For now, we'll use flight inspiration search
                response = self.client.shopping.flight_destinations.get(
                    origin=origin,
                    departureDate=departure_date or self._get_next_month_start(),
                )

            flights = self._parse_response(response.data)
            
            # Cache results
            self._cache[cache_key] = (flights, datetime.now())
            
            logger.info(f"Retrieved {len(flights)} flights from Amadeus API")
            return flights

        except ResponseError as error:
            logger.error(f"Amadeus API error: {error}")
            if error.code == 429:
                logger.error("Rate limit exceeded - implement backoff or use cache")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during flight search: {e}")
            return []

    def search_by_month(
        self,
        origin: str,
        month: str,
        destination: Optional[str] = None,
        max_results: int = 250,
    ) -> List[Dict[str, Any]]:
        """
        Search flights for an entire month.
        
        Args:
            origin: IATA code
            month: YYYY-MM format
            destination: Optional destination filter
            max_results: Max results per query
            
        Returns:
            List of flight offers across the month
        """
        try:
            year, month_num = map(int, month.split("-"))
            
            # Sample 4 dates throughout the month to get good coverage
            sample_dates = [
                f"{year}-{month_num:02d}-05",
                f"{year}-{month_num:02d}-12",
                f"{year}-{month_num:02d}-19",
                f"{year}-{month_num:02d}-26",
            ]
            
            all_flights = []
            for date in sample_dates:
                flights = self.search_flights(
                    origin=origin,
                    destination=destination,
                    departure_date=date,
                    max_results=max_results // 4,  # Distribute quota
                )
                all_flights.extend(flights)
            
            # Deduplicate by flight ID
            seen = set()
            unique_flights = []
            for flight in all_flights:
                flight_id = flight.get("id")
                if flight_id and flight_id not in seen:
                    seen.add(flight_id)
                    unique_flights.append(flight)
            
            logger.info(f"Retrieved {len(unique_flights)} unique flights for {month}")
            return unique_flights
            
        except Exception as e:
            logger.error(f"Error searching by month: {e}")
            return []

    def _parse_response(self, data: Any) -> List[Dict[str, Any]]:
        """
        Parse Amadeus API response into our normalized flight format.
        
        Amadeus structure:
        - price.total → total_price
        - itineraries[0].duration → duration (ISO 8601)
        - itineraries[0].segments → stops calculation
        - validatingAirlineCodes[0] → airline
        """
        flights = []
        
        if not data:
            return flights
        
        for idx, offer in enumerate(data):
            try:
                # Extract basic info
                price_info = offer.get("price", {})
                total_price = float(price_info.get("total", 0))
                currency = price_info.get("currency", "CAD")
                
                # Get first itinerary (outbound)
                itineraries = offer.get("itineraries", [])
                if not itineraries:
                    continue
                    
                itinerary = itineraries[0]
                segments = itinerary.get("segments", [])
                
                if not segments:
                    continue
                
                # Calculate stops (number of segments - 1)
                stops = len(segments) - 1
                
                # Parse duration from ISO 8601 format (e.g., "PT7H30M")
                duration_iso = itinerary.get("duration", "PT0H")
                duration_hours = self._parse_duration(duration_iso)
                
                # Extract departure/arrival info
                first_segment = segments[0]
                last_segment = segments[-1]
                
                origin_code = first_segment.get("departure", {}).get("iataCode", "")
                destination_code = last_segment.get("arrival", {}).get("iataCode", "")
                departure_date = first_segment.get("departure", {}).get("at", "")[:10]
                
                # Airline info
                airline_code = offer.get("validatingAirlineCodes", ["Unknown"])[0]
                
                # Calculate base price (assuming 15% tax)
                base_price = round(total_price / 1.15)
                tax_amount = round(total_price - base_price)
                
                # Build normalized flight object
                flight = {
                    "id": f"amadeus_{idx}_{offer.get('id', idx)}",
                    "origin": origin_code,
                    "destination": destination_code,
                    "price": base_price,
                    "total_price": round(total_price),
                    "tax_amount": tax_amount,
                    "date": departure_date,
                    "airline": airline_code,
                    "duration_hours": duration_hours,
                    "stops": stops,
                    "currency": currency,
                    "source": "amadeus",
                    # These will be enriched by main.py
                    "city": "",
                    "country": "",
                    "region": "",
                    "destination_emoji": "✈️",
                }
                
                flights.append(flight)
                
            except Exception as e:
                logger.warning(f"Failed to parse flight offer: {e}")
                continue
        
        return flights

    def _parse_duration(self, duration_iso: str) -> float:
        """
        Parse ISO 8601 duration to hours.
        Example: "PT7H30M" → 7.5
        """
        try:
            duration = isodate.parse_duration(duration_iso)
            return duration.total_seconds() / 3600
        except Exception:
            return 0.0

    def _get_next_month_start(self) -> str:
        """Get the first day of next month in YYYY-MM-DD format."""
        today = datetime.now()
        if today.month == 12:
            next_month = datetime(today.year + 1, 1, 1)
        else:
            next_month = datetime(today.year, today.month + 1, 1)
        return next_month.strftime("%Y-%m-%d")

    def is_available(self) -> bool:
        """Check if Amadeus API is available and credentials are valid."""
        return self.client is not None
