"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import airportsData from "@/data/airports.json";

interface Airport {
  iata: string;
  city: string;
  country: string;
  name: string;
  region?: string;
}

interface SearchFormProps {
  onSearch: (origin: string, month: string, destination?: string, flexibleDates?: boolean) => void;
}

const NOW = new Date();
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
    if (!trimmed || ["anywhere", "europe", "asia", "beach"].includes(trimmed.toLowerCase())) return null;

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

  const destinationToken = destinationInput.trim().toLowerCase();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const origin = resolveAirport(originInput);
    if (!origin) {
      setError("Enter a valid origin city or IATA code.");
      return;
    }

    const destination = resolveAirport(destinationInput);
    if (destinationInput.trim() && !destination && !["anywhere", "europe", "asia", "beach"].includes(destinationToken)) {
      setError("Use a city, airport code, or flexible destination like Anywhere/Europe/Asia.");
      return;
    }

    setError("");
    setOriginInput(formatAirport(origin));
    if (destination) setDestinationInput(formatAirport(destination));

    const flexibleDestination = ["anywhere", "europe", "asia", "beach"].includes(destinationToken)
      ? destinationInput.trim().toLowerCase()
      : undefined;

    onSearch(origin.iata.toUpperCase(), month, destination?.iata.toUpperCase() ?? flexibleDestination, flexibleDates);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/40 bg-white/95 p-5 shadow-[0_30px_70px_rgba(15,23,42,0.2)] backdrop-blur md:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1.2fr_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Departing from</label>
          <input
            list="origin-airports"
            value={originInput}
            onChange={(event) => {
              setOriginInput(event.target.value);
              setError("");
            }}
            placeholder="Montreal or YUL"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100"
          />
          <datalist id="origin-airports">
            {(airportsData as Airport[]).slice(0, 120).map((airport) => (
              <option key={`origin-${airport.iata}`} value={formatAirport(airport)}>
                {airport.country}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Travel month</label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100"
          >
            <option value="">Any month</option>
            {MONTHS.map((monthOption) => (
              <option key={monthOption.value} value={monthOption.value}>
                {monthOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-600">Destination</label>
          <input
            list="destination-airports"
            value={destinationInput}
            onChange={(event) => {
              setDestinationInput(event.target.value);
              setError("");
            }}
            placeholder="Anywhere, Europe, Paris, NRT"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100"
          />
          <datalist id="destination-airports">
            {popularSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
            {(airportsData as Airport[]).slice(0, 140).map((airport) => (
              <option key={`destination-${airport.iata}`} value={formatAirport(airport)}>
                {airport.country}
              </option>
            ))}
          </datalist>
        </div>

        <button type="submit" className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.4)] transition hover:brightness-110">
          Search fares
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={flexibleDates} onChange={(e) => setFlexibleDates(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
          Flexible dates (+/- 3 days)
        </label>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">Cheapest week and best month suggestions included</span>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
    </form>
  );
}
