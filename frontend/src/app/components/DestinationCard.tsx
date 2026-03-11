"use client";

import { motion } from "framer-motion";

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
  Toronto: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=900&h=600&fit=crop",
  Chicago: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=900&h=600&fit=crop",
  "Fort Lauderdale": "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=900&h=600&fit=crop",
  Orlando: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=900&h=600&fit=crop",
  Nassau: "https://images.unsplash.com/photo-1580541631971-a6a1212efeda?w=900&h=600&fit=crop",
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&h=600&fit=crop",
  London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&h=600&fit=crop",
  Tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&h=600&fit=crop",
};

const CATEGORY_BY_REGION: Record<string, { label: string; emoji: string }> = {
  NA: { label: "Theme Parks", emoji: "🎢" },
  SA: { label: "Beach", emoji: "🏖️" },
  EU: { label: "Historic", emoji: "🏛️" },
  Asia: { label: "Culture", emoji: "🎎" },
  Oceania: { label: "Beach", emoji: "🏖️" },
};

const getAirlineLogo = (airline: string): string => {
  const match = airline.match(/\(([A-Z]{2})\)/);
  const iataCode = match ? match[1] : airline.substring(0, 2).toUpperCase();
  return `https://images.kiwi.com/airlines/64x64/${iataCode}.png`;
};

const getValueBadge = (score: number) => {
  if (score >= 85) return { label: "Exceptional Value", bg: "bg-emerald-500" };
  if (score >= 70) return { label: "Great Value", bg: "bg-sky-500" };
  return { label: "Good Value", bg: "bg-violet-500" };
};

const getDealTag = (dealClassification: string) => {
  if (dealClassification === "Mistake Fare") return "Mistake Fare";
  if (dealClassification === "Hot Deal") return "Hot Deal";
  return "Deal";
};

const formatStops = (stops = 0) => (stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`);

export default function DestinationCard({
  city,
  country,
  price,
  airline,
  duration,
  stops = 0,
  dealClassification,
  valueScore,
  historicalPrice,
  destinationEmoji,
  bookingUrl,
  region,
  index = 0,
}: DestinationCardProps) {
  const savingsPercent = Math.max(0, Math.round(((historicalPrice - price) / historicalPrice) * 100));
  const image = DESTINATION_IMAGES[city];
  const valueBadge = getValueBadge(valueScore);
  const category = CATEGORY_BY_REGION[region] ?? { label: "Popular", emoji: "📍" };
  const airlineLogo = getAirlineLogo(airline);
  const airlineCode = airline.match(/\(([A-Z]{2})\)/)?.[1] ?? airline.slice(0, 2).toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="relative h-52">
        {image ? (
          <img src={image} alt={city} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-7xl">
            {destinationEmoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        <span className="absolute left-4 top-4 rounded-full bg-fuchsia-500/95 px-3 py-1 text-xs font-bold text-white">
          {category.emoji} {category.label}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-fuchsia-600/95 px-3 py-1 text-xs font-bold text-white">
          {getDealTag(dealClassification)}
        </span>
        <span className={`absolute bottom-3 right-3 rounded-2xl px-3 py-2 text-right text-white ${valueBadge.bg}`}>
          <span className="block text-xs">✈ {valueBadge.label}</span>
          <span className="block text-sm font-bold leading-tight">{Math.round(valueScore)}%</span>
        </span>

        <div className="absolute bottom-3 left-4 text-white">
          <h3 className="text-[44px] font-bold leading-none tracking-tight">{city}</h3>
          <p className="text-sm font-semibold">◉ {country}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[54px] font-extrabold leading-none text-violet-600">${price}</p>
            {savingsPercent > 0 && (
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">↓ {savingsPercent}%</span>
            )}
          </div>
          <p className="-mt-1 text-sm text-slate-500">CAD per person (usually ${historicalPrice})</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-3">
          <img
            src={airlineLogo}
            alt={airline}
            className="h-14 w-14 rounded-md bg-white object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <p className="text-2xl font-semibold text-slate-700">{airlineCode}</p>
            <p className="text-sm text-slate-500">Operated by {airlineCode}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-600">
          <span>◷ {duration}</span>
          <span className="text-emerald-600">● {formatStops(stops)}</span>
          <span>Economy Basic</span>
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-3 text-center text-lg font-bold text-white"
        >
          Book on Google Flights →
        </a>
      </div>
    </motion.article>
  );
}
