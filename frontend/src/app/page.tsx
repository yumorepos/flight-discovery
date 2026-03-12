"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ResultsPage from "./components/ResultsPage";
import { CurrencyProvider, useCurrency } from "./components/CurrencyProvider";
import { CURRENCY_META, SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { CabinClass } from "@/lib/flightEnrichment";

function HomeContent() {
  const [searchState, setSearchState] = useState({
    origin: "YUL",
    month: "",
    destination: "",
    flexibleDates: true,
    fareClass: "Any" as "Any" | CabinClass,
  });
  const { currency, setCurrency } = useCurrency();

  const handleSearch = (origin: string, month: string, destination?: string, flexibleDates = true, fareClass: "Any" | CabinClass = "Any") => {
    setSearchState({ origin, month, destination: destination ?? "", flexibleDates, fareClass });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg text-white shadow-lg shadow-violet-400/30">✈</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-700">FlightFinder</p>
              <p className="text-sm font-semibold text-slate-900 md:text-base">Premium destination deals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              {SUPPORTED_CURRENCIES.map((code) => (<option key={code} value={code}>{CURRENCY_META[code].label}</option>))}
            </select>
            <a href="#results" className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 md:block">Explore fares</a>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_10%_0%,_#a78bfa_0%,_#7c3aed_35%,_#4c1d95_68%,_#1e1b4b_100%)] pb-20 pt-12 text-white md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.2),transparent_40%),linear-gradient(160deg,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">Destination-first fare discovery</p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-tight md:text-6xl">Find your next trip at a truly great fare</h1>
          </div>
          <div className="mx-auto mt-8 max-w-6xl md:mt-10">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      <main id="results" className="-mt-8 pb-16 md:-mt-14">
        <ResultsPage origin={searchState.origin} month={searchState.month} destination={searchState.destination} flexibleDates={searchState.flexibleDates} fareClass={searchState.fareClass} />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <CurrencyProvider>
      <HomeContent />
    </CurrencyProvider>
  );
}
