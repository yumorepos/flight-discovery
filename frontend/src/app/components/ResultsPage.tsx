"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DestinationCard from "./DestinationCard";
import { useCurrency } from "./CurrencyProvider";
import { convertPrice, convertToCad, formatPrice } from "@/lib/currency";
import { buildFareMetadata, buildTrendSeries, CabinClass } from "@/lib/flightEnrichment";

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
  fareClass?: "Any" | CabinClass;
}

type SortKey = "value" | "deal" | "price_asc" | "price_desc";

const REGION_LABELS: Record<string, string> = { NA: "Americas", EU: "Europe", Asia: "Asia", Oceania: "Oceania", AF: "Africa", SA: "South America" };

async function fetchFlights(origin: string, month: string, destination?: string): Promise<Flight[]> {
  const params = new URLSearchParams({ origin });
  if (month) params.set("month", month);
  if (destination) params.set("destination", destination);

  const response = await fetch(`/api/search?${params}`);
  if (!response.ok) throw new Error("Unable to load flights");
  return response.json();
}

const parseHours = (duration: string) => {
  const h = Number(duration.match(/(\d+)h/)?.[1] ?? 0);
  const m = Number(duration.match(/(\d+)m/)?.[1] ?? 0);
  return h + m / 60;
};

export default function ResultsPage({ origin = "YUL", month = "", destination = "", flexibleDates = true, fareClass = "Any" }: ResultsPageProps) {
  const { currency, rates } = useCurrency();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRegion, setActiveRegion] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [maxPriceCad, setMaxPriceCad] = useState(3000);
  const [maxStops, setMaxStops] = useState(2);
  const [maxDurationHours, setMaxDurationHours] = useState(30);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    fetchFlights(origin, month, destination || undefined)
      .then((result) => {
        setFlights(result);
        setError("");
      })
      .catch((loadError) => {
        setFlights([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load flights");
      })
      .finally(() => setLoading(false));
  }, [origin, month, destination]);

  const enrichedFlights = useMemo(
    () => flights.map((flight) => ({ ...flight, fare: buildFareMetadata(`${flight.id}-${flight.destination}`, flight.airline, flight.stops ?? 0), trend: buildTrendSeries(flight.total_price, month) })),
    [flights, month]
  );

  const maxFlightPriceCad = useMemo(() => (enrichedFlights.length ? Math.max(...enrichedFlights.map((f) => Math.round(f.total_price))) : 3000), [enrichedFlights]);
  const maxFlightPriceDisplay = Math.max(100, Math.round(convertPrice(maxFlightPriceCad, currency, rates)));
  const minPriceDisplay = Math.max(50, Math.round(convertPrice(100, currency, rates)));
  const selectedPriceDisplay = Math.round(convertPrice(maxPriceCad, currency, rates));

  useEffect(() => {
    setMaxPriceCad(maxFlightPriceCad);
  }, [maxFlightPriceCad]);

  const regions = useMemo(() => Array.from(new Set(enrichedFlights.map((f) => f.region))), [enrichedFlights]);

  const filtered = useMemo(() => {
    const effectiveMaxPrice = Math.min(maxPriceCad, maxFlightPriceCad);
    let list = enrichedFlights.filter((f) => Math.round(f.total_price) <= effectiveMaxPrice && (f.stops ?? 0) <= maxStops && parseHours(f.duration) <= maxDurationHours);
    if (activeRegion !== "All") list = list.filter((f) => f.region === activeRegion);
    if (fareClass !== "Any") list = list.filter((f) => f.fare.cabinClass === fareClass);

    return [...list].sort((a, b) => {
      if (sortKey === "deal") return b.deal_score - a.deal_score;
      if (sortKey === "price_asc") return a.total_price - b.total_price;
      if (sortKey === "price_desc") return b.total_price - a.total_price;
      return b.value_score - a.value_score;
    });
  }, [enrichedFlights, maxPriceCad, maxStops, maxDurationHours, activeRegion, fareClass, sortKey, maxFlightPriceCad]);

  const calendarByMonth = useMemo(() => {
    const byMonth = new Map<string, number[]>();
    enrichedFlights.forEach((f) => {
      const key = f.date.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)?.push(f.total_price);
    });
    return Array.from(byMonth.entries()).map(([key, prices]) => ({ month: key, avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) })).sort((a, b) => a.month.localeCompare(b.month));
  }, [enrichedFlights]);

  const bestMonth = useMemo(() => [...calendarByMonth].sort((a, b) => a.avg - b.avg)[0], [calendarByMonth]);
  const [featuredFlight, ...standardFlights] = filtered;

  if (loading) return <section className="mx-auto max-w-7xl px-4 py-10 md:px-6"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">Loading fares…</div></section>;
  if (error) return <section className="mx-auto max-w-7xl px-4 py-10 md:px-6"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">{error}</div></section>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-semibold text-slate-700">Sort
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2">
                  <option value="value">Best value</option><option value="deal">Deal score</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Max {formatPrice(maxPriceCad, currency, rates)}
                <input type="range" min={minPriceDisplay} max={maxFlightPriceDisplay} value={Math.min(selectedPriceDisplay, maxFlightPriceDisplay)} onChange={(e) => setMaxPriceCad(Math.round(convertToCad(Number(e.target.value), currency, rates)))} className="mt-2 w-full accent-violet-600" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Stops: {maxStops === 2 ? "Any" : maxStops}
                <input type="range" min={0} max={2} value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value))} className="mt-2 w-full accent-violet-600" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Duration: {maxDurationHours}h
                <input type="range" min={4} max={30} value={maxDurationHours} onChange={(e) => setMaxDurationHours(Number(e.target.value))} className="mt-2 w-full accent-violet-600" />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-fuchsia-500 p-4 text-white shadow-lg shadow-violet-200/40">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Insights</p>
            <p className="mt-2 text-sm">Best month: <span className="font-semibold">{bestMonth ? `${bestMonth.month} · ${formatPrice(bestMonth.avg, currency, rates)}` : "N/A"}</span></p>
            <p className="mt-2 text-sm">Showing {filtered.length} of {enrichedFlights.length} fares</p>
            <p className="mt-2 text-xs text-violet-100">{flexibleDates ? "Flexible dates enabled for broader fare intelligence." : "Enable flexible dates for richer forecasting."}</p>
          </div>
        </div>

        <div className="my-5 flex flex-wrap gap-2">
          {["All", ...regions].map((region) => (
            <button key={region} onClick={() => setActiveRegion(region)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${activeRegion === region ? "border-violet-500 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
              {region === "All" ? "All regions" : REGION_LABELS[region] ?? region}
            </button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No deals match these filters.</motion.div>
          ) : (
            <motion.div className="space-y-5">
              {featuredFlight && (
                <DestinationCard key={featuredFlight.id} index={0} featured origin={featuredFlight.origin} city={featuredFlight.city} country={featuredFlight.country} destination={featuredFlight.destination} totalPrice={featuredFlight.total_price} taxAmount={featuredFlight.tax_amount} date={featuredFlight.date} airline={featuredFlight.airline} duration={featuredFlight.duration} stops={featuredFlight.stops} dealScore={featuredFlight.deal_score} dealClassification={featuredFlight.deal_classification} valueScore={featuredFlight.value_score} historicalPrice={featuredFlight.historical_price} destinationEmoji={featuredFlight.destination_emoji} bookingUrl={featuredFlight.booking_url} region={featuredFlight.region} priceInsight={featuredFlight.price_insight} fare={featuredFlight.fare} trend={featuredFlight.trend} />
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {standardFlights.map((flight, index) => (
                  <DestinationCard key={flight.id} index={index + 1} origin={flight.origin} city={flight.city} country={flight.country} destination={flight.destination} totalPrice={flight.total_price} taxAmount={flight.tax_amount} date={flight.date} airline={flight.airline} duration={flight.duration} stops={flight.stops} dealScore={flight.deal_score} dealClassification={flight.deal_classification} valueScore={flight.value_score} historicalPrice={flight.historical_price} destinationEmoji={flight.destination_emoji} bookingUrl={flight.booking_url} region={flight.region} priceInsight={flight.price_insight} fare={flight.fare} trend={flight.trend} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
