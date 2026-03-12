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


def test_add_tax_and_info_uses_existing_location_metadata_for_unknown_airport():
    flight = {
        "id": "kiwi_ber_2",
        "origin": "YUL",
        "destination": "BER",
        "price": 350,
        "total_price": 402,
        "tax_amount": 52,
        "date": "2026-03-10",
        "airline": "EW",
        "duration_hours": 8.5,
        "source": "kiwi",
        "city": "Berlin",
        "country": "Germany",
    }

    enriched = add_tax_and_info(flight)

    assert enriched["city"] == "Berlin"
    assert enriched["country"] == "Germany"


def test_search_rejects_unsupported_destination_code():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(search_flights(origin="YUL", destination="ZZZ"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Unsupported destination airport code"


def test_search_response_contains_total_price_and_tax():
    payload = asyncio.run(search_flights(origin="YUL", month="2026-03"))

    assert payload, "Expected at least one flight"
    assert all("total_price" in flight and "tax_amount" in flight for flight in payload)


def test_search_filters_kiwi_results_by_city_metadata(monkeypatch):
    class _StubKiwiClient:
        @staticmethod
        def is_available():
            return True

        @staticmethod
        def search_flights(origin, destination=None, max_results=100):
            return [
                {
                    "id": "kiwi_ber",
                    "origin": origin,
                    "destination": "BER",
                    "price": 350,
                    "total_price": 402,
                    "tax_amount": 52,
                    "date": "2026-03-10",
                    "airline": "EW",
                    "duration_hours": 8.5,
                    "source": "kiwi",
                    "city": "Berlin",
                    "country": "Germany",
                }
            ]

        @staticmethod
        def search_by_month(origin, month, destination=None, max_results=100):
            return []

    monkeypatch.setattr("main.kiwi_client", _StubKiwiClient())

    payload = asyncio.run(search_flights(origin="YUL", month=None, destination="berlin"))

    assert len(payload) == 1
    assert payload[0]["destination"] == "BER"
    assert payload[0]["city"] == "Berlin"
