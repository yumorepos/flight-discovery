from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import date
import redis

app = FastAPI()

# CORS
origins = ["*"]  # TODO: Restrict in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis (optional for MVP - skip if not running)
try:
    redis_client = redis.Redis(host="localhost", port=6379, db=0, socket_connect_timeout=1)
    redis_client.ping()
except:
    redis_client = None  # Disable caching if Redis unavailable

# Mock Flight Data (Replace with DB integration later)
mock_flights = [
    {"id": 1, "origin": "YUL", "destination": "JFK", "price": 200, "date": "2026-03-15", "airline": "Air Canada"},
    {"id": 2, "origin": "YUL", "destination": "LAX", "price": 350, "date": "2026-03-20", "airline": "United"},
    {"id": 3, "origin": "JFK", "destination": "LHR", "price": 400, "date": "2026-03-18", "airline": "American"},
    {"id": 4, "origin": "CDG", "destination": "NRT", "price": 500, "date": "2026-03-25", "airline": "Air France"},
    {"id": 5, "origin": "YUL", "destination": "CDG", "price": 450, "date": "2026-03-22", "airline": "Air Canada"},
    {"id": 6, "origin": "YUL", "destination": "JFK", "price": 220, "date": "2026-04-15", "airline": "WestJet"},
    {"id": 7, "origin": "YUL", "destination": "LAX", "price": 370, "date": "2026-04-20", "airline": "United"},
    {"id": 8, "origin": "JFK", "destination": "LHR", "price": 420, "date": "2026-04-18", "airline": "British Airways"},
    {"id": 9, "origin": "CDG", "destination": "NRT", "price": 520, "date": "2026-04-25", "airline": "Japan Airlines"},
    {"id": 10, "origin": "YUL", "destination": "CDG", "price": 470, "date": "2026-04-22", "airline": "Air France"},
    {"id": 11, "origin": "YUL", "destination": "AKL", "price": 1200, "date": "2026-03-22", "airline": "Air New Zealand"},
    {"id": 12, "origin": "YUL", "destination": "JNB", "price": 950, "date": "2026-03-28", "airline": "South African Airways"},
    {"id": 13, "origin": "LAX", "destination": "EZE", "price": 800, "date": "2026-03-10", "airline": "Aerolineas Argentinas"},
    {"id": 14, "origin": "NRT", "destination": "ICN", "price": 300, "date": "2026-03-05", "airline": "Korean Air"},
    {"id": 15, "origin": "LHR", "destination": "DXB", "price": 550, "date": "2026-03-12", "airline": "Emirates"},
    {"id": 16, "origin": "YUL", "destination": "AKL", "price": 1250, "date": "2026-04-22", "airline": "Air New Zealand"},
    {"id": 17, "origin": "YUL", "destination": "JNB", "price": 1000, "date": "2026-04-28", "airline": "South African Airways"},
    {"id": 18, "origin": "LAX", "destination": "EZE", "price": 850, "date": "2026-04-10", "airline": "LATAM"},
    {"id": 19, "origin": "NRT", "destination": "ICN", "price": 320, "date": "2026-04-05", "airline": "Asiana Airlines"},
    {"id": 20, "origin": "LHR", "destination": "DXB", "price": 570, "date": "2026-04-12", "airline": "Emirates"},
    {"id": 21, "origin": "SYD", "destination": "HNL", "price": 700, "date": "2026-03-01", "airline": "Qantas"},
    {"id": 22, "origin": "EZE", "destination": "GRU", "price": 250, "date": "2026-03-08", "airline": "GOL Linhas Aéreas"},
    {"id": 23, "origin": "JNB", "destination": "CPT", "price": 180, "date": "2026-03-03", "airline": "Mango"},
]

# OTA Safety Score stub
def get_ota_safety_score(ota: str) -> float:
    # In reality, this would check whitelists, HTTPS, domain age, etc.
    # Returning a dummy score for now
    return 0.8  # Example score


# Value Ranking Formula
def rank_flights(flights: list[dict]) -> list[dict]:
    for flight in flights:
        # Normalize scores to 0-100 range
        # Price score: inverse relationship (lower price = higher score)
        max_price = 2000  # Assume max price for normalization
        price_score = max(0, 100 - (flight["price"] / max_price * 100))
        
        # Safety score (already 0-1, convert to 0-100)
        safety_score = get_ota_safety_score("DummyOTA") * 100
        
        # Date score (placeholder)
        date_score = 50  # TODO: Implement a date scoring
        
        # Calculate weighted value score
        flight["value"] = (price_score * 0.6 + safety_score * 0.3 + date_score * 0.1)
        flight["safety_score"] = safety_score
        flight["value_score"] = (price_score * 0.7 + date_score * 0.3)
    return sorted(flights, key=lambda x: x["value"], reverse=True)

# Deal Detection System

def calculate_price_vs_historical(current_price: float, avg_price: float) -> float:
    discount = (avg_price - current_price) / avg_price
    if discount >= 0.50:
        return 100
    elif discount >= 0.30:
        return 80
    elif discount >= 0.10:
        return 60
    elif discount >= 0:
        return 40
    else:
        return max(0, 40 - (abs(discount) * 100))


def calculate_rarity(route: str, current_price: float) -> float:
    # Mock implementation
    return 75  # Example


def calculate_route_popularity(origin: str, destination: str) -> float:
    # Mock implementation
    return 80  # Example


def calculate_deal_score(flight: dict) -> float:
    # Mock historical average
    avg_price = flight["price"] * 1.2
    price_vs_historical_score = calculate_price_vs_historical(flight["price"], avg_price)
    value_score = flight["value"]
    rarity_score = calculate_rarity(f"{flight['origin']}-{flight['destination']}", flight["price"])
    route_popularity_score = calculate_route_popularity(flight["origin"], flight["destination"])
    booking_safety_score = get_ota_safety_score("DummyOTA")

    deal_score = (
        0.50 * price_vs_historical_score +
        0.20 * value_score +
        0.15 * rarity_score +
        0.10 * route_popularity_score +
        0.05 * booking_safety_score
    )
    return deal_score


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

@app.get("/api/search")
async def search_flights(
    origin: str,
    month: str = Query(..., regex="^\d{4}-\d{2}$")
):
    if len(origin) != 3:
        return {"error": "Invalid origin airport code"}

    city_mapping = {
        "YUL": "Montreal",
        "JFK": "New York",
        "LAX": "Los Angeles",
        "LHR": "London",
        "CDG": "Paris",
        "NRT": "Tokyo",
        "AKL": "Auckland",
        "JNB": "Johannesburg",
        "EZE": "Buenos Aires",
        "ICN": "Seoul",
        "DXB": "Dubai",
        "SYD": "Sydney",
        "HNL": "Honolulu",
        "GRU": "Sao Paulo",
        "CPT": "Cape Town"
    }

    region_mapping = {
        "YUL": "NA",
        "JFK": "NA",
        "LAX": "NA",
        "LHR": "EU",
        "CDG": "EU",
        "NRT": "Asia",
        "AKL": "Oceania",
        "JNB": "AF",
        "EZE": "SA",
        "ICN": "Asia",
        "DXB": "Asia",
        "SYD": "Oceania",
        "HNL": "NA",
        "GRU": "SA",
        "CPT": "AF"
    }
    
    cache_key = f"flight_search:{origin}:{month}"
    cached_result = None
    
    if redis_client:
        cached_result = redis_client.get(cache_key)

    if cached_result:
        print("Cache hit!")
        flights = eval(cached_result.decode("utf-8")) # CAREFUL with eval
    else:
        filtered_flights = [f for f in mock_flights if f["origin"] == origin and f["date"].startswith(month)]
        for flight in filtered_flights:
            flight["city"] = city_mapping.get(flight["destination"])
            flight["region"] = region_mapping.get(flight["destination"])
            flight["historical_price"] = flight["price"] * 1.5
        ranked_flights = rank_flights(filtered_flights)
        flights = enrich_flights_with_deals(ranked_flights)
        if redis_client:
            redis_client.set(cache_key, str(flights), ex=24 * 3600)


    return flights

@app.get("/api/top-deals")
async def get_top_deals(
    origin: str,
    limit: int = 10
):
    enriched_flights = enrich_flights_with_deals(mock_flights)
    top_deals = sorted(enriched_flights, key=lambda x: x["deal_score"], reverse=True)[:limit]
    return top_deals

# In-memory subscription storage (replace with database in production)
subscriptions = []

@app.post("/api/subscribe")
async def subscribe_to_alerts(request: dict):
    email = request.get("email")
    destination = request.get("destination")
    
    if not email or "@" not in email:
        return {"error": "Invalid email address"}, 400
    
    if not destination:
        return {"error": "Destination required"}, 400
    
    # Check if already subscribed
    existing = [s for s in subscriptions if s["email"] == email and s["destination"] == destination]
    if existing:
        return {"message": "Already subscribed"}
    
    subscriptions.append({
        "email": email,
        "destination": destination,
        "created_at": "2026-03-10"  # In production, use datetime.now()
    })
    
    return {"message": "Subscription successful", "email": email, "destination": destination}

@app.get("/api/subscriptions")
async def get_subscriptions(email: str):
    user_subs = [s for s in subscriptions if s["email"] == email]
    return {"subscriptions": user_subs}

@app.delete("/api/unsubscribe")
async def unsubscribe(email: str, destination: str):
    global subscriptions
    subscriptions = [s for s in subscriptions if not (s["email"] == email and s["destination"] == destination)]
    return {"message": "Unsubscribed successfully"}