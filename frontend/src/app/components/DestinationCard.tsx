"use client";

import { useMemo, useState } from "react";
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

const AIRLINE_CODES: Record<string, string> = {
  "Air Canada": "AC",
  "Air France": "AF",
  "American Airlines": "AA",
  "ANA": "NH",
  "British Airways": "BA",
  "Delta": "DL",
  "Emirates": "EK",
  "Iberia": "IB",
  "JAL": "JL",
  "JetBlue": "B6",
  "KLM": "KL",
  "LATAM": "LA",
  "Lufthansa": "LH",
  "Qantas": "QF",
  "Singapore Airlines": "SQ",
  "SWISS": "LX",
  "Turkish Airlines": "TK",
  "United": "UA",
  "Virgin Atlantic": "VS",
};

const DESTINATION_IMAGES: Record<string, string> = {
  London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
  Tokyo: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1200&q=80",
  Rome: "https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&w=1200&q=80",
  Barcelona: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1200&q=80",
  Singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
  Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80",
  Dubai: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
};

const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatMoney = (value: number) => `CAD $${Math.round(value).toLocaleString()}`;

const getAirlineCode = (airline: string) => {
  const explicit = airline.match(/\(([A-Z0-9]{2})\)/)?.[1];
  if (explicit) return explicit;
  return AIRLINE_CODES[airline] ?? airline.slice(0, 2).toUpperCase();
};

export default function DestinationCard({
  city,
  country,
  destination,
  totalPrice,
  taxAmount,
  date,
  airline,
  duration,
  stops = 0,
  dealScore,
  dealClassification,
  valueScore,
  historicalPrice,
  destinationEmoji,
  bookingUrl,
  index = 0,
}: DestinationCardProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const imageUrl = DESTINATION_IMAGES[city] ?? `https://source.unsplash.com/1200x800/?${encodeURIComponent(`${city} skyline travel`)}`;
  const airlineLogo = `https://images.kiwi.com/airlines/64x64/${getAirlineCode(airline)}.png`;

  const savingsPercent = Math.max(0, Math.round(((historicalPrice - totalPrice) / historicalPrice) * 100));
  const stopLabel = stops === 0 ? "Nonstop" : stops === 1 ? "1 stop" : `${stops} stops`;
  const valueTone = valueScore >= 75 ? "emerald" : valueScore >= 55 ? "blue" : "amber";

  const badgeClass = useMemo(() => {
    if (dealClassification === "Mistake Fare") return "bg-red-600 text-white";
    if (dealClassification === "Hot Deal") return "bg-orange-500 text-white";
    if (dealClassification === "Good Deal") return "bg-emerald-600 text-white";
    return "bg-slate-700 text-white";
  }, [dealClassification]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="relative h-48 overflow-hidden">
        {!imageFailed ? (
          <img
            src={imageUrl}
            alt={`${city} destination`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-6xl">{destinationEmoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{dealClassification}</span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">Deal {Math.round(dealScore)}</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{city}</h3>
            <p className="text-sm text-white/90">{country} · {destination}</p>
          </div>
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">{stopLabel}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Final price (incl. taxes)</p>
            <p className="text-3xl font-extrabold text-slate-900">{formatMoney(totalPrice)}</p>
            <p className="text-xs text-slate-500">Tax estimate included: {formatMoney(taxAmount)}</p>
          </div>
          {savingsPercent > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Save {savingsPercent}%</span>}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="col-span-2 flex items-center gap-2">
            {!logoFailed ? (
              <img src={airlineLogo} alt={`${airline} logo`} className="h-6 w-6 object-contain" onError={() => setLogoFailed(true)} />
            ) : (
              <div className="h-6 w-6 rounded-full bg-slate-200" />
            )}
            <span className="font-medium text-slate-800">{airline}</span>
          </div>
          <p>Departure: {formatDate(date)}</p>
          <p>Duration: {duration}</p>
          <p className="col-span-2">
            Value score:
            <span className={`ml-2 rounded-md px-2 py-0.5 text-xs font-semibold ${valueTone === "emerald" ? "bg-emerald-100 text-emerald-700" : valueTone === "blue" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {Math.round(valueScore)}/100
            </span>
          </p>
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Book on Google Flights
        </a>

        <button
          onClick={() => setShowSubscription((prev) => !prev)}
          className="text-left text-xs font-semibold text-blue-700 hover:text-blue-800"
        >
          {showSubscription ? "Hide alert form" : "Track price for this destination"}
        </button>

        <AnimatePresence>
          {showSubscription && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <EmailSubscription destination={city} price={Math.round(totalPrice)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
