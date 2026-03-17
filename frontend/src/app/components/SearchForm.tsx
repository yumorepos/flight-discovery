"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import airportsData from "@/data/airports.json";
import type { CabinClass } from "@/lib/flightEnrichment";

interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
}

interface SearchFormProps {
  onSearch: (origin: string, month: string, destination?: string, flexibleDates?: boolean, fareClass?: "Any" | CabinClass) => void;
}

const NOW = new Date();
const FLEXIBLE_DESTINATIONS = ["anywhere", "europe", "asia", "beach"];
const MONTHS = Array.from({ length: 18 }, (_, idx) => {
  const date = new Date(NOW.getFullYear(), NOW.getMonth() + idx, 1);
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  return { value, label };
});

const formatAirport = (airport: Airport) => `${airport.city} (${airport.iata})`;

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [originInput, setOriginInput] = useState("Montreal (YUL)");
  const [destinationInput, setDestinationInput] = useState("Anywhere");
  const [month, setMonth] = useState("");
  const [fareClass, setFareClass] = useState<"Any" | CabinClass>("Any");
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [error, setError] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(airportsData as Airport[], {
        keys: ["city", "iata", "name", "country"],
        threshold: 0.32,
      }),
    []
  );

  const popularSuggestions = useMemo(() => ["Anywhere", "Europe", "Asia", "Beach", "Tokyo (NRT)", "London (LHR)", "Paris (CDG)"], []);

  const resolveAirport = (value: string): Airport | null => {
    const trimmed = value.trim();
    if (!trimmed || FLEXIBLE_DESTINATIONS.includes(trimmed.toLowerCase())) return null;

    const codeMatch = trimmed.match(/\(([A-Z]{3})\)$/i)?.[1];
    if (codeMatch) {
      const fromCodeLabel = (airportsData as Airport[]).find((airport) => airport.iata.toUpperCase() === codeMatch.toUpperCase());
      if (fromCodeLabel) return fromCodeLabel;
    }

    const exactCode = (airportsData as Airport[]).find((airport) => airport.iata.toLowerCase() === trimmed.toLowerCase());
    if (exactCode) return exactCode;

    const exactCity = (airportsData as Airport[]).find((airport) => airport.city.toLowerCase() === trimmed.toLowerCase());
    if (exactCity) return exactCity;

    return fuse.search(trimmed, { limit: 1 })[0]?.item ?? null;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const origin = resolveAirport(originInput);
    const destinationToken = destinationInput.trim().toLowerCase();

    if (!origin) {
      setError("Enter a valid origin city or IATA code.");
      return;
    }

    const destination = resolveAirport(destinationInput);
    if (destinationInput.trim() && !destination && !FLEXIBLE_DESTINATIONS.includes(destinationToken)) {
      setError("Use a city, airport code, or flexible destination like Anywhere / Europe / Asia.");
      return;
    }

    setError("");
    setOriginInput(formatAirport(origin));
    if (destination) setDestinationInput(formatAirport(destination));

    const flexibleDestination = FLEXIBLE_DESTINATIONS.includes(destinationToken) ? destinationToken : undefined;
    onSearch(origin.iata.toUpperCase(), month, destination?.iata.toUpperCase() ?? flexibleDestination, flexibleDates, fareClass);
  };

  const inputClassName =
    "h-12 w-full rounded-xl border border-white/70 bg-white/95 px-4 text-sm font-medium text-slate-900 shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100";

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-white/60 bg-white/85 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-[10px] md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Smart search</p>
          <p className="text-sm text-slate-600">Discover the best-value routes with tax-inclusive fares and real-time ranking.</p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">Trusted pricing intelligence</span>
      </div>

      <div className="rounded-2xl border border-white/75 bg-white/60 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr_1.1fr_0.9fr_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Departing from</label>
            <input aria-label="Origin airport" list="origin-airports" value={originInput} onChange={(event) => { setOriginInput(event.target.value); setError(""); }} placeholder="Montreal or YUL" className={inputClassName} />
            <datalist id="origin-airports">{(airportsData as Airport[]).slice(0, 160).map((airport) => (<option key={`origin-${airport.iata}`} value={formatAirport(airport)} />))}</datalist>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Travel month</label>
            <select aria-label="Travel month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClassName}>
              <option value="">Any month</option>
              {MONTHS.map((monthOption) => (<option key={monthOption.value} value={monthOption.value}>{monthOption.label}</option>))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Destination</label>
            <input aria-label="Destination airport or flexible region" list="destination-airports" value={destinationInput} onChange={(event) => { setDestinationInput(event.target.value); setError(""); }} placeholder="Anywhere, Europe, Paris, NRT" className={inputClassName} />
            <datalist id="destination-airports">
              {popularSuggestions.map((suggestion) => (<option key={suggestion} value={suggestion} />))}
              {(airportsData as Airport[]).slice(0, 180).map((airport) => (<option key={`destination-${airport.iata}`} value={formatAirport(airport)} />))}
            </datalist>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Fare class</label>
            <select aria-label="Fare class" value={fareClass} onChange={(event) => setFareClass(event.target.value as "Any" | CabinClass)} className={inputClassName}>
              <option>Any</option><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option>
            </select>
          </div>

          <button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-[length:140%_140%] px-7 text-sm font-bold text-white shadow-[0_14px_26px_rgba(249,115,22,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[position:100%_50%] hover:shadow-[0_18px_34px_rgba(249,115,22,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 xl:w-auto">Search fares</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
          <input type="checkbox" checked={flexibleDates} onChange={(event) => setFlexibleDates(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-orange-500" />
          Flexible dates (+/- 3 days)
        </label>
        <p className="text-xs text-slate-500">Tip: use region keywords like Europe, Asia, or Beach for inspiration.</p>
      </div>

      {error && <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
    </form>
  );
}
