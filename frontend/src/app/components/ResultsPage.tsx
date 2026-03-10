"use client";

import DestinationCard from "./DestinationCard";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

type SortKey = "deal" | "price_asc" | "price_desc" | "value";

const REGION_LABELS: Record<string, string> = {
  NA: "🌎 Americas",
  EU: "🌍 Europe",
  Asia: "🌏 Asia",
  Oceania: "🦘 Oceania",
  AF: "🌍 Africa",
  SA: "🌎 South America",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="h-36 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-8 shimmer rounded w-1/2" />
        <div className="h-3 shimmer rounded w-full" />
        <div className="h-3 shimmer rounded w-2/3" />
        <div className="h-10 shimmer rounded-xl mt-2" />
      </div>
    </div>
  );
}

async function fetchFlights(origin: string, month: string, destination?: string): Promise<Flight[]> {
  try {
    const params = new URLSearchParams({ origin });
    if (month) params.set("month", month);
    if (destination) params.set("destination", destination);
    const res = await fetch(`http://localhost:8000/api/search?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching flights:", err);
    return [];
  }
}

export default function ResultsPage({ origin = "", month = "", destination = "" }: ResultsPageProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("deal");
  const [maxPrice, setMaxPrice] = useState<number>(2000);

  useEffect(() => {
    if (!origin) return;
    setLoading(true);
    fetchFlights(origin, month, destination || undefined).then((data) => {
      setFlights(data);
      setLoading(false);
      setActiveRegion("All");
    });
  }, [origin, month, destination]);

  const regions = useMemo(() => {
    const seen = new Set<string>();
    flights.forEach((f) => seen.add(f.region));
    return Array.from(seen);
  }, [flights]);

  const maxFlightPrice = useMemo(
    () => (flights.length ? Math.max(...flights.map((f) => f.price)) : 2000),
    [flights]
  );

  const filtered = useMemo(() => {
    let list = flights.filter((f) => f.price <= maxPrice);
    if (activeRegion !== "All") list = list.filter((f) => f.region === activeRegion);
    switch (sortKey) {
      case "deal":
        list = [...list].sort((a, b) => b.deal_score - a.deal_score);
        break;
      case "price_asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "value":
        list = [...list].sort((a, b) => b.value_score - a.value_score);
        break;
    }
    return list;
  }, [flights, activeRegion, sortKey, maxPrice]);

  if (!origin) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-5xl mb-4">✈️</div>
        <p className="text-xl font-medium">Choose your departure airport to explore deals</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="h-8 shimmer rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-xl font-medium text-gray-700">No flights found</p>
        <p className="text-gray-500 mt-2">
          Try a different month or remove the destination filter.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Flights from <span className="text-blue-700">{origin}</span>
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {flights.length} deal{flights.length !== 1 ? "s" : ""} found
            {month ? ` · ${month}` : ""} · All prices in CAD
          </p>
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Sort by:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="deal">Best Deal</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="value">Best Value</option>
          </select>
        </div>
      </div>

      {/* Price range filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Max price:</span>
        <input
          type="range"
          min={100}
          max={maxFlightPrice}
          step={50}
          value={maxPrice > maxFlightPrice ? maxFlightPrice : maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-sm font-bold text-blue-700 whitespace-nowrap w-24 text-right">
          CAD ${Math.min(maxPrice, maxFlightPrice).toLocaleString()}
        </span>
      </div>

      {/* Region filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["All", ...regions].map((r) => (
          <button
            key={r}
            onClick={() => setActiveRegion(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeRegion === r
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {r === "All" ? "🌐 All" : REGION_LABELS[r] || r}
          </button>
        ))}
      </div>

      {/* Flight cards grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            No flights match your filters. Try adjusting the price range or region.
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((flight, i) => (
              <DestinationCard
                key={flight.id}
                index={i}
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
    </div>
  );
}
