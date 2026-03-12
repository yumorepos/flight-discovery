"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import EmailSubscription from "./EmailSubscription";
import { getAirlineBrand } from "@/lib/airlineBranding";
import { getDestinationImageSet } from "@/lib/destinationImages";

interface PriceInsight {
  usual_price: number;
  current_discount: number;
  discount_amount: number;
  historical_comparison: string;
}

interface DestinationCardProps {
  id: number;
  origin: string;
  city: string;
  country: string;
  destination: string;
  totalPrice: number;
  taxAmount: number;
  date: string;
  airline: string;
  duration: string;
  stops?: number;
  dealScore: number;
  dealClassification: string;
  valueScore: number;
  historicalPrice: number;
  destinationEmoji: string;
  bookingUrl: string;
  region: string;
  priceInsight?: PriceInsight;
  index?: number;
}

const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatMoney = (value: number) => `CAD $${Math.round(value).toLocaleString()}`;

const getDealTone = (classification: string) => {
  switch (classification) {
    case "Exceptional Deal":
      return "bg-rose-500/95 text-white";
    case "Great Deal":
      return "bg-orange-500/95 text-white";
    case "Good Deal":
      return "bg-emerald-500/95 text-white";
    default:
      return "bg-slate-900/75 text-white";
  }
};

export default function DestinationCard({
  origin,
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
  region,
  priceInsight,
  index = 0,
}: DestinationCardProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const imageSet = getDestinationImageSet(city, region);
  const airlineBrand = getAirlineBrand(airline);
  const logoSrc = airlineBrand.logoUrls[Math.min(logoIndex, airlineBrand.logoUrls.length - 1)];

  const savingsPercent = Math.max(0, Math.round(((historicalPrice - totalPrice) / historicalPrice) * 100));
  const stopLabel = stops === 0 ? "Direct" : stops === 1 ? "1 stop" : `${stops} stops`;


  const valueMeta = useMemo(() => {
    if (valueScore >= 90) return { label: "Elite value", tone: "from-emerald-500 to-green-400" };
    if (valueScore >= 75) return { label: "Great value", tone: "from-blue-500 to-cyan-400" };
    if (valueScore >= 60) return { label: "Good value", tone: "from-violet-500 to-purple-500" };
    return { label: "Fair value", tone: "from-amber-500 to-orange-500" };
  }, [valueScore]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.1)] transition will-change-transform hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.16)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        {!imageFailed ? (
          <Image
            src={imageSet.landscape}
            alt={`${city} destination`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-7xl">{destinationEmoji}</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md ${getDealTone(dealClassification)}`}>{dealClassification}</span>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">Deal {Math.round(dealScore)}</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black leading-none text-white drop-shadow-md">{city}</h3>
            <p className="mt-1 text-sm text-white/90">{country}</p>
          </div>
          <div className={`rounded-2xl bg-gradient-to-r ${valueMeta.tone} px-3 py-1.5 text-right text-white shadow-lg`}>
            <p className="text-[11px] font-medium uppercase tracking-wide">{valueMeta.label}</p>
            <p className="text-3xl font-black leading-none">{Math.round(valueScore)}%</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Final fare</p>
            <p className="mt-1 text-4xl font-black leading-none text-violet-700">{formatMoney(totalPrice).replace("CAD ", "")}</p>
            <p className="mt-1 text-sm text-slate-500">CAD per traveler · taxes est. {formatMoney(taxAmount)}</p>
          </div>
          {savingsPercent > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Save {savingsPercent}%</span>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <Image
                key={`${airline}-${logoIndex}`}
                src={logoSrc}
                alt={`${airlineBrand.name} logo`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 object-contain"
                loading="lazy"
                onError={() => {
                  if (logoIndex < airlineBrand.logoUrls.length - 1) {
                    setLogoIndex((prev) => prev + 1);
                    return;
                  }
                  setLogoFailed(true);
                }}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600">{airlineBrand.code}</div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{airlineBrand.name}</p>
              <p className="truncate text-xs text-slate-500">{origin} → {destination} · {stopLabel} · {duration}</p>
              {airlineBrand.alliance && <p className="mt-1 text-[11px] font-medium text-slate-500">{airlineBrand.alliance}</p>}
            </div>
          </div>
        </div>

        {priceInsight && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Price insight</p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-slate-700">
              <p>Usual: {formatMoney(priceInsight.usual_price)}</p>
              <p>Discount: {priceInsight.current_discount}%</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{priceInsight.historical_comparison}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{duration}</p>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{stopLabel}</p>
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{formatDate(date)}</p>
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3.5 text-center text-base font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
        >
          View live fare
        </a>

        <button onClick={() => setShowSubscription((prev) => !prev)} className="text-left text-xs font-semibold text-violet-700 transition hover:text-violet-800">
          {showSubscription ? "Hide price alerts" : `Track fare alerts for ${city}`}
        </button>

        <AnimatePresence>
          {showSubscription && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <EmailSubscription destination={city} route={`${origin}-${destination}`} price={Math.round(totalPrice)} travelMonth={date.slice(0, 7)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
