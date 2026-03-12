import asyncio

import pytest
from fastapi import HTTPException

from main import add_tax_and_info, search_flights


def test_add_tax_and_info_preserves_existing_booking_url():
    flight = {
        "id": "kiwi_1",
        "origin": "YUL",
        "destination": "CDG",
        "price": 400,
        "total_price": 500,
        "tax_amount": 100,
        "date": "2026-03-10",
        "airline": "AF",
        "duration_hours": 7.3,
        "booking_url": "https://provider.example/deep-link",
        "source": "kiwi",
    }

    enriched = add_tax_and_info(flight)

    assert enriched["booking_url"] == "https://provider.example/deep-link"


def test_search_rejects_unsupported_destination_code():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(search_flights(origin="YUL", destination="ZZZ"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Unsupported destination airport code"


def test_search_response_contains_total_price_and_tax():
    payload = asyncio.run(search_flights(origin="YUL", month="2026-03"))

    assert payload, "Expected at least one flight"
    assert all("total_price" in flight and "tax_amount" in flight for flight in payload)
