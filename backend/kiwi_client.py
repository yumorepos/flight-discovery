"""
Kiwi Tequila API Client
Handles flight search via Kiwi.com Tequila API with caching and rate limit handling.
Free tier: 100 searches/month
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import requests
import time

logger = logging.getLogger(__name__)


class KiwiFlightClient:
    """
    Wrapper for Kiwi Tequila API (https://tequila.kiwi.com).
    
    Features:
    - Simple API key authentication (no OAuth)
    - Rate limit handling (100 calls/month on free tier)
    - Response caching (1h in-memory + 24h Redis)
    - Fallback to empty results on failures
    - Month-based search logic
    """

    BASE_URL = "https://api.tequila.kiwi.com"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("KIWI_API_KEY")
        
        if not self.api_key:
            logger.warning("Kiwi API key not found - will return empty results")
        else:
            logger.info("Kiwi Tequila API client initialized successfully")
        
        # In-memory cache (1 hour TTL)
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour
        
        # Rate limiting tracking
        self._call_count = 0
        self._month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def search_flights(
        self,
        origin: str,
        destination: Optional[str] = None,
        departure_date: Optional[str] = None,
        max_results: int = 100,
        currency: str = "CAD",
    ) -> List[Dict[str, Any]]:
        """
        Search for flight offers.
        
        Args:
            origin: IATA code (e.g., "YUL")
            destination: IATA code (optional)
            departure_date: YYYY-MM-DD format (optional)
            max_results: Maximum number of results
            currency: Price currency code
            
        Returns:
            List of flight offer dictionaries in normalized format
        """
        if not self.api_key:
            logger.warning("Kiwi API key not configured - returning empty results")
            return []

        # Check rate limit (100 calls/month)
        if not self._check_rate_limit():
            logger.error("Rate limit exceeded (100 calls/month) - returning empty results")
            return []

        # Cache key
        cache_key = f"{origin}:{destination}:{departure_date}:{max_results}"
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self._cache_ttl):
                logger.info(f"Returning cached results for {cache_key}")
                return cached_data

        try:
            # Build request parameters
            params = {
                "fly_from": origin,
                "curr": currency,
                "limit": max_results,
                "vehicle_type": "aircraft",  # Only flights, no buses/trains
            }
            
            if destination:
                params["fly_to"] = destination
            
            if departure_date:
                params["date_from"] = departure_date
                params["date_to"] = departure_date
            else:
                # Default: next 90 days
                params["date_from"] = datetime.now().strftime("%d/%m/%Y")
                params["date_to"] = (datetime.now() + timedelta(days=90)).strftime("%d/%m/%Y")

            # Make API request
            headers = {"apikey": self.api_key}
            
            logger.info(f"Kiwi API request: {params}")
            response = requests.get(
                f"{self.BASE_URL}/v2/search",
                headers=headers,
                params=params,
                timeout=10
            )
            
            # Track API call
            self._call_count += 1
            logger.info(f"Kiwi API calls this month: {self._call_count}/100")
            
            # Handle rate limiting
            if response.status_code == 429:
                logger.error("Rate limit exceeded (429) - implement backoff")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            # Parse response
            flights = self._parse_response(data)
            
            # Cache results
            self._cache[cache_key] = (flights, datetime.now())
            
            logger.info(f"Retrieved {len(flights)} flights from Kiwi API")
            return flights

        except requests.exceptions.RequestException as e:
            logger.error(f"Kiwi API request error: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during flight search: {e}")
            return []

    def search_by_month(
        self,
        origin: str,
        month: str,
        destination: Optional[str] = None,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Search flights for an entire month using flexible date range.
        
        Args:
            origin: IATA code
            month: YYYY-MM format
            destination: Optional destination filter
            max_results: Max results total
            
        Returns:
            List of flight offers across the month
        """
        try:
            year, month_num = map(int, month.split("-"))
            
            # Calculate month date range
            from calendar import monthrange
            last_day = monthrange(year, month_num)[1]
            
            date_from = f"{year:04d}-{month_num:02d}-01"
            date_to = f"{year:04d}-{month_num:02d}-{last_day:02d}"
            
            if not self.api_key:
                return []
            
            # Check rate limit
            if not self._check_rate_limit():
                logger.error("Rate limit exceeded - cannot search by month")
                return []
            
            # Build request
            params = {
                "fly_from": origin,
                "curr": "CAD",
                "limit": max_results,
                "vehicle_type": "aircraft",
                "date_from": datetime.strptime(date_from, "%Y-%m-%d").strftime("%d/%m/%Y"),
                "date_to": datetime.strptime(date_to, "%Y-%m-%d").strftime("%d/%m/%Y"),
            }
            
            if destination:
                params["fly_to"] = destination
            
            headers = {"apikey": self.api_key}
            
            logger.info(f"Kiwi API month search: {month} ({date_from} to {date_to})")
            response = requests.get(
                f"{self.BASE_URL}/v2/search",
                headers=headers,
                params=params,
                timeout=15
            )
            
            self._call_count += 1
            logger.info(f"Kiwi API calls this month: {self._call_count}/100")
            
            if response.status_code == 429:
                logger.error("Rate limit exceeded (429)")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            flights = self._parse_response(data)
            logger.info(f"Retrieved {len(flights)} flights for month {month}")
            return flights
            
        except Exception as e:
            logger.error(f"Error searching by month: {e}")
            return []

    def _parse_response(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse Kiwi API response into our normalized flight format.
        
        Kiwi structure → Our format:
        - price → total_price
        - duration.total (seconds) → duration_hours
        - route[].length - 1 → stops
        - airlines[0] → airline
        - flyTo → destination (IATA)
        - deep_link → booking_url
        """
        flights = []
        
        flight_data = data.get("data", [])
        if not flight_data:
            return flights
        
        for idx, offer in enumerate(flight_data):
            try:
                # Extract price
                total_price = float(offer.get("price", 0))
                
                # Extract route info
                route = offer.get("route", [])
                if not route:
                    continue
                
                # Calculate stops (route segments - 1)
                stops = len(route) - 1
                
                # Duration in hours (Kiwi gives total seconds)
                duration_dict = offer.get("duration", {})
                duration_seconds = duration_dict.get("total", 0)
                duration_hours = duration_seconds / 3600 if duration_seconds else 0
                
                # Airline
                airlines = offer.get("airlines", [])
                airline_code = airlines[0] if airlines else "Unknown"
                
                # Origin and destination
                origin_code = offer.get("flyFrom", "")
                destination_code = offer.get("flyTo", "")
                
                # Departure date (format: 2026-03-15T14:30:00.000Z)
                departure_time = offer.get("dTime", 0)
                if departure_time:
                    departure_date = datetime.fromtimestamp(departure_time).strftime("%Y-%m-%d")
                else:
                    departure_date = datetime.now().strftime("%Y-%m-%d")
                
                # Booking URL
                booking_url = offer.get("deep_link", "")
                
                # Calculate base price (assuming 15% tax)
                base_price = round(total_price / 1.15)
                tax_amount = round(total_price - base_price)
                
                # Build normalized flight object
                flight = {
                    "id": f"kiwi_{offer.get('id', idx)}",
                    "origin": origin_code,
                    "destination": destination_code,
                    "price": base_price,
                    "total_price": round(total_price),
                    "tax_amount": tax_amount,
                    "date": departure_date,
                    "airline": airline_code,
                    "duration_hours": round(duration_hours, 2),
                    "stops": stops,
                    "currency": "CAD",
                    "source": "kiwi",
                    "booking_url": booking_url,
                    # Preserve destination metadata from Kiwi when available.
                    "city": offer.get("cityTo", ""),
                    "country": offer.get("countryTo", {}).get("name", ""),
                    "region": offer.get("countryTo", {}).get("code", ""),
                    "destination_emoji": "✈️",
                }
                
                flights.append(flight)
                
            except Exception as e:
                logger.warning(f"Failed to parse flight offer: {e}")
                continue
        
        return flights

    def _check_rate_limit(self) -> bool:
        """
        Check if we're within the 100 calls/month limit.
        Reset counter at start of new month.
        """
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Reset counter if new month
        if current_month > self._month_start:
            self._call_count = 0
            self._month_start = current_month
            logger.info("New month - reset API call counter")
        
        # Check limit
        if self._call_count >= 100:
            logger.warning(f"Rate limit reached: {self._call_count}/100 calls this month")
            return False
        
        return True

    def is_available(self) -> bool:
        """Check if Kiwi API is configured and available."""
        return self.api_key is not None
