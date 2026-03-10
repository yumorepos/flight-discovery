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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>✈️</span>
            <span className="text-xl font-extrabold text-blue-700 tracking-tight">FlightFinder</span>
            <span className="hidden sm:inline-block text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-1">
              CAD deals
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#search" className="hover:text-blue-700 transition-colors">Search</a>
            <a href="#results" className="hover:text-blue-700 transition-colors">Deals</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="search"
        className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl rotate-12 select-none">✈️</div>
          <div className="absolute top-24 right-20 text-6xl -rotate-6 select-none">🌍</div>
          <div className="absolute bottom-10 left-1/4 text-5xl rotate-6 select-none">🗺️</div>
          <div className="absolute bottom-6 right-10 text-7xl rotate-3 select-none">🏖️</div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Discover Amazing
            <br />
            <span className="text-orange-400">Flight Deals</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Real-time deal scoring and value ranking to find the best CAD flight prices from major Canadian and international airports.
          </p>
          <div className="flex justify-center">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Deal highlights bar */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">🔥 <strong>Mistake Fare</strong> = 90+ deal score</span>
            <span className="flex items-center gap-1">⚡ <strong>Hot Deal</strong> = 75–89</span>
            <span className="flex items-center gap-1">✨ <strong>Good Deal</strong> = 60–74</span>
            <span className="flex items-center gap-1">📊 All prices in <strong>CAD incl. taxes</strong></span>
          </div>
        </div>
      </div>

      {/* Results */}
      <main id="results" className="flex-1">
        <ResultsPage
          origin={searchState.origin}
          month={searchState.month}
          destination={searchState.destination}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <span className="text-xl">✈️</span>
                <span className="text-white font-bold text-lg">FlightFinder</span>
              </div>
              <p className="text-sm">
                Helping travellers find the best flight deals from Canadian airports.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-center md:text-left">
              <div>
                <p className="text-white font-semibold mb-1">Popular Origins</p>
                <p>Montreal (YUL)</p>
                <p>Toronto (YYZ)</p>
                <p>Vancouver (YVR)</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Top Destinations</p>
                <p>Paris, London</p>
                <p>Tokyo, Singapore</p>
                <p>Sydney, Dubai</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>© 2026 FlightFinder. For demonstration purposes only. All prices in CAD.</p>
            <p className="mt-1 text-gray-600">Prices shown are base fares. Taxes (~15%) added. Book via Google Flights links.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
