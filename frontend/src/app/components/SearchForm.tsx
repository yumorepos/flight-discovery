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
  onSearch: (origin: string, month: string, destination?: string) => void;
}

const NOW = new Date();
const MONTHS = Array.from({ length: 12 }, (_, idx) => {
  const date = new Date(NOW.getFullYear(), NOW.getMonth() + idx, 1);
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  return { value, label };
});

const formatAirport = (airport: Airport) => `${airport.city} (${airport.iata})`;
const MAX_FUZZY_MATCH_SCORE = 0.18;
const MIN_AMBIGUITY_SCORE_GAP = 0.05;

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [originInput, setOriginInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(airportsData as Airport[], {
        keys: ["city", "iata", "name", "country"],
        threshold: 0.35,
        includeScore: true,
      }),
    []
  );

  const resolveAirport = (value: string): Airport | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const codeMatch = trimmed.match(/\(([A-Z]{3})\)$/i)?.[1];
    if (codeMatch) {
      const fromCodeLabel = (airportsData as Airport[]).find((airport) => airport.iata.toUpperCase() === codeMatch.toUpperCase());
      if (fromCodeLabel) return fromCodeLabel;
    }

    const exactCode = (airportsData as Airport[]).find((airport) => airport.iata.toLowerCase() === trimmed.toLowerCase());
    if (exactCode) return exactCode;

    const exactCity = (airportsData as Airport[]).find((airport) => airport.city.toLowerCase() === trimmed.toLowerCase());
    if (exactCity) return exactCity;

    const exactName = (airportsData as Airport[]).find((airport) => airport.name.toLowerCase() === trimmed.toLowerCase());
    if (exactName) return exactName;

    if (trimmed.length < 3) {
      return null;
    }

    const fuzzyResults = fuse.search(trimmed, { limit: 3 });
    const fuzzyMatch = fuzzyResults[0];
    if (!fuzzyMatch || fuzzyMatch.score === undefined || fuzzyMatch.score > MAX_FUZZY_MATCH_SCORE) {
      return null;
    }

    const secondMatch = fuzzyResults[1];
    if (
      secondMatch?.score !== undefined &&
      secondMatch.score - fuzzyMatch.score < MIN_AMBIGUITY_SCORE_GAP
    ) {
      return null;
    }

    return fuzzyMatch.item;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const origin = resolveAirport(originInput);
    if (!origin) {
      setError("Enter a valid origin city or IATA code.");
      return;
    }

    const destination = resolveAirport(destinationInput);

    setError("");
    setOriginInput(formatAirport(origin));
    if (destination) {
      setDestinationInput(formatAirport(destination));
    }

    onSearch(origin.iata.toUpperCase(), month, destination?.iata.toUpperCase() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-morphism w-full rounded-2xl p-5 md:p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1.4fr_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-50">From</label>
          <input
            list="origin-airports"
            value={originInput}
            onChange={(event) => {
              setOriginInput(event.target.value);
              setError("");
            }}
            placeholder="e.g. Montreal or YUL"
            className="w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <datalist id="origin-airports">
            {(airportsData as Airport[]).map((airport) => (
              <option key={`origin-${airport.iata}`} value={formatAirport(airport)}>{airport.country}</option>
            ))}
          </datalist>
          {error && <p className="mt-1 text-xs font-medium text-red-200">{error}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-50">Travel month</label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Any time (best deals)</option>
            {MONTHS.map((monthOption) => (
              <option key={monthOption.value} value={monthOption.value}>{monthOption.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-50">To (optional)</label>
          <input
            list="destination-airports"
            value={destinationInput}
            onChange={(event) => setDestinationInput(event.target.value)}
            placeholder="Anywhere or destination"
            className="w-full rounded-xl border border-white/40 bg-white/95 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <datalist id="destination-airports">
            {(airportsData as Airport[]).map((airport) => (
              <option key={`destination-${airport.iata}`} value={formatAirport(airport)}>{airport.country}</option>
            ))}
          </datalist>
        </div>

        <button type="submit" className="h-[50px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-amber-600">
          Search deals
        </button>
      </div>
    </form>
  );
}
