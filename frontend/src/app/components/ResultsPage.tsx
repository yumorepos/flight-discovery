"use client";

import DestinationCard from "./DestinationCard";
import { useEffect, useState } from "react";

interface Flight {
  id: number;
  origin: string;
  destination: string;
  city: string;
  price: number;
  date: string;
  airline: string;
  safety_score: number;
  value_score: number;
  region: string;
  deal_score: number;
  deal_classification: string;
  historical_price: number;
}

interface ResultsPageProps {
  origin?: string;
  month?: string;
}

async function fetchFlights(origin: string, month: string): Promise<Flight[]> {
  try {
    const url = `http://localhost:8000/api/search?origin=${origin}&month=${month}`;
    console.log("Fetching from:", url);
    const res = await fetch(url);
    console.log("Response status:", res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API error response:", errorText);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("Flights received:", data.length, data);
    return data;
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
}

export default function ResultsPage({ origin = "", month = "" }: ResultsPageProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getFlights() {
      if (origin && month) {
        console.log("Effect triggered with:", { origin, month });
        setLoading(true);
        const flightsData = await fetchFlights(origin, month);
        console.log("Setting flights data:", flightsData);
        setFlights(flightsData);
        setLoading(false);
      }
    }

    getFlights();
  }, [origin, month]);

  // Group destinations by region
  const groupedDestinations = flights.reduce((acc: { [key: string]: Flight[] }, flight) => {
    if (!acc[flight.region]) {
      acc[flight.region] = [];
    }
    acc[flight.region].push(flight);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">Searching for flights...</div>
      </div>
    );
  }

  if (!origin || !month) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">Enter origin and month to search flights</div>
      </div>
    );
  }

  if (flights.length === 0 && origin && month && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600 mb-4">No flights found for {origin} in {month}</div>
        <div className="text-sm text-gray-500">
          Check browser console (F12) for errors. 
          <br/>API should be at: http://localhost:8000/api/search?origin={origin}&month={month}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {Object.entries(groupedDestinations).map(([region, destinations]) => (
        <div key={region} className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-blue-500 pb-2">
            {region}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((flight) => (
              <DestinationCard
                key={flight.id}
                city={flight.city}
                price={flight.price}
                airline={flight.airline}
                safetyScore={flight.safety_score}
                dealScore={flight.deal_score}
                valueScore={flight.value_score}
                historicalPrice={flight.historical_price}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
