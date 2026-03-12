"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
type FlightSource = "live-api" | "demo-fallback" | "unknown";

interface FlightResponse {
  flights: Flight[];
  source: FlightSource;
}

const REGION_LABELS: Record<string, string> = { NA: "Americas", EU: "Europe", Asia: "Asia", Oceania: "Oceania", AF: "Africa", SA: "South America" };

async function fetchFlights(origin: string, month: string, destination?: string): Promise<FlightResponse> {
  const params = new URLSearchParams({ origin });
  if (month) params.set("month", month);
  if (destination) params.set("destination", destination);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`/api/search?${params}`, { signal: controller.signal });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const detail = payload?.detail ?? "Unable to load fares right now.";
      throw new Error(detail);
    }

    const flights = await response.json();
    const sourceHeader = response.headers.get("x-flight-source");
    const source: FlightSource = sourceHeader === "live-api" || sourceHeader === "demo-fallback" ? sourceHeader : "unknown";
    return { flights, source };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Fare search timed out. Please retry in a moment.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const parseHours = (duration: string) => {
  const h = Number(duration.match(/(\d+)h/)?.[1] ?? 0);
  const m = Number(duration.match(/(\d+)m/)?.[1] ?? 0);
  return h + m / 60;
};

const sourceMeta = (source: FlightSource) => {
  if (source === "live-api") return { label: "Live fares", detail: "Updated just now", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (source === "demo-fallback") return { label: "Preview mode", detail: "Sample fares for demo", badgeClass: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Fares", detail: "Latest available", badgeClass: "border-slate-200 bg-slate-50 text-slate-700" };
};

function LoadingSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-3">
            <div className="h-4 w-1/5 rounded bg-slate-200" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-10 rounded-lg bg-white" />
              <div className="h-10 rounded-lg bg-white" />
              <div className="h-10 rounded-lg bg-white" />
              <div className="h-10 rounded-lg bg-white" />
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-300 to-fuchsia-300 p-4" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-24 rounded-full bg-slate-200" />
            <div className="h-7 w-28 rounded-full bg-slate-200" />
            <div className="h-7 w-24 rounded-full bg-slate-200" />
            <div className="h-7 w-20 rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="my-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-8 w-24 rounded-full bg-slate-100" />))}
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-[1.7rem] border-2 border-violet-100 bg-white shadow-[0_16px_40px_rgba(124,58,237,0.08)]">
            <div className="aspect-[16/8] w-full bg-slate-200" />
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-8 w-40 rounded-lg bg-slate-100" />
                  <div className="h-4 w-64 rounded bg-slate-100" />
                </div>
                <div className="h-20 w-20 rounded-full bg-violet-100" />
              </div>
              <div className="h-12 rounded-2xl bg-violet-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
                <div className="aspect-[16/10] w-full bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-2/5 rounded-lg bg-slate-100" />
                  <div className="h-4 w-3/5 rounded-lg bg-slate-100" />
                  <div className="h-11 rounded-xl bg-violet-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,191,0.25),transparent_55%)]" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Connection issue</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Unable to load fares right now.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">Please try again in a moment. You can also broaden filters once results are back to reveal more destination deals.</p>
          <p className="mt-3 text-xs text-slate-500">Technical detail: {error}</p>
          <button onClick={onRetry} className="mx-auto mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 px-6 text-sm font-bold text-white shadow-[0_12px_26px_rgba(124,58,237,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(124,58,237,0.42)]">Retry search</button>
        </div>
      </div>
    </section>
  );
}

export default function ResultsPage({ origin = "YUL", month = "", destination = "", flexibleDates = true, fareClass = "Any" }: ResultsPageProps) {
  const { currency, rates } = useCurrency();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState<FlightSource>("unknown");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");
  const [activeRegion, setActiveRegion] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [maxPriceCad, setMaxPriceCad] = useState(3000);
  const [maxStops, setMaxStops] = useState(2);
  const [maxDurationHours, setMaxDurationHours] = useState(30);
  const [requestToken, setRequestToken] = useState(0);

  const loadFlights = useCallback(() => {
    queueMicrotask(() => setLoading(true));
    fetchFlights(origin, month, destination || undefined)
      .then((result) => {
        setFlights(result.flights);
        setSource(result.source);
        setLastUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setError("");
      })
      .catch((loadError) => {
        setFlights([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load fares right now. Please try again in a moment.");
      })
      .finally(() => setLoading(false));
  }, [origin, month, destination]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights, requestToken]);

  const handleRetry = () => {
    setRequestToken((prev) => prev + 1);
  };

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
  const topRegion = useMemo(() => {
    const counts = filtered.reduce<Record<string, number>>((acc, flight) => {
      acc[flight.region] = (acc[flight.region] ?? 0) + 1;
      return acc;
    }, {});
    const [key] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
    return key ? REGION_LABELS[key] ?? key : "N/A";
  }, [filtered]);
  const [featuredFlight, ...standardFlights] = filtered;

  const resetFilters = () => {
    setActiveRegion("All");
    setSortKey("value");
    setMaxStops(2);
    setMaxDurationHours(30);
    setMaxPriceCad(maxFlightPriceCad);
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={handleRetry} />;

  const sourceInfo = sourceMeta(source);

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

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className={`rounded-full border px-3 py-1 ${sourceInfo.badgeClass}`}>{sourceInfo.label}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">{filtered.length} fares found</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Top region: {topRegion}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">{sourceInfo.detail}{lastUpdatedAt ? ` · ${lastUpdatedAt}` : ""}</span>
          </div>
          {source === "demo-fallback" && (
            <p className="mt-2 text-xs text-amber-700">Preview mode is active while live fare services are unavailable. Search and filters remain fully interactive.</p>
          )}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">No matching fares</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">No deals fit your current filters.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">Try broadening your search to surface more destinations and price opportunities.</p>
              <ul className="mx-auto mt-4 max-w-xl space-y-1 text-sm text-slate-600">
                <li>• Increase max price or duration range.</li>
                <li>• Switch region to All regions.</li>
                <li>• Use Any fare class for broader inventory.</li>
              </ul>
              <button onClick={resetFilters} className="mx-auto mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-5 text-sm font-bold text-violet-700 transition hover:bg-violet-100">Reset filters</button>
            </motion.div>
          ) : (
            <motion.div className="space-y-5">
              {featuredFlight && (
                <div className="relative rounded-[1.8rem] border-2 border-violet-100/90 bg-gradient-to-b from-violet-50/40 to-white p-1.5">
                  <div className="pointer-events-none absolute right-5 top-4 rounded-full border border-violet-200 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">Featured deal</div>
                  <DestinationCard key={featuredFlight.id} index={0} featured origin={featuredFlight.origin} city={featuredFlight.city} country={featuredFlight.country} destination={featuredFlight.destination} totalPrice={featuredFlight.total_price} taxAmount={featuredFlight.tax_amount} date={featuredFlight.date} airline={featuredFlight.airline} duration={featuredFlight.duration} stops={featuredFlight.stops} dealScore={featuredFlight.deal_score} dealClassification={featuredFlight.deal_classification} valueScore={featuredFlight.value_score} historicalPrice={featuredFlight.historical_price} destinationEmoji={featuredFlight.destination_emoji} bookingUrl={featuredFlight.booking_url} region={featuredFlight.region} priceInsight={featuredFlight.price_insight} fare={featuredFlight.fare} trend={featuredFlight.trend} />
                </div>
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
