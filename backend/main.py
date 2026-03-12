from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import date, datetime
import json
import redis
import logging
from dotenv import load_dotenv
from kiwi_client import KiwiFlightClient

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Flight Discovery API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis (optional - skip if not running)
try:
    redis_client = redis.Redis(host="localhost", port=6379, db=0, socket_connect_timeout=1)
    redis_client.ping()
except Exception:
    redis_client = None

# Initialize Kiwi client
kiwi_client = KiwiFlightClient()
logger.info(f"Kiwi API available: {kiwi_client.is_available()}")

# Airport definitions
AIRPORTS = {
    "YUL": {"city": "Montreal", "country": "Canada", "region": "NA", "emoji": "🍁"},
    "YYZ": {"city": "Toronto", "country": "Canada", "region": "NA", "emoji": "🍁"},
    "YVR": {"city": "Vancouver", "country": "Canada", "region": "NA", "emoji": "🍁"},
    "JFK": {"city": "New York", "country": "USA", "region": "NA", "emoji": "🗽"},
    "LAX": {"city": "Los Angeles", "country": "USA", "region": "NA", "emoji": "🎬"},
    "ORD": {"city": "Chicago", "country": "USA", "region": "NA", "emoji": "🌆"},
    "MIA": {"city": "Miami", "country": "USA", "region": "NA", "emoji": "🌴"},
    "HNL": {"city": "Honolulu", "country": "USA", "region": "NA", "emoji": "🌺"},
    "CUN": {"city": "Cancún", "country": "Mexico", "region": "NA", "emoji": "🏖️"},
    "MEX": {"city": "Mexico City", "country": "Mexico", "region": "NA", "emoji": "🏛️"},
    "LHR": {"city": "London", "country": "UK", "region": "EU", "emoji": "🎡"},
    "CDG": {"city": "Paris", "country": "France", "region": "EU", "emoji": "🗼"},
    "FRA": {"city": "Frankfurt", "country": "Germany", "region": "EU", "emoji": "🏰"},
    "AMS": {"city": "Amsterdam", "country": "Netherlands", "region": "EU", "emoji": "🌷"},
    "MAD": {"city": "Madrid", "country": "Spain", "region": "EU", "emoji": "🎭"},
    "FCO": {"city": "Rome", "country": "Italy", "region": "EU", "emoji": "🏛️"},
    "BCN": {"city": "Barcelona", "country": "Spain", "region": "EU", "emoji": "⛪"},
    "ZRH": {"city": "Zurich", "country": "Switzerland", "region": "EU", "emoji": "🏔️"},
    "NRT": {"city": "Tokyo", "country": "Japan", "region": "Asia", "emoji": "🗾"},
    "ICN": {"city": "Seoul", "country": "South Korea", "region": "Asia", "emoji": "🏙️"},
    "HKG": {"city": "Hong Kong", "country": "China", "region": "Asia", "emoji": "🌆"},
    "SIN": {"city": "Singapore", "country": "Singapore", "region": "Asia", "emoji": "🦁"},
    "BKK": {"city": "Bangkok", "country": "Thailand", "region": "Asia", "emoji": "🛕"},
    "DXB": {"city": "Dubai", "country": "UAE", "region": "Asia", "emoji": "🏙️"},
    "DEL": {"city": "Delhi", "country": "India", "region": "Asia", "emoji": "🕌"},
    "KUL": {"city": "Kuala Lumpur", "country": "Malaysia", "region": "Asia", "emoji": "🗼"},
    "SYD": {"city": "Sydney", "country": "Australia", "region": "Oceania", "emoji": "🦘"},
    "MEL": {"city": "Melbourne", "country": "Australia", "region": "Oceania", "emoji": "🏏"},
    "AKL": {"city": "Auckland", "country": "New Zealand", "region": "Oceania", "emoji": "🥝"},
    "JNB": {"city": "Johannesburg", "country": "South Africa", "region": "AF", "emoji": "🦁"},
    "CPT": {"city": "Cape Town", "country": "South Africa", "region": "AF", "emoji": "🏔️"},
    "NBO": {"city": "Nairobi", "country": "Kenya", "region": "AF", "emoji": "🦒"},
    "GRU": {"city": "São Paulo", "country": "Brazil", "region": "SA", "emoji": "🌿"},
    "EZE": {"city": "Buenos Aires", "country": "Argentina", "region": "SA", "emoji": "💃"},
    "BOG": {"city": "Bogotá", "country": "Colombia", "region": "SA", "emoji": "☕"},
    "SCL": {"city": "Santiago", "country": "Chile", "region": "SA", "emoji": "🏔️"},
    "LIM": {"city": "Lima", "country": "Peru", "region": "SA", "emoji": "🦙"},
}

# Origin airports supported (for the dropdown)
ORIGIN_AIRPORTS = ["YUL", "YYZ", "YVR", "JFK", "LAX", "ORD", "LHR", "CDG"]


REGION_QUERY_TO_CODE = {
    "europe": "EU",
    "asia": "Asia",
    "americas": "NA",
    "north america": "NA",
    "south america": "SA",
    "africa": "AF",
    "oceania": "Oceania",
}


def _matches_destination_query(flight: dict, destination_query: Optional[str]) -> bool:
    if not destination_query:
        return True

    query = destination_query.strip().lower()
    if not query or query == "anywhere":
        return True

    if len(query) == 3 and query.upper() in AIRPORTS:
        return flight.get("destination") == query.upper()

    if query in REGION_QUERY_TO_CODE:
        return flight.get("region") == REGION_QUERY_TO_CODE[query]

    if query == "beach":
        beach_codes = {"CUN", "MIA", "HNL", "SYD", "BCN", "LIM"}
        return flight.get("destination") in beach_codes

    city = str(flight.get("city", "")).lower()
    country = str(flight.get("country", "")).lower()
    return query in city or query in country

# Duration placeholders (hours) per route distance
ROUTE_DURATIONS = {
    # Short-haul
    ("YUL", "JFK"): "1h 30m",
    ("YUL", "MIA"): "3h 15m",
    ("YUL", "CUN"): "4h 30m",
    ("YUL", "ORD"): "2h 15m",
    # Medium-haul
    ("YUL", "LAX"): "5h 45m",
    ("YUL", "CDG"): "7h 20m",
    ("YUL", "LHR"): "7h 00m",
    ("YUL", "FRA"): "7h 45m",
    ("YUL", "AMS"): "7h 30m",
    ("YUL", "MAD"): "8h 10m",
    ("YUL", "FCO"): "8h 30m",
    ("YUL", "BCN"): "8h 20m",
    ("YUL", "ZRH"): "7h 55m",
    # Long-haul
    ("YUL", "NRT"): "13h 30m",
    ("YUL", "ICN"): "13h 45m",
    ("YUL", "HKG"): "14h 30m",
    ("YUL", "SIN"): "16h 00m",
    ("YUL", "BKK"): "16h 45m",
    ("YUL", "DXB"): "11h 30m",
    ("YUL", "DEL"): "13h 00m",
    ("YUL", "SYD"): "20h 30m",
    ("YUL", "AKL"): "21h 00m",
    ("YUL", "JNB"): "16h 00m",
    ("YUL", "GRU"): "9h 30m",
    ("YUL", "EZE"): "11h 00m",
    ("JFK", "LHR"): "7h 00m",
    ("JFK", "CDG"): "7h 30m",
    ("JFK", "FRA"): "8h 00m",
    ("JFK", "NRT"): "14h 00m",
    ("JFK", "LAX"): "6h 00m",
    ("LAX", "NRT"): "11h 30m",
    ("LAX", "SYD"): "15h 00m",
    ("LAX", "EZE"): "13h 00m",
    ("LAX", "LHR"): "10h 30m",
    ("LHR", "DXB"): "7h 00m",
    ("LHR", "SIN"): "12h 45m",
    ("LHR", "NRT"): "11h 30m",
    ("CDG", "NRT"): "12h 30m",
    ("CDG", "SIN"): "12h 00m",
}

def get_duration(origin: str, destination: str) -> str:
    key = (origin, destination)
    if key in ROUTE_DURATIONS:
        return ROUTE_DURATIONS[key]
    # Estimate based on region
    dest_info = AIRPORTS.get(destination, {})
    orig_info = AIRPORTS.get(origin, {})
    if dest_info.get("region") == orig_info.get("region"):
        return "3h 00m"
    elif dest_info.get("region") in ["EU", "NA"]:
        return "8h 00m"
    elif dest_info.get("region") in ["Asia", "Oceania"]:
        return "14h 00m"
    else:
        return "10h 00m"

# Mock flight data - 58 flights across March-August 2026
# Duration in hours (float), stops: 0 (nonstop), 1, or 2+
_raw_flights = [
    # YUL -> Various (March)
    {"id": 1, "origin": "YUL", "destination": "JFK", "price": 189, "date": "2026-03-15", "airline": "Air Canada", "duration_hours": 1.5, "stops": 0},
    {"id": 2, "origin": "YUL", "destination": "LAX", "price": 329, "date": "2026-03-20", "airline": "United", "duration_hours": 5.75, "stops": 0},
    {"id": 3, "origin": "YUL", "destination": "CDG", "price": 419, "date": "2026-03-22", "airline": "Air Canada", "duration_hours": 7.33, "stops": 0},
    {"id": 4, "origin": "YUL", "destination": "LHR", "price": 389, "date": "2026-03-18", "airline": "British Airways", "duration_hours": 7.0, "stops": 0},
    {"id": 5, "origin": "YUL", "destination": "NRT", "price": 749, "date": "2026-03-25", "airline": "Air Canada", "duration_hours": 13.5, "stops": 0},
    {"id": 6, "origin": "YUL", "destination": "AKL", "price": 1099, "date": "2026-03-28", "airline": "Air New Zealand", "duration_hours": 21.0, "stops": 1},
    {"id": 7, "origin": "YUL", "destination": "JNB", "price": 879, "date": "2026-03-22", "airline": "South African Airways", "duration_hours": 16.0, "stops": 1},
    {"id": 8, "origin": "YUL", "destination": "CUN", "price": 299, "date": "2026-03-19", "airline": "WestJet", "duration_hours": 4.5, "stops": 0},
    {"id": 9, "origin": "YUL", "destination": "BCN", "price": 459, "date": "2026-03-30", "airline": "Iberia", "duration_hours": 8.33, "stops": 1},
    {"id": 10, "origin": "YUL", "destination": "DXB", "price": 599, "date": "2026-03-16", "airline": "Emirates", "duration_hours": 11.5, "stops": 1},
    # YUL -> Various (April)
    {"id": 11, "origin": "YUL", "destination": "JFK", "price": 209, "date": "2026-04-10", "airline": "WestJet", "duration_hours": 1.5, "stops": 0},
    {"id": 12, "origin": "YUL", "destination": "LAX", "price": 349, "date": "2026-04-18", "airline": "Air Canada", "duration_hours": 5.75, "stops": 0},
    {"id": 13, "origin": "YUL", "destination": "CDG", "price": 439, "date": "2026-04-22", "airline": "Air France", "duration_hours": 7.33, "stops": 0},
    {"id": 14, "origin": "YUL", "destination": "FCO", "price": 469, "date": "2026-04-14", "airline": "Air Canada", "duration_hours": 8.5, "stops": 1},
    {"id": 15, "origin": "YUL", "destination": "SIN", "price": 899, "date": "2026-04-20", "airline": "Singapore Airlines", "duration_hours": 16.0, "stops": 1},
    {"id": 16, "origin": "YUL", "destination": "AKL", "price": 1149, "date": "2026-04-25", "airline": "Air New Zealand", "duration_hours": 21.0, "stops": 1},
    {"id": 17, "origin": "YUL", "destination": "GRU", "price": 649, "date": "2026-04-12", "airline": "LATAM", "duration_hours": 9.5, "stops": 0},
    {"id": 18, "origin": "YUL", "destination": "FRA", "price": 399, "date": "2026-04-08", "airline": "Lufthansa", "duration_hours": 7.75, "stops": 0},
    {"id": 19, "origin": "YUL", "destination": "MIA", "price": 249, "date": "2026-04-05", "airline": "Air Canada", "duration_hours": 3.25, "stops": 0},
    {"id": 20, "origin": "YUL", "destination": "BKK", "price": 819, "date": "2026-04-28", "airline": "Thai Airways", "duration_hours": 16.75, "stops": 1},
    # YUL -> Various (May)
    {"id": 21, "origin": "YUL", "destination": "AMS", "price": 429, "date": "2026-05-05", "airline": "KLM", "duration_hours": 7.5, "stops": 0},
    {"id": 22, "origin": "YUL", "destination": "MAD", "price": 479, "date": "2026-05-12", "airline": "Iberia", "duration_hours": 8.17, "stops": 1},
    {"id": 23, "origin": "YUL", "destination": "ICN", "price": 769, "date": "2026-05-18", "airline": "Korean Air", "duration_hours": 13.75, "stops": 0},
    {"id": 24, "origin": "YUL", "destination": "ZRH", "price": 449, "date": "2026-05-22", "airline": "Swiss International", "duration_hours": 7.92, "stops": 0},
    {"id": 25, "origin": "YUL", "destination": "DEL", "price": 699, "date": "2026-05-08", "airline": "Air India", "duration_hours": 13.0, "stops": 1},
    {"id": 26, "origin": "YUL", "destination": "HNL", "price": 559, "date": "2026-05-15", "airline": "Air Canada", "duration_hours": 10.5, "stops": 1},
    {"id": 27, "origin": "YUL", "destination": "EZE", "price": 749, "date": "2026-05-25", "airline": "Aerolíneas Argentinas", "duration_hours": 11.0, "stops": 1},
    # YUL -> Various (June)
    {"id": 28, "origin": "YUL", "destination": "LHR", "price": 419, "date": "2026-06-10", "airline": "Air Canada", "duration_hours": 7.0, "stops": 0},
    {"id": 29, "origin": "YUL", "destination": "NRT", "price": 799, "date": "2026-06-20", "airline": "Air Canada", "duration_hours": 13.5, "stops": 0},
    {"id": 30, "origin": "YUL", "destination": "JFK", "price": 179, "date": "2026-06-05", "airline": "Air Canada", "duration_hours": 1.5, "stops": 0},
    {"id": 31, "origin": "YUL", "destination": "SYD", "price": 1289, "date": "2026-06-15", "airline": "Qantas", "duration_hours": 20.5, "stops": 1},
    {"id": 32, "origin": "YUL", "destination": "KUL", "price": 859, "date": "2026-06-22", "airline": "Malaysia Airlines", "duration_hours": 17.5, "stops": 1},
    {"id": 33, "origin": "YUL", "destination": "HKG", "price": 829, "date": "2026-06-28", "airline": "Cathay Pacific", "duration_hours": 14.5, "stops": 1},
    # YUL -> Various (July-August)
    {"id": 34, "origin": "YUL", "destination": "BCN", "price": 499, "date": "2026-07-10", "airline": "Air Transat", "duration_hours": 8.33, "stops": 0},
    {"id": 35, "origin": "YUL", "destination": "CDG", "price": 479, "date": "2026-07-18", "airline": "Air France", "duration_hours": 7.33, "stops": 0},
    {"id": 36, "origin": "YUL", "destination": "LAX", "price": 369, "date": "2026-07-25", "airline": "WestJet", "duration_hours": 5.75, "stops": 0},
    {"id": 37, "origin": "YUL", "destination": "CUN", "price": 319, "date": "2026-08-05", "airline": "WestJet", "duration_hours": 4.5, "stops": 0},
    {"id": 38, "origin": "YUL", "destination": "LHR", "price": 449, "date": "2026-08-12", "airline": "British Airways", "duration_hours": 7.0, "stops": 0},
    # YYZ -> Various
    {"id": 39, "origin": "YYZ", "destination": "LHR", "price": 399, "date": "2026-03-14", "airline": "Air Canada", "duration_hours": 7.5, "stops": 0},
    {"id": 40, "origin": "YYZ", "destination": "CDG", "price": 449, "date": "2026-04-16", "airline": "Air France", "duration_hours": 7.75, "stops": 0},
    {"id": 41, "origin": "YYZ", "destination": "NRT", "price": 779, "date": "2026-04-22", "airline": "Japan Airlines", "duration_hours": 13.25, "stops": 0},
    {"id": 42, "origin": "YYZ", "destination": "SIN", "price": 919, "date": "2026-05-18", "airline": "Singapore Airlines", "duration_hours": 16.5, "stops": 1},
    {"id": 43, "origin": "YYZ", "destination": "DXB", "price": 619, "date": "2026-06-10", "airline": "Emirates", "duration_hours": 12.5, "stops": 1},
    {"id": 44, "origin": "YYZ", "destination": "GRU", "price": 699, "date": "2026-07-14", "airline": "LATAM", "duration_hours": 10.0, "stops": 0},
    # JFK -> Various
    {"id": 45, "origin": "JFK", "destination": "LHR", "price": 369, "date": "2026-03-18", "airline": "American Airlines", "duration_hours": 7.0, "stops": 0},
    {"id": 46, "origin": "JFK", "destination": "CDG", "price": 389, "date": "2026-04-14", "airline": "Delta", "duration_hours": 7.5, "stops": 0},
    {"id": 47, "origin": "JFK", "destination": "NRT", "price": 679, "date": "2026-05-20", "airline": "JAL", "duration_hours": 14.0, "stops": 0},
    {"id": 48, "origin": "JFK", "destination": "LAX", "price": 199, "date": "2026-03-22", "airline": "JetBlue", "duration_hours": 6.0, "stops": 0},
    {"id": 49, "origin": "JFK", "destination": "FRA", "price": 349, "date": "2026-06-05", "airline": "Lufthansa", "duration_hours": 8.0, "stops": 0},
    {"id": 50, "origin": "JFK", "destination": "DXB", "price": 549, "date": "2026-07-10", "airline": "Emirates", "duration_hours": 12.5, "stops": 0},
    # LAX -> Various
    {"id": 51, "origin": "LAX", "destination": "NRT", "price": 629, "date": "2026-03-20", "airline": "ANA", "duration_hours": 11.5, "stops": 0},
    {"id": 52, "origin": "LAX", "destination": "SYD", "price": 899, "date": "2026-04-18", "airline": "Qantas", "duration_hours": 15.0, "stops": 0},
    {"id": 53, "origin": "LAX", "destination": "LHR", "price": 549, "date": "2026-05-15", "airline": "Virgin Atlantic", "duration_hours": 10.5, "stops": 0},
    {"id": 54, "origin": "LAX", "destination": "EZE", "price": 779, "date": "2026-06-22", "airline": "LATAM", "duration_hours": 13.0, "stops": 1},
    {"id": 55, "origin": "LAX", "destination": "CDG", "price": 499, "date": "2026-07-08", "airline": "Air France", "duration_hours": 11.0, "stops": 0},
    # LHR -> Various
    {"id": 56, "origin": "LHR", "destination": "DXB", "price": 489, "date": "2026-03-12", "airline": "Emirates", "duration_hours": 7.0, "stops": 0},
    {"id": 57, "origin": "LHR", "destination": "SIN", "price": 529, "date": "2026-04-25", "airline": "Singapore Airlines", "duration_hours": 12.75, "stops": 0},
    {"id": 58, "origin": "LHR", "destination": "NRT", "price": 579, "date": "2026-05-18", "airline": "British Airways", "duration_hours": 11.5, "stops": 0},
]

def add_tax_and_info(flight: dict) -> dict:
    """Enrich flight with tax, city, region, emoji, duration info."""
    f = flight.copy()
    dest = AIRPORTS.get(f["destination"], {})
    orig = AIRPORTS.get(f["origin"], {})
    
    # Handle tax calculation (Amadeus flights already have total_price)
    if "total_price" not in f or f.get("source") != "amadeus":
        tax_amount = round(f["price"] * 0.15)
        total_price = f["price"] + tax_amount
        f["tax_amount"] = tax_amount
        f["total_price"] = total_price
    
    f["city"] = dest.get("city", f["destination"])
    f["country"] = dest.get("country", "")
    f["region"] = dest.get("region", "Other")
    f["destination_emoji"] = dest.get("emoji", "✈️")
    
    # Convert duration_hours to display format (e.g., "7h 30m")
    hours = int(f.get("duration_hours", 0))
    minutes = int((f.get("duration_hours", 0) - hours) * 60)
    if minutes > 0:
        f["duration"] = f"{hours}h {minutes}m"
    else:
        f["duration"] = f"{hours}h"
    
    f["historical_price"] = round(f.get("price", f.get("total_price", 0)) * 1.4)
    if not f.get("booking_url"):
        f["booking_url"] = generate_booking_url(
            f["origin"], f["destination"], f["date"],
            orig.get("city", f["origin"]), dest.get("city", f["destination"])
        )
    return f

def generate_booking_url(origin: str, destination: str, date_str: str, origin_city: str, dest_city: str) -> str:
    o = origin_city.replace(" ", "+")
    d = dest_city.replace(" ", "+")
    return f"https://www.google.com/travel/flights?q=Flights+from+{o}+to+{d}+on+{date_str}"

# Precompute enriched flights
mock_flights = [add_tax_and_info(f) for f in _raw_flights]


def date_proximity_score(flight_date_str: str) -> float:
    """Score 0-100: sooner flights score slightly higher (recency bonus within 90 days)."""
    try:
        today = date.today()
        flight_date = date.fromisoformat(flight_date_str)
        delta_days = (flight_date - today).days
        if delta_days < 0:
            return 0  # Past
        elif delta_days <= 30:
            return 100
        elif delta_days <= 60:
            return 80
        elif delta_days <= 90:
            return 60
        else:
            return 40
    except Exception:
        return 50


def normalize_score(value: float, min_val: float, max_val: float, reverse: bool = False) -> float:
    """Normalize a value to 0-100 scale. If reverse=True, lower values get higher scores."""
    if max_val == min_val:
        return 50.0
    normalized = ((value - min_val) / (max_val - min_val)) * 100
    if reverse:
        normalized = 100 - normalized
    return max(0, min(100, normalized))


def rank_flights(flights: list[dict]) -> list[dict]:
    """
    Implement value-based scoring algorithm:
    - 40% price (lower = better)
    - 30% duration (shorter = better)
    - 20% stops (fewer = better)
    - 10% OTA safety (existing)
    """
    if not flights:
        return flights
    
    # Find ranges for normalization
    prices = [f["price"] for f in flights]
    durations = [f.get("duration_hours", 10) for f in flights]
    
    min_price, max_price = min(prices), max(prices)
    min_duration, max_duration = min(durations), max(durations)
    
    for flight in flights:
        # Normalize each factor to 0-100
        price_score = normalize_score(flight["price"], min_price, max_price, reverse=True)
        duration_score = normalize_score(flight.get("duration_hours", 10), min_duration, max_duration, reverse=True)
        
        # Stops score: 0 stops = 100, 1 stop = 50, 2+ stops = 0
        stops = flight.get("stops", 0)
        if stops == 0:
            stops_score = 100
        elif stops == 1:
            stops_score = 50
        else:
            stops_score = 0
        
        # OTA safety score (existing stub)
        safety_score = 80.0
        
        # Calculate weighted value score
        value_score = (
            price_score * 0.40 +
            duration_score * 0.30 +
            stops_score * 0.20 +
            safety_score * 0.10
        )
        
        flight["value_score"] = round(value_score, 1)
        flight["safety_score"] = safety_score
        
        # Legacy "value" field for backward compatibility
        date_score = date_proximity_score(flight["date"])
        flight["value"] = price_score * 0.55 + safety_score * 0.25 + date_score * 0.20
    
    # Sort by value_score descending (highest value first)
    return sorted(flights, key=lambda x: x["value_score"], reverse=True)


def _month_seasonality_score(flight: dict) -> float:
    """Lower scores for peak travel windows, higher for shoulder/off-season."""
    month = int(flight["date"].split("-")[1])
    destination = flight.get("destination", "")

    peak_routes = {
        "CUN": {12, 1, 2, 3},
        "MIA": {12, 1, 2, 3},
        "HNL": {12, 1, 2, 3, 7, 8},
        "LHR": {6, 7, 8},
        "CDG": {6, 7, 8},
        "FCO": {6, 7, 8},
    }
    route_peak_months = peak_routes.get(destination, {6, 7, 8, 12})
    return 45 if month in route_peak_months else 80


def _rarity_score(flight: dict, flights: list[dict]) -> float:
    """Fewer available flights on a route means the fare is rarer."""
    route_total = len([f for f in flights if f["origin"] == flight["origin"] and f["destination"] == flight["destination"]])
    if route_total <= 2:
        return 90
    if route_total <= 4:
        return 75
    return 60


def _price_insight(flight: dict) -> dict:
    current_price = float(flight["total_price"])
    usual_price = float(flight.get("historical_price", current_price * 1.3))
    discount_amount = round(max(0, usual_price - current_price), 2)
    discount_pct = round((discount_amount / usual_price) * 100, 1) if usual_price else 0
    return {
        "usual_price": round(usual_price, 2),
        "current_discount": discount_pct,
        "discount_amount": discount_amount,
        "historical_comparison": f"CAD ${round(current_price):,} now vs CAD ${round(usual_price):,} usual",
    }


def calculate_deal_score(flight: dict, flights: list[dict]) -> float:
    current_price = float(flight["total_price"])
    historical_price = float(flight.get("historical_price", current_price * 1.35))
    discount = (historical_price - current_price) / historical_price if historical_price else 0
    price_vs_historical = min(100, max(0, discount * 250 + 35))

    duration_component = normalize_score(flight.get("duration_hours", 12), 1.0, 22.0, reverse=True)
    stops = flight.get("stops", 0)
    stops_component = 100 if stops == 0 else 65 if stops == 1 else 35
    seasonality_component = _month_seasonality_score(flight)
    rarity_component = _rarity_score(flight, flights)

    deal_score = (
        0.35 * price_vs_historical
        + 0.25 * flight.get("value_score", 50)
        + 0.15 * duration_component
        + 0.10 * stops_component
        + 0.10 * seasonality_component
        + 0.05 * rarity_component
    )
    return round(deal_score, 1)


def classify_deal(deal_score: float) -> str:
    if deal_score >= 86:
        return "Exceptional Deal"
    elif deal_score >= 72:
        return "Great Deal"
    elif deal_score >= 58:
        return "Good Deal"
    elif deal_score >= 40:
        return "Fair Price"
    else:
        return "Normal Price"


def enrich_flights_with_deals(flights: list[dict]) -> list[dict]:
    for flight in flights:
        flight["deal_score"] = calculate_deal_score(flight, flights)
        flight["deal_classification"] = classify_deal(flight["deal_score"])
        flight["price_insight"] = _price_insight(flight)
    return flights


@app.get("/api/airports")
async def get_airports():
    """Return all supported origin airports for the frontend dropdown."""
    result = []
    for code in ORIGIN_AIRPORTS:
        info = AIRPORTS.get(code, {})
        result.append({
            "code": code,
            "city": info.get("city", code),
            "country": info.get("country", ""),
            "region": info.get("region", ""),
        })
    return result


@app.get("/api/destinations")
async def get_destinations(origin: str):
    """Return all destinations reachable from a given origin."""
    flights_from_origin = [f for f in mock_flights if f["origin"] == origin.upper()]
    seen = set()
    result = []
    for f in flights_from_origin:
        dest = f["destination"]
        if dest not in seen:
            seen.add(dest)
            info = AIRPORTS.get(dest, {})
            result.append({
                "code": dest,
                "city": info.get("city", dest),
                "country": info.get("country", ""),
                "region": info.get("region", ""),
                "emoji": info.get("emoji", "✈️"),
            })
    return result


@app.get("/api/search")
async def search_flights(
    origin: str,
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    destination: Optional[str] = None,
):
    origin = origin.upper()
    if len(origin) != 3:
        raise HTTPException(status_code=400, detail="Invalid origin airport code")
    if origin not in AIRPORTS:
        raise HTTPException(status_code=400, detail="Unsupported origin airport code")

    destination_query = destination.strip() if destination else None
    destination_code = destination_query.upper() if destination_query and len(destination_query) == 3 else None
    if destination_code and destination_code not in AIRPORTS:
        raise HTTPException(status_code=400, detail="Unsupported destination airport code")

    cache_key = f"flight_search:{origin}:{month}:{destination_query}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"Returning cached results for {cache_key}")
            return json.loads(cached.decode("utf-8"))

    # Try Kiwi API first
    api_flights = []
    if kiwi_client.is_available():
        try:
            logger.info(f"Searching Kiwi API: origin={origin}, month={month}, dest={destination}")
            if month:
                api_flights = kiwi_client.search_by_month(
                    origin=origin,
                    month=month,
                    destination=destination_code,
                    max_results=100
                )
            else:
                # Single search without month
                api_flights = kiwi_client.search_flights(
                    origin=origin,
                    destination=destination_code,
                    max_results=100
                )
            
            # Enrich API flights with airport metadata
            api_flights = [add_tax_and_info(f) for f in api_flights]
            api_flights = [f for f in api_flights if _matches_destination_query(f, destination_query)]
            logger.info(f"Retrieved {len(api_flights)} flights from Kiwi API")
            
        except Exception as e:
            logger.error(f"Kiwi API error: {e} - falling back to mock data")

    # Fallback to mock data if no API results
    if not api_flights:
        logger.info("Using mock data (Kiwi unavailable or returned no results)")
        filtered = [
            f for f in mock_flights
            if f["origin"] == origin
            and (month is None or f["date"].startswith(month))
            and _matches_destination_query(f, destination_query)
        ]
        api_flights = filtered

    # Apply value scoring algorithm
    ranked = rank_flights(api_flights)
    flights = enrich_flights_with_deals(ranked)

    # Cache results
    if redis_client:
        redis_client.set(cache_key, json.dumps(flights), ex=24 * 3600)

    logger.info(f"Returning {len(flights)} flights to frontend")
    return flights


@app.get("/api/top-deals")
async def get_top_deals(origin: str, limit: int = 10):
    origin = origin.upper()
    flights_from_origin = [f for f in mock_flights if f["origin"] == origin]
    ranked = rank_flights(flights_from_origin)
    enriched = enrich_flights_with_deals(ranked)
    top = sorted(enriched, key=lambda x: x["deal_score"], reverse=True)[:limit]
    return top


subscriptions = []


@app.post("/api/subscribe", status_code=201)
async def subscribe_to_alerts(request: dict):
    email = request.get("email", "")
    destination = request.get("destination", "")
    route = request.get("route", "")
    threshold_price = request.get("threshold_price")
    travel_month = request.get("travel_month", "")

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    if not destination and not route:
        raise HTTPException(status_code=400, detail="Destination or route required")

    if threshold_price is not None:
        try:
            threshold_price = float(threshold_price)
        except Exception:
            raise HTTPException(status_code=400, detail="Threshold price must be numeric")

    existing = [
        s for s in subscriptions
        if s["email"] == email
        and s.get("destination") == destination
        and s.get("route") == route
        and s.get("travel_month") == travel_month
    ]
    if existing:
        return {"message": "Already subscribed", "email": email, "destination": destination}

    subscriptions.append({
        "email": email,
        "destination": destination,
        "route": route,
        "threshold_price": threshold_price,
        "travel_month": travel_month,
        "created_at": datetime.now().isoformat(),
    })
    return {
        "message": "Subscription successful",
        "email": email,
        "destination": destination,
        "route": route,
        "threshold_price": threshold_price,
        "travel_month": travel_month,
    }


@app.get("/api/subscriptions")
async def get_subscriptions(email: str):
    user_subs = [s for s in subscriptions if s["email"] == email]
    return {"subscriptions": user_subs}


@app.delete("/api/unsubscribe")
async def unsubscribe(email: str, destination: str):
    global subscriptions
    subscriptions = [
        s for s in subscriptions
        if not (s["email"] == email and s["destination"] == destination)
    ]
    return {"message": "Unsubscribed successfully"}
