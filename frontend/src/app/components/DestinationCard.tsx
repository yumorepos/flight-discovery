"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmailSubscription from "./EmailSubscription";

interface DestinationCardProps {
  id: number;
  city: string;
  country: string;
  destination: string;
  price: number;
  totalPrice: number;
  taxAmount: number;
  date: string;
  airline: string;
  duration: string;
  durationHours?: number;
  stops?: number;
  safetyScore: number;
  dealScore: number;
  dealClassification: string;
  valueScore: number;
  historicalPrice: number;
  destinationEmoji: string;
  bookingUrl: string;
  region: string;
  index?: number;
}

const DESTINATION_IMAGES: Record<string, string> = {
  "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
  "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
  "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop",
  "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop",
  "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
  "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=300&fit=crop",
  "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop",
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
  "Los Angeles": "https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=400&h=300&fit=crop",
  "Bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop",
  "Hong Kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&h=300&fit=crop",
  "Amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop",
  "Madrid": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop",
  "Frankfurt": "https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=400&h=300&fit=crop",
  "Seoul": "https://images.unsplash.com/photo-1534247913992-ba0c5f9e1c7a?w=400&h=300&fit=crop",
  "Cancún": "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=300&fit=crop",
  "Mexico City": "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop",
  "Miami": "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=400&h=300&fit=crop",
  "Chicago": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop",
  "Honolulu": "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=400&h=300&fit=crop",
};

// Airline IATA to logo mapping (using public CDN)
const getAirlineLogo = (airline: string): string => {
  // Extract IATA code if in format "Airline Name (XX)"
  const match = airline.match(/\(([A-Z]{2})\)/);
  const iataCode = match ? match[1] : airline.substring(0, 2).toUpperCase();
  
  // Use aviation logos CDN
  return `https://images.kiwi.com/airlines/64x64/${iataCode}.png`;
};

const getDestinationImage = (city: string): string => {
  if (DESTINATION_IMAGES[city]) {
    return DESTINATION_IMAGES[city];
  }
  // Fallback: gradient placeholder
  return "";
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function DestinationCard({
  id,
  city,
  country,
  destination,
  price,
  totalPrice,
  taxAmount,
  date,
  airline,
  duration,
  durationHours,
  stops = 0,
  safetyScore,
  dealScore,
  dealClassification,
  valueScore,
  historicalPrice,
  destinationEmoji,
  bookingUrl,
  region,
  index = 0,
}: DestinationCardProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  const [imageError, setImageError] = useState(false);

  const destinationImage = getDestinationImage(city);
  const airlineLogo = getAirlineLogo(airline);
  const savingsPercent = Math.round(((historicalPrice - price) / historicalPrice) * 100);

  let dealBadgeText = "";
  let dealBadgeClass = "";
  if (dealClassification === "Mistake Fare") {
    dealBadgeText = "🔥 Mistake Fare";
    dealBadgeClass = "bg-gradient-to-r from-red-600 to-red-700 text-white";
  } else if (dealClassification === "Hot Deal") {
    dealBadgeText = "⚡ Hot Deal";
    dealBadgeClass = "bg-gradient-to-r from-orange-500 to-orange-600 text-white";
  } else if (dealClassification === "Good Deal") {
    dealBadgeText = "✨ Good Deal";
    dealBadgeClass = "bg-gradient-to-r from-green-600 to-green-700 text-white";
  }

  // Format stops display
  let stopsText = "";
  let stopsColor = "";
  if (stops === 0) {
    stopsText = "Nonstop";
    stopsColor = "text-green-600";
  } else if (stops === 1) {
    stopsText = "1 stop";
    stopsColor = "text-amber-600";
  } else {
    stopsText = `${stops} stops`;
    stopsColor = "text-gray-500";
  }

  // Value score color coding
  let valueScoreClass = "";
  if (valueScore >= 80) {
    valueScoreClass = "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
  } else if (valueScore >= 60) {
    valueScoreClass = "bg-gradient-to-r from-blue-500 to-indigo-600 text-white";
  } else if (valueScore >= 40) {
    valueScoreClass = "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
  } else {
    valueScoreClass = "bg-gray-400 text-white";
  }

  // Generate deal description
  let dealDescription = "";
  if (stops === 0 && savingsPercent > 20) {
    dealDescription = `Great value nonstop flight — save ${savingsPercent}%`;
  } else if (stops === 0) {
    dealDescription = "Direct flight to your destination";
  } else if (savingsPercent > 30) {
    dealDescription = `Exceptional price — ${savingsPercent}% below average`;
  } else if (savingsPercent > 15) {
    dealDescription = `Good deal — ${savingsPercent}% savings`;
  } else {
    dealDescription = "Competitive pricing for this route";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300"
    >
      {/* Image Header */}
      <div className="relative h-52 overflow-hidden">
        {destinationImage && !imageError ? (
          <img
            src={destinationImage}
            alt={city}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-8xl select-none" role="img" aria-label={city}>
              {destinationEmoji}
            </span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Deal badge */}
        {dealBadgeText && (
          <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${dealBadgeClass}`}>
            {dealBadgeText}
          </span>
        )}
        
        {/* Value score badge */}
        <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${valueScoreClass}`}>
          Value: {Math.round(valueScore)}
        </span>
        
        {/* Airline logo */}
        <div className="absolute bottom-3 right-3 bg-white rounded-lg p-2 shadow-md">
          <img
            src={airlineLogo}
            alt={airline}
            className="w-10 h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        {/* City name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <h2 className="text-white font-extrabold text-2xl leading-tight drop-shadow-lg">
            {city}
          </h2>
          <p className="text-white/90 text-sm font-medium drop-shadow">{country}</p>
          <span className="inline-block mt-1 bg-white/20 backdrop-blur-sm text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
            {destination}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-400 line-through font-medium">CAD ${historicalPrice}</div>
            <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent leading-none">
              ${price}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              ${totalPrice} CAD total
              <span className="text-gray-400 ml-1">(+${taxAmount} tax)</span>
            </div>
          </div>
          {savingsPercent > 0 && (
            <div className="text-right">
              <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-sm px-3 py-1.5 rounded-full shadow">
                Save {savingsPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Deal description */}
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          {dealDescription}
        </p>

        {/* Flight details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <span className="truncate text-gray-700 font-medium">{airline}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="text-gray-700 font-medium">{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏱️</span>
            <span className="text-gray-700 font-semibold">{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${stops === 0 ? "text-green-600" : stops === 1 ? "text-amber-500" : "text-gray-400"}`}>
              {stops === 0 ? "🟢" : stops === 1 ? "🟡" : "🔴"}
            </span>
            <span className={`font-semibold ${stopsColor}`}>{stopsText}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto pt-2">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-4 rounded-xl text-center text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>View Deal</span>
            <span className="text-lg">→</span>
          </a>
        </div>

        {/* Price alert toggle */}
        <button
          onClick={() => setShowSubscription(!showSubscription)}
          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors justify-center py-1"
        >
          <span>{showSubscription ? "▼" : "▶"}</span>
          <span>{showSubscription ? "Hide alerts" : "🔔 Get price drop alerts"}</span>
        </button>

        <AnimatePresence>
          {showSubscription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <EmailSubscription destination={city} price={price} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
