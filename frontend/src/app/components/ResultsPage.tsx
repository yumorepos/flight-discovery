"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DestinationCard from "./DestinationCard";
import airportsData from "@/data/airports.json";

interface PriceInsight {
  usual_price: number;
  current_discount: number;
  discount_amount: number;
  historical_comparison: string;
}

interface Flight {
  id: number;
  origin: string;
  destination: string;
  city: string;
  country: string;
  total_price: number;
  tax_amount: number;
  date: string;
  airline: string;
  duration: string;
  stops?: number;
  value_score: number;
  region: string;
  deal_score: number;
  deal_classification: string;
  historical_price: number;
  destination_emoji: string;
  booking_url: string;
  price_insight?: PriceInsight;
}

interface ResultsPageProps {
  origin?: string;
  month?: string;
  destination?: string;
  flexibleDates?: boolean;
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
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || `Search failed with ${response.status}`);
  }

  return response.json();
}

const parseHours = (duration: string) => {
  const h = Number(duration.match(/(\d+)h/)?.[1] ?? 0);
  const m = Number(duration.match(/(\d+)m/)?.[1] ?? 0);
  return h + m / 60;
};

export default function ResultsPage({ origin = "", month = "", destination = "", flexibleDates = true }: ResultsPageProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRegion, setActiveRegion] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [maxStops, setMaxStops] = useState(2);
  const [maxDurationHours, setMaxDurationHours] = useState(30);

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

  const maxFlightPrice = useMemo(() => (flights.length ? Math.max(...flights.map((flight) => Math.round(flight.total_price))) : 3000), [flights]);

  useEffect(() => {
    setMaxPrice(maxFlightPrice);
  }, [maxFlightPrice]);

  const regions = useMemo(() => Array.from(new Set(flights.map((flight) => flight.region))), [flights]);

  const filtered = useMemo(() => {
    let list = flights.filter((flight) => Math.round(flight.total_price) <= maxPrice);
    list = list.filter((flight) => (flight.stops ?? 0) <= maxStops);
    list = list.filter((flight) => parseHours(flight.duration) <= maxDurationHours);
    if (activeRegion !== "All") list = list.filter((flight) => flight.region === activeRegion);

    switch (sortKey) {
      case "value":
        return [...list].sort((a, b) => b.value_score - a.value_score || a.total_price - b.total_price);
      case "deal":
        return [...list].sort((a, b) => b.deal_score - a.deal_score || b.value_score - a.value_score);
      case "price_asc":
        return [...list].sort((a, b) => a.total_price - b.total_price);
      case "price_desc":
        return [...list].sort((a, b) => b.total_price - a.total_price);
      default:
        return list;
    }
  }, [flights, activeRegion, maxPrice, sortKey, maxStops, maxDurationHours]);

  const calendarByMonth = useMemo(() => {
    const byMonth = new Map<string, number[]>();
    flights.forEach((f) => {
      const key = f.date.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)?.push(f.total_price);
    });
    return Array.from(byMonth.entries())
      .map(([key, prices]) => ({ month: key, avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [flights]);

  const bestMonth = useMemo(() => [...calendarByMonth].sort((a, b) => a.avg - b.avg)[0], [calendarByMonth]);

  const weekInsights = useMemo(() => {
    const buckets = new Map<string, number[]>();
    flights.forEach((f) => {
      const day = Number(f.date.slice(8, 10));
      const week = day <= 7 ? "Week 1" : day <= 14 ? "Week 2" : day <= 21 ? "Week 3" : "Week 4";
      if (!buckets.has(week)) buckets.set(week, []);
      buckets.get(week)?.push(f.total_price);
    });
    return ["Week 1", "Week 2", "Week 3", "Week 4"]
      .filter((week) => buckets.has(week))
      .map((week) => {
        const prices = buckets.get(week) ?? [];
        return { week, avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) };
      });
  }, [flights]);

  const cheapestWeek = useMemo(() => [...weekInsights].sort((a, b) => a.avg - b.avg)[0], [weekInsights]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="font-semibold text-rose-700">We couldn&apos;t load flight deals.</p>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-10">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] md:p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-700">Value ranked · intelligent deal scoring</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{filtered.length} flight deals from {airportMap.get(effectiveOrigin) ?? effectiveOrigin}</h2>
            <p className="mt-1 text-sm text-slate-500">{month ? `Travel window ${month}` : "Flexible travel dates"} · prices in CAD include taxes and fees.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <span className="px-2 text-sm font-semibold text-slate-600">Sort</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-violet-500 focus:outline-none">
              <option value="value">Best value first</option>
              <option value="deal">Highest deal score</option>
              <option value="price_asc">Lowest final price</option>
              <option value="price_desc">Highest final price</option>
            </select>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-700">Max price: CAD ${Math.min(maxPrice, maxFlightPrice).toLocaleString()}</p>
            <input type="range" min={150} max={maxFlightPrice} step={25} value={Math.min(maxPrice, maxFlightPrice)} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-2 w-full accent-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Max stops: {maxStops}</p>
            <input type="range" min={0} max={2} step={1} value={maxStops} onChange={(event) => setMaxStops(Number(event.target.value))} className="mt-2 w-full accent-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Max duration: {maxDurationHours}h</p>
            <input type="range" min={4} max={30} step={1} value={maxDurationHours} onChange={(event) => setMaxDurationHours(Number(event.target.value))} className="mt-2 w-full accent-violet-600" />
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Flexible date calendar</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {calendarByMonth.map((row) => (
                <div key={row.month} className={`rounded-xl p-2 text-sm ${bestMonth?.month === row.month ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-700"}`}>
                  <p className="font-semibold">{row.month}</p>
                  <p>Avg CAD ${row.avg}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Best month suggestion: {bestMonth ? `${bestMonth.month} (CAD $${bestMonth.avg})` : "Not enough data"}.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cheapest week insight {flexibleDates ? "(flex mode on)" : ""}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {weekInsights.map((row) => (
                <div key={row.week} className={`rounded-xl p-2 text-sm ${cheapestWeek?.week === row.week ? "bg-violet-100 text-violet-800" : "bg-white text-slate-700"}`}>
                  <p className="font-semibold">{row.week}</p>
                  <p>Avg CAD ${row.avg}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Cheapest week: {cheapestWeek ? `${cheapestWeek.week} (CAD $${cheapestWeek.avg})` : "Not enough data"}.</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Map exploration</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => {
              const regionFlights = filtered.filter((f) => f.region === region);
              const floor = regionFlights.length ? Math.min(...regionFlights.map((f) => f.total_price)) : 0;
              return (
                <button key={region} onClick={() => setActiveRegion(region)} className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-violet-300">
                  <p className="font-semibold text-slate-800">{REGION_LABELS[region] ?? region}</p>
                  <p className="text-xs text-slate-500">{regionFlights.length} pins · from CAD ${Math.round(floor)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-7 flex flex-wrap gap-2">
          {["All", ...regions].map((region) => (
            <button
              key={region}
              onClick={() => setActiveRegion(region)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                activeRegion === region ? "border-violet-500 bg-violet-600 text-white shadow-[0_6px_16px_rgba(124,58,237,0.35)]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {region === "All" ? "All regions" : REGION_LABELS[region] ?? region}
            </button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              {flights.length === 0 ? "No routes found for this search. Try another origin, month, or destination." : "No deals match these filters. Raise max price or broaden stops/duration/region."}
            </motion.div>
          ) : (
            <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((flight, index) => (
                <DestinationCard
                  key={flight.id}
                  id={flight.id}
                  index={index}
                  origin={flight.origin}
                  city={flight.city}
                  country={flight.country}
                  destination={flight.destination}
                  totalPrice={flight.total_price}
                  taxAmount={flight.tax_amount}
                  date={flight.date}
                  airline={flight.airline}
                  duration={flight.duration}
                  stops={flight.stops}
                  dealScore={flight.deal_score}
                  dealClassification={flight.deal_classification}
                  valueScore={flight.value_score}
                  historicalPrice={flight.historical_price}
                  destinationEmoji={flight.destination_emoji}
                  bookingUrl={flight.booking_url}
                  region={flight.region}
                  priceInsight={flight.price_insight}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
