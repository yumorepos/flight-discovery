"use client";

import { useState } from "react";
import Image from "next/image";
import SearchForm from "./components/SearchForm";
import ResultsPage from "./components/ResultsPage";
import { CurrencyProvider, useCurrency } from "./components/CurrencyProvider";
import { CURRENCY_META, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { getDestinationImageSet } from "@/lib/destinationImages";
import type { CabinClass } from "@/lib/flightEnrichment";

const SPOTLIGHTS = [
  { city: "Paris", note: "Café terraces + iconic boulevards", priceHint: "from 648 CAD" },
  { city: "Tokyo", note: "Design districts and late-night ramen", priceHint: "from 1028 CAD" },
  { city: "Cancún", note: "Warm-water escapes and easy beach downtime", priceHint: "from 452 CAD" },
];

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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-lg text-white shadow-lg shadow-orange-400/40">✈</span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-700">FlightFinder</p>
              <p className="text-sm font-semibold text-slate-900 md:text-base">Free flight deal finder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
              {SUPPORTED_CURRENCIES.map((code) => (<option key={code} value={code}>{CURRENCY_META[code].label}</option>))}
            </select>
            <a href="#results" className="hidden rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 md:block">Explore fares</a>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden pb-24 pt-14 text-white md:pb-32 md:pt-20">
        <div className="hero-gradient-animated absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_40%),linear-gradient(160deg,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100">Destination-first fare discovery</p>
            <h1 className="mt-6 text-balance text-4xl font-black leading-tight md:text-6xl">Discover bold destinations with premium fare intelligence</h1>
          </div>
          <div className="mx-auto mt-10 max-w-6xl md:mt-12">
            <SearchForm onSearch={handleSearch} />
            <p className="mt-4 text-center text-sm font-medium text-orange-100/95">Scans millions of fares daily to highlight the most inspiring routes first.</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {SPOTLIGHTS.map((spot) => {
              const image = getDestinationImageSet(spot.city, "").landscape;
              return (
                <article key={spot.city} className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="absolute inset-0">
                    <Image src={image} alt={spot.city} fill unoptimized className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent" />
                  </div>
                  <div className="relative min-h-36">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-100">Trending now</p>
                    <p className="mt-8 text-2xl font-black">{spot.city}</p>
                    <p className="text-sm text-white/90">{spot.note}</p>
                    <p className="mt-2 text-xs font-semibold text-orange-200">{spot.priceHint}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <main id="results" className="-mt-8 pb-16 md:-mt-14">
        <ResultsPage origin={searchState.origin} month={searchState.month} destination={searchState.destination} flexibleDates={searchState.flexibleDates} fareClass={searchState.fareClass} />
      </main>

      <footer className="mt-24 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-2 text-sm text-slate-600">
            <strong className="text-slate-900">FlightFinder</strong> is a portfolio project exploring destination-first travel discovery.
          </p>
          <p className="text-sm text-slate-600">
            Built with Next.js, TypeScript, and Tailwind CSS.
            <a href="https://github.com/yumorepos/flight-discovery" target="_blank" rel="noopener noreferrer" className="ml-1 text-orange-600 hover:text-orange-700 hover:underline">
              View source on GitHub →
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <CurrencyProvider>
      <HomeContent />
      <EmailCaptureModal />
    </CurrencyProvider>
  );
}

import EmailCaptureModal from "./components/EmailCaptureModal";
