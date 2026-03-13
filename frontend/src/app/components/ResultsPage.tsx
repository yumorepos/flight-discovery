"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import DestinationCard from "./DestinationCard";
import { useCurrency } from "./CurrencyProvider";
import { convertPrice, convertToCad, formatPrice } from "@/lib/currency";
import { buildFareMetadata, buildTrendSeries, CabinClass } from "@/lib/flightEnrichment";
import { buildDemoFlights } from "@/lib/demoFlights";
import { getDestinationImageSet } from "@/lib/destinationImages";
import { getDestinationInspiration } from "@/lib/destinationInspiration";

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

interface CuratedSection {
  id: string;
  title: string;
  subtitle: string;
  rationale: string;
  flights: Flight[];
}

const dedupeByDestination = (items: Flight[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.destination)) return false;
    seen.add(item.destination);
    return true;
  });
};

const REGION_LABELS: Record<string, string> = { NA: "Americas", EU: "Europe", Asia: "Asia", Oceania: "Oceania", AF: "Africa", SA: "South America" };

const WARM_REGIONS = new Set(["SA", "AF", "Oceania"]);

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

const parseIsoDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDaysUntilFlight = (flightDate: string) => {
  const date = parseIsoDate(flightDate);
  if (!date) return Number.POSITIVE_INFINITY;
  return (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
};

const pickUniqueFlights = (pool: Flight[], count: number, usedDestinations: Set<string>) => {
  const picks: Flight[] = [];
  for (const flight of pool) {
    if (picks.length >= count) break;
    if (usedDestinations.has(flight.destination)) continue;
    picks.push(flight);
    usedDestinations.add(flight.destination);
  }
  return picks;
};

const sourceMeta = (source: FlightSource) => {
  if (source === "live-api") return { label: "Live fares", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (source === "demo-fallback") return { label: "Preview fares", badgeClass: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Fare data", badgeClass: "border-slate-200 bg-slate-50 text-slate-700" };
};

function LoadingSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] md:p-6">
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

        <div className="my-5 flex flex-wrap gap-2.5">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
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

  const enrichedFlights = useMemo(() => {
    const liveOrFallback = dedupeByDestination(flights);
    const needsMoreDiscovery = liveOrFallback.length < 6;
    const previewPool = needsMoreDiscovery ? buildDemoFlights(origin, month, "anywhere") : [];

    const mergedFlights = dedupeByDestination([...liveOrFallback, ...previewPool]).slice(0, 12);

    return mergedFlights.map((flight) => ({
      ...flight,
      fare: buildFareMetadata(`${flight.id}-${flight.destination}`, flight.airline, flight.stops ?? 0),
      trend: buildTrendSeries(flight.total_price, month),
    }));
  }, [flights, month, origin]);

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

  const curatedSections = useMemo<CuratedSection[]>(() => {
    const candidates = filtered.length >= 8 ? filtered : enrichedFlights;
    if (!candidates.length) return [];

    const used = new Set<string>();
    const sections: CuratedSection[] = [];
    const underThresholdCad = 700;

    const bestValuePool = [...candidates].sort((a, b) => b.value_score - a.value_score || a.total_price - b.total_price);
    const bestValueFlights = pickUniqueFlights(bestValuePool, 3, used);
    if (bestValueFlights.length) {
      sections.push({
        id: "best-value",
        title: "Best value this month",
        subtitle: "High score-to-price routes with strong upside.",
        rationale: "Ranked by value score and deal quality.",
        flights: bestValueFlights,
      });
    }

    const weekendPool = [...candidates]
      .filter((flight) => {
        const date = parseIsoDate(flight.date);
        const day = date?.getDay();
        return day === 4 || day === 5 || day === 6;
      })
      .sort((a, b) => parseHours(a.duration) - parseHours(b.duration) || a.total_price - b.total_price);
    const weekendFlights = pickUniqueFlights(weekendPool, 3, used);
    if (weekendFlights.length) {
      sections.push({
        id: "weekend-escapes",
        title: "Weekend escapes",
        subtitle: "Shorter itineraries for easy spontaneous trips.",
        rationale: "Friday/Saturday departures with low friction flight times.",
        flights: weekendFlights,
      });
    }

    const warmPool = [...candidates]
      .filter((flight) => WARM_REGIONS.has(flight.region) || ["Cancún", "Honolulu", "Lima"].includes(flight.city))
      .sort((a, b) => a.total_price - b.total_price);
    const warmFlights = pickUniqueFlights(warmPool, 3, used);
    if (warmFlights.length) {
      sections.push({
        id: "warm-picks",
        title: "Warm-weather picks",
        subtitle: "Sun-led routes curated for a climate reset.",
        rationale: "Favoring warmer regions and beach-friendly cities.",
        flights: warmFlights,
      });
    }

    const budgetPool = [...candidates].filter((flight) => flight.total_price <= underThresholdCad).sort((a, b) => a.total_price - b.total_price);
    const budgetFlights = pickUniqueFlights(budgetPool, 3, used);
    if (budgetFlights.length) {
      sections.push({
        id: "under-threshold",
        title: `Under ${formatPrice(underThresholdCad, currency, rates)}`,
        subtitle: "Low-fare options to keep discovery practical.",
        rationale: "Prioritizes routes below the affordability threshold.",
        flights: budgetFlights,
      });
    }

    const longHaulPool = [...candidates]
      .filter((flight) => parseHours(flight.duration) >= 10 || getDaysUntilFlight(flight.date) > 45)
      .sort((a, b) => b.deal_score - a.deal_score);
    const longHaulFlights = pickUniqueFlights(longHaulPool, 3, used);
    if (longHaulFlights.length) {
      sections.push({
        id: "long-haul",
        title: "Long-haul highlights",
        subtitle: "Bigger journeys surfaced for strategic planning.",
        rationale: "Weighted toward stronger long-duration value opportunities.",
        flights: longHaulFlights,
      });
    }

    return sections.slice(0, 4);
  }, [currency, enrichedFlights, filtered, rates]);

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
  const discoveryMode = destination ? destination.toUpperCase() === "ANYWHERE" : true;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] md:p-6">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-semibold text-slate-700">Sort
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2">
                  <option value="value">Best value</option><option value="deal">Deal score</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Max {formatPrice(maxPriceCad, currency, rates)}
                <input type="range" min={minPriceDisplay} max={maxFlightPriceDisplay} value={Math.min(selectedPriceDisplay, maxFlightPriceDisplay)} onChange={(e) => setMaxPriceCad(Math.round(convertToCad(Number(e.target.value), currency, rates)))} className="mt-2 w-full accent-orange-500" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Stops: {maxStops === 2 ? "Any" : maxStops}
                <input type="range" min={0} max={2} value={maxStops} onChange={(e) => setMaxStops(Number(e.target.value))} className="mt-2 w-full accent-orange-500" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Duration: {maxDurationHours}h
                <input type="range" min={4} max={30} value={maxDurationHours} onChange={(e) => setMaxDurationHours(Number(e.target.value))} className="mt-2 w-full accent-orange-500" />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white shadow-lg shadow-orange-200/40">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-100">Insights</p>
            <p className="mt-2 text-sm font-semibold">Best month: <span className="font-bold">{bestMonth ? `${bestMonth.month} · ${formatPrice(bestMonth.avg, currency, rates)}` : "N/A"}</span></p>
            <p className="mt-1.5 text-sm">Showing {filtered.length} of {enrichedFlights.length} fares</p>
            <p className="mt-2 text-xs text-orange-100/95">{discoveryMode ? "Anywhere mode keeps destination variety high for true discovery." : "Set destination to Anywhere for broader destination inspiration."} {flexibleDates ? "Flexible dates are on for wider fare coverage." : "Turn on flexible dates for even better discovery."}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-white p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Results snapshot</p>
            <p className="text-xs font-medium text-slate-500">Updated {lastUpdatedAt || "just now"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className={`rounded-full border px-3 py-1 ${sourceInfo.badgeClass}`}>{sourceInfo.label}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">{filtered.length} fares found</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Top region: {topRegion}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">Best month: {bestMonth ? bestMonth.month : "N/A"}</span>
          </div>
          {(source === "demo-fallback" || flights.length < 6) && (
            <p className="mt-2 text-xs text-amber-700">Showing preview fares while live airline feeds reconnect. Filters and ranking remain fully interactive.</p>
          )}
        </div>

        <div className="my-5 flex flex-wrap gap-2.5">
          {["All", ...regions].map((region) => (
            <button key={region} onClick={() => setActiveRegion(region)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${activeRegion === region ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
              {region === "All" ? "All regions" : REGION_LABELS[region] ?? region}
            </button>
          ))}
        </div>

        {curatedSections.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">Curated discovery</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">Browse intelligently picked routes before deep filtering</h3>
              </div>
              <p className="text-xs text-slate-500">Sections stay populated even when live inventory is thin.</p>
            </div>
            {curatedSections.map((section) => (
              <article key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50/55 p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{section.title}</h4>
                    <p className="text-sm text-slate-600">{section.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">{section.rationale}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {section.flights.map((flight) => {
                    const inspiration = getDestinationInspiration(flight.city, flight.region);
                    const image = getDestinationImageSet(flight.city, flight.region).landscape;
                    return (
                      <div key={`${section.id}-${flight.id}`} className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image src={image} alt={flight.city} fill unoptimized className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                          <p className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800">{REGION_LABELS[flight.region] ?? flight.region}</p>
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-lg font-black leading-tight text-white">{flight.city}</p>
                            <p className="text-xs text-white/90">{flight.country}</p>
                          </div>
                        </div>
                        <div className="space-y-2.5 p-3.5">
                          <p className="text-xl font-black text-orange-600">{formatPrice(flight.total_price, currency, rates)}</p>
                          <p className="text-xs font-semibold text-slate-600">{inspiration.seasonHook} · Best for {inspiration.bestFor.toLowerCase()}</p>
                          <p className="line-clamp-2 text-sm text-slate-700">{inspiration.blurb}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}

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
                <li>• Try Anywhere to unlock destination-first discovery mode.</li>
              </ul>
              <button onClick={resetFilters} className="mx-auto mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-orange-700 transition hover:bg-orange-100">Reset filters</button>
            </motion.div>
          ) : (
            <motion.div className="space-y-5">
              {featuredFlight && (
                <div className="relative rounded-[1.8rem] border-2 border-orange-100/90 bg-gradient-to-b from-orange-50/40 to-white p-1.5">
                  <div className="pointer-events-none absolute right-5 top-4 rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">Featured deal</div>
                  <DestinationCard key={featuredFlight.id} index={0} featured origin={featuredFlight.origin} city={featuredFlight.city} country={featuredFlight.country} destination={featuredFlight.destination} totalPrice={featuredFlight.total_price} taxAmount={featuredFlight.tax_amount} date={featuredFlight.date} airline={featuredFlight.airline} duration={featuredFlight.duration} stops={featuredFlight.stops} dealScore={featuredFlight.deal_score} dealClassification={featuredFlight.deal_classification} valueScore={featuredFlight.value_score} historicalPrice={featuredFlight.historical_price} destinationEmoji={featuredFlight.destination_emoji} bookingUrl={featuredFlight.booking_url} region={featuredFlight.region} priceInsight={featuredFlight.price_insight} fare={featuredFlight.fare} trend={featuredFlight.trend} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
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
