"use client";

import { useState, useEffect, useRef } from "react";

interface Airport {
  code: string;
  city: string;
  country: string;
  region: string;
}

interface SearchFormProps {
  onSearch: (origin: string, month: string, destination?: string) => void;
}

const MONTHS = [
  { value: "03", label: "March 2026" },
  { value: "04", label: "April 2026" },
  { value: "05", label: "May 2026" },
  { value: "06", label: "June 2026" },
  { value: "07", label: "July 2026" },
  { value: "08", label: "August 2026" },
];

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [month, setMonth] = useState("");
  const [destination, setDestination] = useState("");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<{ origin?: string; month?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/airports")
      .then((r) => r.json())
      .then((data: Airport[]) => setAirports(data))
      .catch(() => {
        // Fallback static list if backend not running
        setAirports([
          { code: "YUL", city: "Montreal", country: "Canada", region: "NA" },
          { code: "YYZ", city: "Toronto", country: "Canada", region: "NA" },
          { code: "YVR", city: "Vancouver", country: "Canada", region: "NA" },
          { code: "JFK", city: "New York", country: "USA", region: "NA" },
          { code: "LAX", city: "Los Angeles", country: "USA", region: "NA" },
          { code: "ORD", city: "Chicago", country: "USA", region: "NA" },
          { code: "LHR", city: "London", country: "UK", region: "EU" },
          { code: "CDG", city: "Paris", country: "France", region: "EU" },
        ]);
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedAirport = airports.find((a) => a.code === origin);

  const validate = () => {
    const errs: { origin?: string; month?: string } = {};
    if (!origin || origin.length !== 3) {
      errs.origin = "Please select a departure airport";
    }
    return errs;
  };

  const handleSearch = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const monthFormatted = month ? `2026-${month}` : "";
    onSearch(origin.toUpperCase(), monthFormatted, destination || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="glass-morphism p-6 rounded-2xl shadow-2xl w-full max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Origin Airport Dropdown */}
        <div className="md:col-span-1" ref={dropdownRef}>
          <label className="block text-white text-xs font-semibold uppercase tracking-wide mb-1">
            From
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`w-full text-left px-4 py-3 rounded-xl bg-white/90 text-gray-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                errors.origin ? "ring-2 ring-red-400" : ""
              }`}
            >
              {selectedAirport ? (
                <span>
                  <span className="font-bold text-blue-700">{selectedAirport.code}</span>
                  <span className="text-gray-500 text-sm ml-1">· {selectedAirport.city}</span>
                </span>
              ) : (
                <span className="text-gray-400">Select airport…</span>
              )}
              <span className="absolute right-3 top-3.5 text-gray-400">▾</span>
            </button>

            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                {airports.map((ap) => (
                  <button
                    key={ap.code}
                    type="button"
                    onClick={() => {
                      setOrigin(ap.code);
                      setShowDropdown(false);
                      setErrors((e) => ({ ...e, origin: undefined }));
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-blue-700 mr-2">{ap.code}</span>
                      <span className="text-gray-700">{ap.city}</span>
                    </div>
                    <span className="text-xs text-gray-400">{ap.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.origin && (
            <p className="text-red-300 text-xs mt-1 font-medium">{errors.origin}</p>
          )}
        </div>

        {/* Month Selector */}
        <div className="md:col-span-1">
          <label className="block text-white text-xs font-semibold uppercase tracking-wide mb-1">
            When
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="">Any month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destination (optional) */}
        <div className="md:col-span-1">
          <label className="block text-white text-xs font-semibold uppercase tracking-wide mb-1">
            Destination
          </label>
          <input
            type="text"
            placeholder="e.g. Paris, Tokyo…"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-400 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg"
        aria-label="Search Flights"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search Flights
      </button>
    </div>
  );
}
