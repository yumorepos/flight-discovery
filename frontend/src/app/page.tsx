"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ResultsPage from "./components/ResultsPage";

export default function Home() {
  const [searchState, setSearchState] = useState({
    origin: "",
    month: "",
    destination: "",
  });

  const handleSearch = (origin: string, month: string, destination?: string) => {
    setSearchState({ origin, month, destination: destination ?? "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">FlightDiscovery</p>
            <p className="text-lg font-bold text-slate-900">Inspiration-first flight deals</p>
          </div>
          <a href="#results" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Browse deals
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Discover high-value flight deals worth booking</h1>
            <p className="mt-4 text-base text-blue-100 md:text-xl">
              Search by city or IATA, explore by region, and compare final fares including taxes.
            </p>
          </div>
          <div className="mt-10">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <main id="results">
        <ResultsPage origin={searchState.origin} month={searchState.month} destination={searchState.destination} />
      </main>
    </div>
  );
}
