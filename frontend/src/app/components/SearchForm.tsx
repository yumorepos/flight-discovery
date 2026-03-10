"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";
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

const MONTHS = [
  { value: "03", label: "March 2026" },
  { value: "04", label: "April 2026" },
  { value: "05", label: "May 2026" },
  { value: "06", label: "June 2026" },
  { value: "07", label: "July 2026" },
  { value: "08", label: "August 2026" },
];

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [originQuery, setOriginQuery] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [destQuery, setDestQuery] = useState("");
  const [selectedDest, setSelectedDest] = useState<Airport | null>(null);
  const [month, setMonth] = useState("");
  const [errors, setErrors] = useState<{ origin?: string }>({});

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(airportsData as Airport[], {
        keys: ["city", "iata", "name", "country"],
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 1,
      }),
    []
  );

  // Filter origin airports
  const filteredOrigins = useMemo(() => {
    if (!originQuery) return (airportsData as Airport[]).slice(0, 8);
    const results = fuse.search(originQuery);
    return results.slice(0, 8).map((r) => r.item);
  }, [originQuery, fuse]);

  // Filter destination airports
  const filteredDests = useMemo(() => {
    if (!destQuery) return (airportsData as Airport[]).slice(0, 8);
    const results = fuse.search(destQuery);
    return results.slice(0, 8).map((r) => r.item);
  }, [destQuery, fuse]);

  const validate = () => {
    const errs: { origin?: string } = {};
    if (!selectedOrigin) {
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
    onSearch(
      selectedOrigin!.iata.toUpperCase(),
      monthFormatted,
      selectedDest?.iata?.toUpperCase() || undefined
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="glass-morphism p-8 rounded-2xl shadow-2xl w-full max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Origin Airport Autocomplete */}
        <div className="md:col-span-1">
          <label className="block text-white text-xs font-bold uppercase tracking-wide mb-2">
            From
          </label>
          <Combobox value={selectedOrigin} onChange={setSelectedOrigin}>
            <div className="relative">
              <Combobox.Input
                className={`w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition placeholder-gray-400 ${
                  errors.origin ? "ring-2 ring-red-400" : ""
                }`}
                displayValue={(airport: Airport | null) =>
                  airport ? `${airport.city} (${airport.iata})` : ""
                }
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setErrors((err) => ({ ...err, origin: undefined }));
                }}
                placeholder="City, airport code..."
                autoComplete="off"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setOriginQuery("")}
              >
                <Combobox.Options className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white rounded-xl shadow-2xl border border-gray-100 py-1">
                  {filteredOrigins.length === 0 && originQuery !== "" ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No airports found.</div>
                  ) : (
                    filteredOrigins.map((airport) => (
                      <Combobox.Option
                        key={airport.iata}
                        value={airport}
                        className={({ active }) =>
                          `px-4 py-3 cursor-pointer transition-colors ${
                            active ? "bg-blue-50" : "bg-white"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`font-bold text-blue-700 mr-2 ${selected ? "underline" : ""}`}>
                                {airport.iata}
                              </span>
                              <span className="text-gray-700">{airport.city}</span>
                            </div>
                            <span className="text-xs text-gray-400">{airport.country}</span>
                          </div>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
          {errors.origin && (
            <p className="text-red-300 text-xs mt-1 font-medium">{errors.origin}</p>
          )}
        </div>

        {/* Month Selector */}
        <div className="md:col-span-1">
          <label className="block text-white text-xs font-bold uppercase tracking-wide mb-2">
            When
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="">Any month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Autocomplete (optional) */}
        <div className="md:col-span-1">
          <label className="block text-white text-xs font-bold uppercase tracking-wide mb-2">
            To (optional)
          </label>
          <Combobox value={selectedDest} onChange={setSelectedDest} nullable>
            <div className="relative">
              <Combobox.Input
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder-gray-400 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                displayValue={(airport: Airport | null) =>
                  airport ? `${airport.city} (${airport.iata})` : ""
                }
                onChange={(e) => setDestQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="City, airport code..."
                autoComplete="off"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setDestQuery("")}
              >
                <Combobox.Options className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white rounded-xl shadow-2xl border border-gray-100 py-1">
                  {filteredDests.length === 0 && destQuery !== "" ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No airports found.</div>
                  ) : (
                    filteredDests.map((airport) => (
                      <Combobox.Option
                        key={airport.iata}
                        value={airport}
                        className={({ active }) =>
                          `px-4 py-3 cursor-pointer transition-colors ${
                            active ? "bg-blue-50" : "bg-white"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`font-bold text-blue-700 mr-2 ${selected ? "underline" : ""}`}>
                                {airport.iata}
                              </span>
                              <span className="text-gray-700">{airport.city}</span>
                            </div>
                            <span className="text-xs text-gray-400">{airport.country}</span>
                          </div>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="mt-6 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-lg"
        aria-label="Search Flights"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find Your Next Adventure
      </button>
    </div>
  );
}
