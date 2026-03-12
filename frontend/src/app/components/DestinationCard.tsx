"use client";

import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import EmailSubscription from "./EmailSubscription";
import PriceSparkline from "./PriceSparkline";
import { getAirlineBrand } from "@/lib/airlineBranding";
import { getDestinationImageSet } from "@/lib/destinationImages";
import { useCurrency } from "./CurrencyProvider";
import { formatPrice } from "@/lib/currency";
import type { FareMetadata } from "@/lib/flightEnrichment";

interface PriceInsight {
  usual_price: number;
  current_discount: number;
  discount_amount: number;
  historical_comparison: string;
}

interface DestinationCardProps {
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
  fare: FareMetadata;
  trend: Array<{ label: string; price: number }>;
  index?: number;
}

const formatDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

function DestinationCardComponent({ origin, city, country, destination, totalPrice, taxAmount, date, airline, duration, stops = 0, dealScore, dealClassification, valueScore, historicalPrice, destinationEmoji, bookingUrl, region, priceInsight, fare, trend, index = 0 }: DestinationCardProps) {
  const { currency, rates } = useCurrency();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
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
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: index * 0.04 }} className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.16)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        {!imageFailed ? (
          <Image src={imageSet.landscape} alt={`${city} destination`} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw" loading="lazy" unoptimized onError={() => setImageFailed(true)} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-center text-xl font-semibold text-white/90">Explore {city || destinationEmoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">{dealClassification}</span><span className="rounded-full bg-violet-600/95 px-3 py-1 text-xs font-semibold text-white">Deal {Math.round(dealScore)}</span></div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><div><h3 className="text-3xl font-black leading-none text-white">{city}</h3><p className="mt-1 text-sm text-white/90">{country}</p></div><div className={`rounded-2xl bg-gradient-to-r ${valueMeta.tone} px-3 py-1.5 text-right text-white`}><p className="text-[11px] font-medium uppercase tracking-wide">{valueMeta.label}</p><p className="text-3xl font-black leading-none">{Math.round(valueScore)}%</p></div></div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Final fare</p>
            <p className="mt-1 text-4xl font-black leading-none text-violet-700">{formatPrice(totalPrice, currency, rates).replace(`${currency} `, "")}</p>
            <p className="mt-1 text-sm text-slate-500">{currency} per traveler · taxes est. {formatPrice(taxAmount, currency, rates)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">{savingsPercent > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Save {savingsPercent}%</span>}<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{fare.fareType}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <Image key={`${airline}-${logoIndex}`} src={logoSrc} alt={`${airlineBrand.name} logo`} width={40} height={40} className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 object-contain" loading="lazy" unoptimized onError={() => {
                if (logoIndex < airlineBrand.logoUrls.length - 1) return setLogoIndex((prev) => prev + 1);
                setLogoFailed(true);
              }} />
            ) : (
              <div className="max-w-[8.5rem] truncate text-xs font-semibold text-slate-700">{airlineBrand.name}</div>
            )}
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{airlineBrand.name}</p><p className="truncate text-xs text-slate-500">{origin} → {destination} · {stopLabel} · {duration}</p><p className="mt-1 text-[11px] text-slate-500">Cabin: {fare.cabinClass}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-4"><p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{duration}</p><p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{stopLabel}</p><p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{formatDate(date)}</p><p className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-center font-medium">{fare.aircraft}</p></div>

        <div className="flex flex-wrap gap-2">{fare.amenities.slice(0, 3).map((amenity) => (<span key={amenity} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{amenity}</span>))}{fare.amenities.length > 3 && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">+{fare.amenities.length - 3} more</span>}</div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Price trend</p>
          <PriceSparkline points={trend.map((t) => t.price)} />
          <div className="mt-1 grid grid-cols-4 gap-1 text-[11px] text-slate-600">{trend.map((t) => (<p key={t.label} className="text-center">{t.label}<br />{formatPrice(t.price, currency, rates).replace(`${currency} `, "")}</p>))}</div>
        </div>

        {priceInsight && <p className="text-xs text-slate-500">Typical fare {formatPrice(priceInsight.usual_price, currency, rates)} · {priceInsight.historical_comparison}</p>}

        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-auto rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3.5 text-center text-base font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)]">View live fare</a>
        <button onClick={() => setShowDetails((prev) => !prev)} className="text-left text-xs font-semibold text-violet-700">{showDetails ? "Hide fare details" : "Show fare details"}</button>
        {showDetails && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"><p>Marketing carrier: {fare.marketingCarrier}</p><p>Operating carrier: {fare.operatingCarrier}</p>{fare.isCodeshare && <p>Codeshare itinerary</p>}{fare.baggage && <p>Baggage: {fare.baggage}</p>}{fare.fareRules && <p>Fare rules: {fare.fareRules}</p>}</div>}

        <button onClick={() => setShowSubscription((prev) => !prev)} className="text-left text-xs font-semibold text-violet-700">{showSubscription ? "Hide price alerts" : `Track fare alerts for ${city}`}</button>
        <AnimatePresence>{showSubscription && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><EmailSubscription destination={city} route={`${origin}-${destination}`} price={Math.round(totalPrice)} travelMonth={date.slice(0, 7)} /></motion.div>}</AnimatePresence>
      </div>
    </motion.article>
  );
}

const DestinationCard = memo(DestinationCardComponent);

export default DestinationCard;
