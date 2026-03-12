"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import airportsData from "@/data/airports.json";

interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
}

interface SearchFormProps {
  onSearch: (origin: string, month: string, destination?: string, flexibleDates?: boolean) => void;
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
    onSearch(origin.iata.toUpperCase(), month, destination?.iata.toUpperCase() ?? flexibleDestination, flexibleDates);
  };

  const inputClassName =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-[0_3px_12px_rgba(15,23,42,0.06)] transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100";

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.8rem] border border-white/60 bg-white/95 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Smart search</p>
          <p className="text-sm text-slate-600">Discover the best-value routes with tax-inclusive fares and real-time ranking.</p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Trusted pricing intelligence</span>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr_1.2fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Departing from</label>
            <input
              aria-label="Origin airport"
              list="origin-airports"
              value={originInput}
              onChange={(event) => {
                setOriginInput(event.target.value);
                setError("");
              }}
              placeholder="Montreal or YUL"
              className={inputClassName}
            />
            <datalist id="origin-airports">
              {(airportsData as Airport[]).slice(0, 160).map((airport) => (
                <option key={`origin-${airport.iata}`} value={formatAirport(airport)}>{airport.country}</option>
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Travel month</label>
            <select aria-label="Travel month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClassName}>
              <option value="">Any month</option>
              {MONTHS.map((monthOption) => (
                <option key={monthOption.value} value={monthOption.value}>{monthOption.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Destination</label>
            <input
              aria-label="Destination airport or flexible region"
              list="destination-airports"
              value={destinationInput}
              onChange={(event) => {
                setDestinationInput(event.target.value);
                setError("");
              }}
              placeholder="Anywhere, Europe, Paris, NRT"
              className={inputClassName}
            />
            <datalist id="destination-airports">
              {popularSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
              {(airportsData as Airport[]).slice(0, 180).map((airport) => (
                <option key={`destination-${airport.iata}`} value={formatAirport(airport)}>{airport.country}</option>
              ))}
            </datalist>
          </div>

          <button
            type="submit"
            className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 text-sm font-bold text-white shadow-[0_14px_26px_rgba(124,58,237,0.38)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            Search fares
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={flexibleDates}
            onChange={(event) => setFlexibleDates(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-violet-600"
          />
          Flexible dates (+/- 3 days)
        </label>
        <p className="text-xs text-slate-500">Tip: use region keywords like Europe, Asia, or Beach for inspiration.</p>
      </div>

      {error && <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
    </form>
  );
}
