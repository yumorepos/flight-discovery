"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ResultsPage from "./components/ResultsPage";

export default function Home() {
  const [searchState, setSearchState] = useState({
    origin: "YUL",
    month: "",
    destination: "",
  });

  const handleSearch = (origin: string, month: string, destination?: string) => {
    setSearchState({ origin, month, destination: destination ?? "" });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-lg text-white">✈</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">FlightFinder</p>
              <p className="text-base font-bold text-slate-900">Premium destination deals</p>
            </div>
          </div>
          <a href="#results" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            View fares
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#8b5cf6,_#6d28d9_45%,_#1e1b4b_100%)] pb-20 pt-16 text-white md:pb-28 md:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
              Destination-first fare discovery
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Find your next trip at a truly great fare</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-violet-100 md:text-xl">
              Explore hand-ranked flight deals by destination image, value score, and tax-inclusive final pricing.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <main id="results" className="-mt-10 md:-mt-16">
        <ResultsPage origin={searchState.origin} month={searchState.month} destination={searchState.destination} />
      </main>
    </div>
  );
}
