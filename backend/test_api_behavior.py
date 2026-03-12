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


def test_kiwi_metadata_is_preserved_for_unknown_airports():
    flight = {
        "id": "kiwi_ber",
        "origin": "YUL",
        "destination": "BER",
        "price": 300,
        "date": "2026-03-15",
        "airline": "U2",
        "duration_hours": 8.0,
        "source": "kiwi",
        "city": "Berlin",
        "country": "Germany",
        "region": "DE",
    }

    enriched = add_tax_and_info(flight)

    assert enriched["city"] == "Berlin"
    assert enriched["country"] == "Germany"


def test_destination_query_matches_kiwi_flights_by_city_without_airport_map_entry(monkeypatch):
    from main import kiwi_client

    sample = [{
        "id": "kiwi_ber",
        "origin": "YUL",
        "destination": "BER",
        "price": 300,
        "total_price": 345,
        "tax_amount": 45,
        "date": "2026-03-15",
        "airline": "U2",
        "duration_hours": 8.0,
        "stops": 0,
        "currency": "CAD",
        "source": "kiwi",
        "booking_url": "https://example.test",
        "city": "Berlin",
        "country": "Germany",
        "region": "DE",
    }]

    monkeypatch.setattr(kiwi_client, "is_available", lambda: True)
    monkeypatch.setattr(kiwi_client, "search_by_month", lambda **kwargs: sample)

    payload = asyncio.run(search_flights(origin="YUL", month="2026-03", destination="berlin"))

    assert len(payload) == 1
    assert payload[0]["destination"] == "BER"
