"use client";

import { useState } from "react";
import EmailSubscription from "./EmailSubscription";

interface DestinationCardProps {
  city: string;
  price: number;
  airline: string;
  safetyScore: number;
  dealScore: number;
  valueScore: number;
  historicalPrice: number;
}

export default function DestinationCard({
  city,
  price,
  airline,
  safetyScore,
  dealScore,
  valueScore,
  historicalPrice,
}: DestinationCardProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  // Safety badge color
  let safetyBadgeColor = "";
  if (safetyScore >= 90) {
    safetyBadgeColor = "bg-green-500";
  } else if (safetyScore >= 70) {
    safetyBadgeColor = "bg-yellow-500";
  } else {
    safetyBadgeColor = "bg-red-500";
  }

  // Deal badge
  let dealBadge = null;
  let dealBadgeText = "";
  let dealBadgeColor = "";

  if (dealScore >= 90) {
    dealBadgeText = "🔥 Mistake Fare";
    dealBadgeColor = "bg-red-600";
  } else if (dealScore >= 75) {
    dealBadgeText = "⚡ Hot Deal";
    dealBadgeColor = "bg-orange-500";
  } else if (dealScore >= 60) {
    dealBadgeText = "✨ Good Deal";
    dealBadgeColor = "bg-yellow-500";
  }

  if (dealScore >= 60) {
    dealBadge = (
      <div className={`absolute top-2 left-2 ${dealBadgeColor} text-white rounded-md px-3 py-1 text-sm font-bold`}>
        {dealBadgeText}
      </div>
    );
  }

  const savingsPercentage = Math.round(((historicalPrice - price) / historicalPrice) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
      {dealBadge}
      <img
        src={`https://source.unsplash.com/800x600/?${city}`}
        alt={city}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{city}</h2>
        <div className="flex items-baseline mb-3">
          <span className="text-sm text-gray-500 line-through mr-2">Usually ${historicalPrice}</span>
        </div>
        <div className="mb-3">
          <span className="text-3xl font-extrabold text-blue-600">${price}</span>
          {savingsPercentage > 0 && (
            <span className="text-green-600 font-semibold ml-2">Save {savingsPercentage}%</span>
          )}
        </div>
        <p className="text-gray-700 mb-4">✈️ {airline}</p>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-white text-xs font-bold py-1 px-2 rounded-full ${safetyBadgeColor}`}>
              {safetyScore >= 90 ? '🟢' : safetyScore >= 70 ? '🟡' : '🔴'} {safetyScore}/100
            </span>
            <span className="text-xs text-gray-600">Deal: {dealScore}/100</span>
          </div>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            aria-label={`Book flight to ${city}`}
          >
            Book
          </button>
        </div>
        
        <button
          onClick={() => setShowSubscription(!showSubscription)}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mb-3"
        >
          {showSubscription ? '▼' : '▶'} {showSubscription ? 'Hide' : 'Get Price Alerts'}
        </button>
        
        {showSubscription && (
          <EmailSubscription destination={city} price={price} />
        )}
      </div>
    </div>
  );
}
