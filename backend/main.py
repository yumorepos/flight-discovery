from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import date, datetime
import json
import redis

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

# Mock flight data - 55 flights across March-August 2026
_raw_flights = [
    # YUL -> Various (March)
    {"id": 1, "origin": "YUL", "destination": "JFK", "price": 189, "date": "2026-03-15", "airline": "Air Canada"},
    {"id": 2, "origin": "YUL", "destination": "LAX", "price": 329, "date": "2026-03-20", "airline": "United"},
    {"id": 3, "origin": "YUL", "destination": "CDG", "price": 419, "date": "2026-03-22", "airline": "Air Canada"},
    {"id": 4, "origin": "YUL", "destination": "LHR", "price": 389, "date": "2026-03-18", "airline": "British Airways"},
    {"id": 5, "origin": "YUL", "destination": "NRT", "price": 749, "date": "2026-03-25", "airline": "Air Canada"},
    {"id": 6, "origin": "YUL", "destination": "AKL", "price": 1099, "date": "2026-03-28", "airline": "Air New Zealand"},
    {"id": 7, "origin": "YUL", "destination": "JNB", "price": 879, "date": "2026-03-22", "airline": "South African Airways"},
    {"id": 8, "origin": "YUL", "destination": "CUN", "price": 299, "date": "2026-03-19", "airline": "WestJet"},
    {"id": 9, "origin": "YUL", "destination": "BCN", "price": 459, "date": "2026-03-30", "airline": "Iberia"},
    {"id": 10, "origin": "YUL", "destination": "DXB", "price": 599, "date": "2026-03-16", "airline": "Emirates"},
    # YUL -> Various (April)
    {"id": 11, "origin": "YUL", "destination": "JFK", "price": 209, "date": "2026-04-10", "airline": "WestJet"},
    {"id": 12, "origin": "YUL", "destination": "LAX", "price": 349, "date": "2026-04-18", "airline": "Air Canada"},
    {"id": 13, "origin": "YUL", "destination": "CDG", "price": 439, "date": "2026-04-22", "airline": "Air France"},
    {"id": 14, "origin": "YUL", "destination": "FCO", "price": 469, "date": "2026-04-14", "airline": "Air Canada"},
    {"id": 15, "origin": "YUL", "destination": "SIN", "price": 899, "date": "2026-04-20", "airline": "Singapore Airlines"},
    {"id": 16, "origin": "YUL", "destination": "AKL", "price": 1149, "date": "2026-04-25", "airline": "Air New Zealand"},
    {"id": 17, "origin": "YUL", "destination": "GRU", "price": 649, "date": "2026-04-12", "airline": "LATAM"},
    {"id": 18, "origin": "YUL", "destination": "FRA", "price": 399, "date": "2026-04-08", "airline": "Lufthansa"},
    {"id": 19, "origin": "YUL", "destination": "MIA", "price": 249, "date": "2026-04-05", "airline": "Air Canada"},
    {"id": 20, "origin": "YUL", "destination": "BKK", "price": 819, "date": "2026-04-28", "airline": "Thai Airways"},
    # YUL -> Various (May)
    {"id": 21, "origin": "YUL", "destination": "AMS", "price": 429, "date": "2026-05-05", "airline": "KLM"},
    {"id": 22, "origin": "YUL", "destination": "MAD", "price": 479, "date": "2026-05-12", "airline": "Iberia"},
    {"id": 23, "origin": "YUL", "destination": "ICN", "price": 769, "date": "2026-05-18", "airline": "Korean Air"},
    {"id": 24, "origin": "YUL", "destination": "ZRH", "price": 449, "date": "2026-05-22", "airline": "Swiss International"},
    {"id": 25, "origin": "YUL", "destination": "DEL", "price": 699, "date": "2026-05-08", "airline": "Air India"},
    {"id": 26, "origin": "YUL", "destination": "HNL", "price": 559, "date": "2026-05-15", "airline": "Air Canada"},
    {"id": 27, "origin": "YUL", "destination": "EZE", "price": 749, "date": "2026-05-25", "airline": "Aerolíneas Argentinas"},
    # YUL -> Various (June)
    {"id": 28, "origin": "YUL", "destination": "LHR", "price": 419, "date": "2026-06-10", "airline": "Air Canada"},
    {"id": 29, "origin": "YUL", "destination": "NRT", "price": 799, "date": "2026-06-20", "airline": "Air Canada"},
    {"id": 30, "origin": "YUL", "destination": "JFK", "price": 179, "date": "2026-06-05", "airline": "Air Canada"},
    {"id": 31, "origin": "YUL", "destination": "SYD", "price": 1289, "date": "2026-06-15", "airline": "Qantas"},
    {"id": 32, "origin": "YUL", "destination": "KUL", "price": 859, "date": "2026-06-22", "airline": "Malaysia Airlines"},
    {"id": 33, "origin": "YUL", "destination": "HKG", "price": 829, "date": "2026-06-28", "airline": "Cathay Pacific"},
    # YUL -> Various (July-August)
    {"id": 34, "origin": "YUL", "destination": "BCN", "price": 499, "date": "2026-07-10", "airline": "Air Transat"},
    {"id": 35, "origin": "YUL", "destination": "CDG", "price": 479, "date": "2026-07-18", "airline": "Air France"},
    {"id": 36, "origin": "YUL", "destination": "LAX", "price": 369, "date": "2026-07-25", "airline": "WestJet"},
    {"id": 37, "origin": "YUL", "destination": "CUN", "price": 319, "date": "2026-08-05", "airline": "WestJet"},
    {"id": 38, "origin": "YUL", "destination": "LHR", "price": 449, "date": "2026-08-12", "airline": "British Airways"},
    # YYZ -> Various
    {"id": 39, "origin": "YYZ", "destination": "LHR", "price": 399, "date": "2026-03-14", "airline": "Air Canada"},
    {"id": 40, "origin": "YYZ", "destination": "CDG", "price": 449, "date": "2026-04-16", "airline": "Air France"},
    {"id": 41, "origin": "YYZ", "destination": "NRT", "price": 779, "date": "2026-04-22", "airline": "Japan Airlines"},
    {"id": 42, "origin": "YYZ", "destination": "SIN", "price": 919, "date": "2026-05-18", "airline": "Singapore Airlines"},
    {"id": 43, "origin": "YYZ", "destination": "DXB", "price": 619, "date": "2026-06-10", "airline": "Emirates"},
    {"id": 44, "origin": "YYZ", "destination": "GRU", "price": 699, "date": "2026-07-14", "airline": "LATAM"},
    # JFK -> Various
    {"id": 45, "origin": "JFK", "destination": "LHR", "price": 369, "date": "2026-03-18", "airline": "American Airlines"},
    {"id": 46, "origin": "JFK", "destination": "CDG", "price": 389, "date": "2026-04-14", "airline": "Delta"},
    {"id": 47, "origin": "JFK", "destination": "NRT", "price": 679, "date": "2026-05-20", "airline": "JAL"},
    {"id": 48, "origin": "JFK", "destination": "LAX", "price": 199, "date": "2026-03-22", "airline": "JetBlue"},
    {"id": 49, "origin": "JFK", "destination": "FRA", "price": 349, "date": "2026-06-05", "airline": "Lufthansa"},
    {"id": 50, "origin": "JFK", "destination": "DXB", "price": 549, "date": "2026-07-10", "airline": "Emirates"},
    # LAX -> Various
    {"id": 51, "origin": "LAX", "destination": "NRT", "price": 629, "date": "2026-03-20", "airline": "ANA"},
    {"id": 52, "origin": "LAX", "destination": "SYD", "price": 899, "date": "2026-04-18", "airline": "Qantas"},
    {"id": 53, "origin": "LAX", "destination": "LHR", "price": 549, "date": "2026-05-15", "airline": "Virgin Atlantic"},
    {"id": 54, "origin": "LAX", "destination": "EZE", "price": 779, "date": "2026-06-22", "airline": "LATAM"},
    {"id": 55, "origin": "LAX", "destination": "CDG", "price": 499, "date": "2026-07-08", "airline": "Air France"},
    # LHR -> Various
    {"id": 56, "origin": "LHR", "destination": "DXB", "price": 489, "date": "2026-03-12", "airline": "Emirates"},
    {"id": 57, "origin": "LHR", "destination": "SIN", "price": 529, "date": "2026-04-25", "airline": "Singapore Airlines"},
    {"id": 58, "origin": "LHR", "destination": "NRT", "price": 579, "date": "2026-05-18", "airline": "British Airways"},
]

def add_tax_and_info(flight: dict) -> dict:
    """Enrich flight with tax, city, region, emoji, duration info."""
    f = flight.copy()
    dest = AIRPORTS.get(f["destination"], {})
    orig = AIRPORTS.get(f["origin"], {})
    tax_amount = round(f["price"] * 0.15)
    total_price = f["price"] + tax_amount
    f["tax_amount"] = tax_amount
    f["total_price"] = total_price
    f["city"] = dest.get("city", f["destination"])
    f["country"] = dest.get("country", "")
    f["region"] = dest.get("region", "Other")
    f["destination_emoji"] = dest.get("emoji", "✈️")
    f["duration"] = get_duration(f["origin"], f["destination"])
    f["historical_price"] = round(f["price"] * 1.4)
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


def rank_flights(flights: list[dict]) -> list[dict]:
    for flight in flights:
        max_price = 2000
        price_score = max(0, 100 - (flight["price"] / max_price * 100))
        safety_score = 80.0  # Fixed stub score
        date_score = date_proximity_score(flight["date"])
        flight["value"] = price_score * 0.55 + safety_score * 0.25 + date_score * 0.20
        flight["safety_score"] = safety_score
        flight["value_score"] = price_score * 0.65 + date_score * 0.35
    return sorted(flights, key=lambda x: x["value"], reverse=True)


def calculate_deal_score(flight: dict) -> float:
    avg_price = flight["price"] * 1.4  # Historical avg ~ 40% above
    discount = (avg_price - flight["price"]) / avg_price  # ~28%
    price_vs_historical = min(100, max(0, discount * 200 + 40))
    value_score = flight.get("value", 50)
    rarity_score = 70
    route_popularity = 75

    deal_score = (
        0.50 * price_vs_historical
        + 0.25 * value_score
        + 0.15 * rarity_score
        + 0.10 * route_popularity
    )
    return round(deal_score, 1)


def classify_deal(deal_score: float) -> str:
    if deal_score >= 90:
        return "Mistake Fare"
    elif deal_score >= 75:
        return "Hot Deal"
    elif deal_score >= 60:
        return "Good Deal"
    elif deal_score >= 40:
        return "Fair Price"
    else:
        return "Normal Price"


def enrich_flights_with_deals(flights: list[dict]) -> list[dict]:
    for flight in flights:
        flight["deal_score"] = calculate_deal_score(flight)
        flight["deal_classification"] = classify_deal(flight["deal_score"])
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

    cache_key = f"flight_search:{origin}:{month}:{destination}"
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached.decode("utf-8"))

    filtered = [
        f for f in mock_flights
        if f["origin"] == origin
        and (month is None or f["date"].startswith(month))
        and (destination is None or f["destination"] == destination.upper() or
             destination.lower() in f["city"].lower())
    ]

    ranked = rank_flights(filtered)
    flights = enrich_flights_with_deals(ranked)

    if redis_client:
        redis_client.set(cache_key, json.dumps(flights), ex=24 * 3600)

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

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    if not destination:
        raise HTTPException(status_code=400, detail="Destination required")

    existing = [s for s in subscriptions if s["email"] == email and s["destination"] == destination]
    if existing:
        return {"message": "Already subscribed", "email": email, "destination": destination}

    subscriptions.append({
        "email": email,
        "destination": destination,
        "created_at": datetime.now().isoformat(),
    })
    return {"message": "Subscription successful", "email": email, "destination": destination}


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
