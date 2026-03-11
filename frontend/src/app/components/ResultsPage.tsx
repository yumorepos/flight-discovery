"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DestinationCard from "./DestinationCard";
import airportsData from "@/data/airports.json";

interface Flight {
  id: number;
  origin: string;
  destination: string;
  city: string;
  country: string;
  price: number;
  total_price: number;
  tax_amount: number;
  date: string;
  airline: string;
  duration: string;
  duration_hours?: number;
  stops?: number;
  safety_score: number;
  value_score: number;
  region: string;
  deal_score: number;
  deal_classification: string;
  historical_price: number;
  destination_emoji: string;
  booking_url: string;
}

interface ResultsPageProps {
  origin?: string;
  month?: string;
  destination?: string;
}

type SortKey = "value" | "deal" | "price_asc" | "price_desc";
const DEFAULT_ORIGIN = "YUL";

const REGION_LABELS: Record<string, string> = {
  NA: "Americas",
  EU: "Europe",
  Asia: "Asia",
  Oceania: "Oceania",
  AF: "Africa",
  SA: "South America",
};

const airportMap = new Map((airportsData as Array<{ iata: string; city: string }>).map((airport) => [airport.iata, airport.city]));

async function fetchFlights(origin: string, month: string, destination?: string): Promise<Flight[]> {
  const params = new URLSearchParams({ origin });
  if (month) params.set("month", month);
  if (destination) params.set("destination", destination);

  const response = await fetch(`/api/search?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed with ${response.status}`);
  }

  return response.json();
}

export default function ResultsPage({ origin = "", month = "", destination = "" }: ResultsPageProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRegion, setActiveRegion] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [maxPrice, setMaxPrice] = useState<number>(3000);

  const effectiveOrigin = origin || DEFAULT_ORIGIN;

  useEffect(() => {
    const loadFlights = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchFlights(effectiveOrigin, month, destination || undefined);
        setFlights(result);
        setActiveRegion("All");
      } catch (loadError) {
        setFlights([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load flights");
      } finally {
        setLoading(false);
      }
    };

    loadFlights();
  }, [effectiveOrigin, month, destination]);

  const maxFlightPrice = useMemo(
    () => (flights.length ? Math.max(...flights.map((flight) => Math.round(flight.total_price))) : 3000),
    [flights]
  );

  useEffect(() => {
    setMaxPrice(maxFlightPrice);
  }, [maxFlightPrice]);

  const regions = useMemo(() => Array.from(new Set(flights.map((flight) => flight.region))), [flights]);

  const filtered = useMemo(() => {
    let list = flights.filter((flight) => Math.round(flight.total_price) <= maxPrice);
    if (activeRegion !== "All") {
      list = list.filter((flight) => flight.region === activeRegion);
    }

    switch (sortKey) {
      case "value":
        return [...list].sort((a, b) => b.value_score - a.value_score);
      case "deal":
        return [...list].sort((a, b) => b.deal_score - a.deal_score);
      case "price_asc":
        return [...list].sort((a, b) => a.total_price - b.total_price);
      case "price_desc":
        return [...list].sort((a, b) => b.total_price - a.total_price);
      default:
        return list;
    }
  }, [flights, activeRegion, maxPrice, sortKey]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading flight deals…</div>;
  }

  if (error) {
    return <div className="py-20 text-center text-red-600">{error}</div>;
  }

  return (
    <section className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">{origin ? "Search results" : "Discovery mode"}</p>
          <h2 className="text-3xl font-bold text-slate-900">Flights from {airportMap.get(effectiveOrigin) ?? effectiveOrigin} ({effectiveOrigin})</h2>
          <p className="text-sm text-slate-500">
            {flights.length} routes ranked by value · final prices include taxes
            {month ? ` · ${month}` : " · flexible dates"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Sort:</label>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="value">Best value</option>
            <option value="deal">Top deal score</option>
            <option value="price_asc">Lowest final price</option>
            <option value="price_desc">Highest final price</option>
          </select>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="text-sm font-medium text-slate-700">Max final price</label>
          <input
            type="range"
            min={150}
            max={maxFlightPrice}
            step={50}
            value={Math.min(maxPrice, maxFlightPrice)}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="w-full accent-blue-600"
          />
          <span className="text-sm font-semibold text-slate-800">CAD ${Math.min(maxPrice, maxFlightPrice).toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["All", ...regions].map((region) => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${activeRegion === region ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
          >
            {region === "All" ? "All regions" : REGION_LABELS[region] ?? region}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No deals match these filters. Try increasing the max price or selecting another region.
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((flight, index) => (
              <DestinationCard
                key={flight.id}
                index={index}
                id={flight.id}
                city={flight.city}
                country={flight.country}
                destination={flight.destination}
                price={flight.price}
                totalPrice={flight.total_price}
                taxAmount={flight.tax_amount}
                date={flight.date}
                airline={flight.airline}
                duration={flight.duration}
                durationHours={flight.duration_hours}
                stops={flight.stops}
                safetyScore={flight.safety_score}
                dealScore={flight.deal_score}
                dealClassification={flight.deal_classification}
                valueScore={flight.value_score}
                historicalPrice={flight.historical_price}
                destinationEmoji={flight.destination_emoji}
                bookingUrl={flight.booking_url}
                region={flight.region}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
