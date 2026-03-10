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
    <div className="min-h-screen flex flex-col">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>✈️</span>
            <div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                FlightFinder
              </span>
              <div className="text-xs text-gray-500 font-medium -mt-1">Discover Your Next Adventure</div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#search" className="hover:text-blue-600 transition-colors">Search</a>
            <a href="#results" className="hover:text-blue-600 transition-colors">Deals</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="search"
        className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl rotate-12 select-none">✈️</div>
          <div className="absolute top-32 right-16 text-7xl -rotate-12 select-none">🌍</div>
          <div className="absolute bottom-16 left-1/4 text-6xl rotate-6 select-none">🗺️</div>
          <div className="absolute bottom-10 right-12 text-8xl -rotate-6 select-none">🏖️</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-5 select-none">
            ✈️
          </div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32 max-w-6xl text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
              Find Your Next
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto font-medium">
              Intelligent flight search with real-time deal scoring
            </p>
            <p className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto">
              Discover amazing flight deals from Canadian airports with our advanced value ranking and instant price comparisons
            </p>
          </div>
          <div className="flex justify-center">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 md:h-24 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path fill="currentColor" d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path fill="currentColor" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Deal highlights bar */}
      <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600">
            <span className="flex items-center gap-2 font-medium">
              <span className="text-lg">🔥</span>
              <strong className="text-red-600">Mistake Fare</strong>
              <span className="text-gray-400">90+ score</span>
            </span>
            <span className="flex items-center gap-2 font-medium">
              <span className="text-lg">⚡</span>
              <strong className="text-orange-600">Hot Deal</strong>
              <span className="text-gray-400">75–89</span>
            </span>
            <span className="flex items-center gap-2 font-medium">
              <span className="text-lg">✨</span>
              <strong className="text-green-600">Good Deal</strong>
              <span className="text-gray-400">60–74</span>
            </span>
            <span className="flex items-center gap-2 font-medium">
              <span className="text-lg">📊</span>
              <strong>All prices in CAD</strong>
              <span className="text-gray-400">incl. taxes</span>
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <main id="results" className="flex-1 bg-gradient-to-b from-white to-slate-50">
        <ResultsPage
          origin={searchState.origin}
          month={searchState.month}
          destination={searchState.destination}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-400 py-12 mt-12 border-t border-gray-800">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <span className="text-2xl">✈️</span>
                <span className="text-white font-extrabold text-xl">FlightFinder</span>
              </div>
              <p className="text-sm text-gray-400 max-w-sm">
                Helping travellers discover amazing flight deals from Canadian airports with intelligent search and real-time deal scoring.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-sm">
              <div>
                <p className="text-white font-bold mb-2">Popular Origins</p>
                <p className="text-gray-400">Montreal (YUL)</p>
                <p className="text-gray-400">Toronto (YYZ)</p>
                <p className="text-gray-400">Vancouver (YVR)</p>
              </div>
              <div>
                <p className="text-white font-bold mb-2">Top Destinations</p>
                <p className="text-gray-400">Paris • London</p>
                <p className="text-gray-400">Tokyo • Singapore</p>
                <p className="text-gray-400">Sydney • Dubai</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-xs">
            <p className="text-gray-500">© 2026 FlightFinder. For demonstration purposes only. All prices in CAD.</p>
            <p className="mt-2 text-gray-600">
              Prices shown include estimated taxes. Book via Google Flights links for actual availability and pricing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
