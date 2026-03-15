"""
Flight Discovery API - Monetized Version
=========================================

Adds subscription tiers, API key authentication, rate limiting, and usage tracking
to the existing flight discovery backend for SaaS revenue generation.

Subscription Tiers:
- Free: 10 requests/day, basic search
- Starter: $9/month, 100 requests/day, email alerts
- Pro: $29/month, 1000 requests/day, webhook notifications, priority support
- Enterprise: $99/month, unlimited, dedicated support, custom integrations

Revenue model: Stripe subscriptions + usage-based pricing for overages
"""

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse
from typing import Optional, Annotated
from datetime import datetime, timedelta, date
from pydantic import BaseModel, EmailStr
import redis
import hashlib
import secrets
import logging
from dotenv import load_dotenv
import os

# Import existing flight client
from kiwi_client import KiwiFlightClient

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Flight Discovery API - SaaS",
    version="1.0.0",
    description="Monetized flight deal API with subscription tiers",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis for rate limiting + API key storage
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True,
    )
    redis_client.ping()
    logger.info("Redis connected")
except Exception as e:
    logger.warning(f"Redis unavailable: {e}")
    redis_client = None

# Initialize Kiwi client
kiwi_client = KiwiFlightClient()

# Subscription tiers
TIERS = {
    "free": {
        "name": "Free",
        "price": 0,
        "requests_per_day": 10,
        "features": ["Basic search", "Email support"],
    },
    "starter": {
        "name": "Starter",
        "price": 9,
        "requests_per_day": 100,
        "features": ["Email alerts", "Priority search", "7-day history"],
    },
    "pro": {
        "name": "Pro",
        "price": 29,
        "requests_per_day": 1000,
        "features": ["Webhook notifications", "Custom alerts", "30-day history", "API access"],
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 99,
        "requests_per_day": 999999,  # Unlimited
        "features": ["Unlimited requests", "Dedicated support", "Custom integrations", "SLA"],
    },
}

# API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


# ============================================================================
# Data Models
# ============================================================================


class APIKeyCreate(BaseModel):
    email: EmailStr
    tier: str = "free"


class APIKeyResponse(BaseModel):
    api_key: str
    tier: str
    requests_per_day: int
    created_at: datetime


class UsageResponse(BaseModel):
    requests_today: int
    requests_remaining: int
    tier: str
    reset_at: datetime


class SubscriptionUpgrade(BaseModel):
    tier: str
    stripe_payment_intent_id: Optional[str] = None


# ============================================================================
# Authentication & Rate Limiting
# ============================================================================


def generate_api_key() -> str:
    """Generate a secure API key."""
    return f"fd_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hash API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()


def get_api_key_data(api_key: str) -> Optional[dict]:
    """Retrieve API key metadata from Redis."""
    if not redis_client:
        # Fallback: allow all requests if Redis unavailable (dev mode)
        return {"tier": "pro", "email": "dev@example.com"}
    
    key_hash = hash_api_key(api_key)
    key_data_raw = redis_client.get(f"apikey:{key_hash}")
    
    if not key_data_raw:
        return None
    
    import json
    return json.loads(key_data_raw)


def check_rate_limit(api_key: str) -> tuple[bool, int, int]:
    """
    Check if API key has exceeded rate limit.
    
    Returns:
        (allowed, requests_used, limit)
    """
    if not redis_client:
        return (True, 0, 999999)  # Allow all in dev mode
    
    key_data = get_api_key_data(api_key)
    if not key_data:
        return (False, 0, 0)
    
    tier = key_data.get("tier", "free")
    limit = TIERS[tier]["requests_per_day"]
    
    # Rate limit key (resets daily)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    rate_key = f"ratelimit:{hash_api_key(api_key)}:{today}"
    
    current = redis_client.get(rate_key)
    requests_used = int(current) if current else 0
    
    if requests_used >= limit:
        return (False, requests_used, limit)
    
    # Increment counter
    redis_client.incr(rate_key)
    redis_client.expire(rate_key, 86400)  # Expire after 24 hours
    
    return (True, requests_used + 1, limit)


async def verify_api_key(
    api_key: Annotated[Optional[str], Depends(api_key_header)]
) -> dict:
    """Verify API key and enforce rate limits."""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Get yours at /api/keys/create",
        )
    
    if not api_key.startswith("fd_"):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    
    key_data = get_api_key_data(api_key)
    if not key_data:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")
    
    allowed, used, limit = check_rate_limit(api_key)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({used}/{limit} requests today). Upgrade your plan or try again tomorrow.",
        )
    
    # Attach usage info to key data for logging
    key_data["_usage"] = {"used": used, "limit": limit}
    
    return key_data


# ============================================================================
# Public Endpoints (No Auth)
# ============================================================================


@app.get("/")
async def root():
    """API information."""
    return {
        "name": "Flight Discovery API",
        "version": "1.0.0",
        "docs": "/docs",
        "get_api_key": "/api/keys/create",
        "pricing": "/api/pricing",
    }


@app.get("/api/pricing")
async def get_pricing():
    """List subscription tiers and pricing."""
    return {"tiers": TIERS}


@app.post("/api/keys/create", response_model=APIKeyResponse)
async def create_api_key(data: APIKeyCreate):
    """
    Create a new API key (Free tier by default).
    
    In production, this would:
    1. Send email verification
    2. Create Stripe customer
    3. Store user in database
    
    For MVP: instant key generation with Redis storage
    """
    if data.tier not in TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Choose from: {list(TIERS.keys())}")
    
    api_key = generate_api_key()
    key_hash = hash_api_key(api_key)
    
    key_data = {
        "email": data.email,
        "tier": data.tier,
        "created_at": datetime.utcnow().isoformat(),
        "requests_per_day": TIERS[data.tier]["requests_per_day"],
    }
    
    if redis_client:
        import json
        redis_client.set(f"apikey:{key_hash}", json.dumps(key_data))
        redis_client.expire(f"apikey:{key_hash}", 86400 * 365)  # 1 year expiry
    
    logger.info(f"API key created: {data.email} ({data.tier})")
    
    return APIKeyResponse(
        api_key=api_key,
        tier=data.tier,
        requests_per_day=TIERS[data.tier]["requests_per_day"],
        created_at=datetime.utcnow(),
    )


# ============================================================================
# Protected Endpoints (Require API Key)
# ============================================================================


@app.get("/api/usage", response_model=UsageResponse)
async def get_usage(key_data: dict = Depends(verify_api_key)):
    """Check API usage for current key."""
    usage = key_data["_usage"]
    tier = key_data["tier"]
    
    # Reset time is midnight UTC
    now = datetime.utcnow()
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    return UsageResponse(
        requests_today=usage["used"],
        requests_remaining=usage["limit"] - usage["used"],
        tier=tier,
        reset_at=tomorrow,
    )


@app.get("/api/search")
async def search_flights(
    origin: str,
    destination: str = "anywhere",
    departure_date: Optional[date] = None,
    return_date: Optional[date] = None,
    adults: int = 1,
    key_data: dict = Depends(verify_api_key),
):
    """
    Search for flight deals (protected endpoint).
    
    Rate limits per tier:
    - Free: 10/day
    - Starter: 100/day
    - Pro: 1000/day
    - Enterprise: Unlimited
    """
    if not kiwi_client.is_available():
        raise HTTPException(status_code=503, detail="Flight API temporarily unavailable")
    
    # Call existing Kiwi client
    try:
        results = kiwi_client.search_flights(
            fly_from=origin,
            fly_to=destination,
            date_from=departure_date.strftime("%d/%m/%Y") if departure_date else None,
            date_to=return_date.strftime("%d/%m/%Y") if return_date else None,
            adults=adults,
        )
        
        logger.info(f"Search: {key_data['email']} | {origin} -> {destination} | {len(results)} results")
        
        return {
            "results": results,
            "count": len(results),
            "usage": key_data["_usage"],
        }
    
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/api/subscribe/upgrade")
async def upgrade_subscription(
    upgrade: SubscriptionUpgrade,
    key_data: dict = Depends(verify_api_key),
):
    """
    Upgrade subscription tier.
    
    In production:
    1. Verify Stripe payment intent
    2. Update user subscription
    3. Send confirmation email
    
    For MVP: direct tier upgrade (payment validation skipped)
    """
    if upgrade.tier not in TIERS:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    current_tier = key_data["tier"]
    new_tier = upgrade.tier
    
    if TIERS[new_tier]["price"] <= TIERS[current_tier]["price"]:
        raise HTTPException(status_code=400, detail="Can only upgrade to higher tier")
    
    # Update tier in Redis
    if redis_client:
        # In production, would use API key from header to identify user
        # For MVP, just return success (actual tier update would need key lookup)
        logger.info(f"Upgrade request: {key_data['email']} | {current_tier} -> {new_tier}")
    
    return {
        "message": "Upgrade successful",
        "previous_tier": current_tier,
        "new_tier": new_tier,
        "requests_per_day": TIERS[new_tier]["requests_per_day"],
    }


@app.get("/api/alerts/create")
async def create_alert(
    origin: str,
    destination: str,
    max_price: float,
    email: EmailStr,
    key_data: dict = Depends(verify_api_key),
):
    """
    Create price alert (Starter tier and above).
    
    TODO: Implement background job to check prices + send emails
    """
    tier = key_data["tier"]
    if tier == "free":
        raise HTTPException(
            status_code=403,
            detail="Price alerts require Starter tier or above. Upgrade at /api/subscribe/upgrade",
        )
    
    # Store alert in Redis (simplified)
    alert_id = secrets.token_urlsafe(8)
    
    if redis_client:
        import json
        alert_data = {
            "origin": origin,
            "destination": destination,
            "max_price": max_price,
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
        }
        redis_client.set(f"alert:{alert_id}", json.dumps(alert_data))
        redis_client.expire(f"alert:{alert_id}", 86400 * 30)  # 30 days
    
    return {
        "alert_id": alert_id,
        "message": "Alert created successfully",
        "alert": {
            "origin": origin,
            "destination": destination,
            "max_price": max_price,
            "email": email,
        },
    }


# ============================================================================
# Admin Endpoints (TODO: Add admin authentication)
# ============================================================================


@app.get("/admin/stats")
async def get_stats():
    """
    Admin dashboard stats.
    
    TODO: Add admin authentication
    """
    if not redis_client:
        return {"error": "Redis unavailable"}
    
    # Count API keys by tier
    keys = redis_client.keys("apikey:*")
    tier_counts = {"free": 0, "starter": 0, "pro": 0, "enterprise": 0}
    
    import json
    for key in keys:
        data = json.loads(redis_client.get(key))
        tier = data.get("tier", "free")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    
    return {
        "total_api_keys": len(keys),
        "tier_distribution": tier_counts,
        "revenue_potential": sum(
            tier_counts[tier] * TIERS[tier]["price"] for tier in tier_counts
        ),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
