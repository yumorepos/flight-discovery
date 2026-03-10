"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import ResultsPage from "./components/ResultsPage";

export default function Home() {
  const [searchParams, setSearchParams] = useState({ origin: "", month: "" });

  const handleSearch = (origin: string, month: string) => {
    setSearchParams({ origin, month });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Find the best flight deals for your dream destination
          </p>
          <div className="flex justify-center">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <ResultsPage origin={searchParams.origin} month={searchParams.month} />
    </main>
  );
}
