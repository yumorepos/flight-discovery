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

const REGION_GRADIENTS: Record<string, string> = {
  NA: "from-blue-500 via-sky-400 to-cyan-500",
  EU: "from-indigo-500 via-purple-500 to-pink-500",
  Asia: "from-red-500 via-orange-500 to-yellow-500",
  Oceania: "from-teal-400 via-emerald-500 to-green-500",
  AF: "from-amber-500 via-orange-600 to-red-600",
  SA: "from-green-500 via-lime-500 to-yellow-400",
  Other: "from-gray-500 via-slate-500 to-gray-600",
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

  const gradient = REGION_GRADIENTS[region] || REGION_GRADIENTS.Other;
  const savingsPercent = Math.round(((historicalPrice - price) / historicalPrice) * 100);

  let dealBadgeText = "";
  let dealBadgeClass = "";
  if (dealClassification === "Mistake Fare") {
    dealBadgeText = "🔥 Mistake Fare";
    dealBadgeClass = "bg-red-600 text-white";
  } else if (dealClassification === "Hot Deal") {
    dealBadgeText = "⚡ Hot Deal";
    dealBadgeClass = "bg-orange-500 text-white";
  } else if (dealClassification === "Good Deal") {
    dealBadgeText = "✨ Good Deal";
    dealBadgeClass = "bg-green-600 text-white";
  }

  // Format stops display
  let stopsText = "";
  if (stops === 0) {
    stopsText = "Nonstop";
  } else if (stops === 1) {
    stopsText = "1 stop";
  } else {
    stopsText = `${stops} stops`;
  }

  // Value score color coding
  let valueScoreClass = "";
  if (valueScore >= 80) {
    valueScoreClass = "bg-green-500 text-white";
  } else if (valueScore >= 60) {
    valueScoreClass = "bg-blue-500 text-white";
  } else if (valueScore >= 40) {
    valueScoreClass = "bg-amber-500 text-white";
  } else {
    valueScoreClass = "bg-gray-400 text-white";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.14)" }}
      className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
    >
      {/* Visual Header */}
      <div className={`relative bg-gradient-to-br ${gradient} h-36 flex items-center justify-center`}>
        <span className="text-6xl select-none" role="img" aria-label={city}>
          {destinationEmoji}
        </span>
        <div className="absolute inset-0 bg-black/20 rounded-t-2xl" />
        {/* Deal badge */}
        {dealBadgeText && (
          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow ${dealBadgeClass}`}>
            {dealBadgeText}
          </span>
        )}
        {/* Nonstop badge */}
        {stops === 0 && (
          <span className="absolute top-3 left-3 mt-8 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            ✈️ Nonstop
          </span>
        )}
        {/* Airport code pill */}
        <span className="absolute top-3 right-3 bg-black/40 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full">
          {destination}
        </span>
        {/* Value score badge */}
        <span className={`absolute top-3 right-3 mt-8 text-xs font-bold px-2.5 py-1 rounded-full shadow ${valueScoreClass}`}>
          Value: {Math.round(valueScore)}
        </span>
        {/* City name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
          <h2 className="text-white font-bold text-xl leading-tight">{city}</h2>
          <p className="text-white/80 text-xs">{country}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-400 line-through">CAD ${historicalPrice}</div>
            <div className="text-3xl font-extrabold text-blue-700 leading-none">
              CAD ${price}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              CAD ${totalPrice} incl. taxes&nbsp;
              <span className="text-gray-400">(+${taxAmount} tax)</span>
            </div>
          </div>
          {savingsPercent > 0 && (
            <span className="bg-green-100 text-green-700 font-bold text-sm px-2.5 py-1 rounded-full">
              Save {savingsPercent}%
            </span>
          )}
        </div>

        {/* Flight details */}
        <div className="grid grid-cols-2 gap-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="text-base">✈️</span>
            <span className="truncate">{airline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">📅</span>
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">⏱️</span>
            <span className="font-medium">{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-base ${stops === 0 ? "text-green-600" : stops === 1 ? "text-amber-500" : "text-gray-400"}`}>
              {stops === 0 ? "🟢" : stops === 1 ? "🟡" : "🔴"}
            </span>
            <span className="font-medium">{stopsText}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-sm transition-colors shadow-sm"
          >
            Book on Google Flights
          </a>
        </div>

        {/* Price alert toggle */}
        <button
          onClick={() => setShowSubscription(!showSubscription)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
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
              transition={{ duration: 0.2 }}
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
