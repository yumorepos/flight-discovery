"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearch: (origin: string, month: string) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [month, setMonth] = useState("");

  const handleSearch = () => {
    // Validate IATA code (3 letters)
    if (origin.length !== 3) {
      alert("Please enter a valid 3-letter IATA airport code");
      return;
    }
    
    if (!month) {
      alert("Please select a month");
      return;
    }

    const year = "2026"; // Default to 2026 for now
    const monthFormatted = `${year}-${month}`;
    
    console.log("Searching for flights from", origin, "in", monthFormatted);
    onSearch(origin.toUpperCase(), monthFormatted);
  };

  return (
    <div className="glass-morphism p-8 rounded-lg shadow-lg w-full max-w-md space-y-4">
      <div>
        <label htmlFor="origin" className="block text-gray-700 text-sm font-bold mb-2">
          Origin (IATA Code)
        </label>
        <input
          type="text"
          id="origin"
          placeholder="e.g., YUL"
          className="w-full px-4 py-3 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          aria-label="Origin Airport Code"
        />
      </div>
      
      <div>
        <label htmlFor="month" className="block text-gray-700 text-sm font-bold mb-2">
          Month
        </label>
        <select
          id="month"
          className="w-full px-4 py-3 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-lg"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Month of Travel"
        >
          <option value="">Any Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
      
      <button
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        onClick={handleSearch}
        aria-label="Search Flights"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 inline-block mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
        Search
      </button>
    </div>
  );
}
