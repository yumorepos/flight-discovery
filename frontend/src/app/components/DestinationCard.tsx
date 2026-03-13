"use client";

import { memo, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import EmailSubscription from "./EmailSubscription";
import PriceSparkline from "./PriceSparkline";
import { getAirlineBrand } from "@/lib/airlineBranding";
import { getDestinationImageSet } from "@/lib/destinationImages";
import { getDestinationInspiration } from "@/lib/destinationInspiration";
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
  featured?: boolean;
}

const formatDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

function DestinationCardComponent({ origin, city, country, destination, totalPrice, taxAmount, date, airline, duration, stops = 0, dealScore, dealClassification, valueScore, historicalPrice, destinationEmoji, bookingUrl, region, priceInsight, fare, trend, index = 0, featured = false }: DestinationCardProps) {
  const { currency, rates } = useCurrency();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);

  const imageSet = getDestinationImageSet(city, region);
  const inspiration = getDestinationInspiration(city, region);
  const airlineBrand = getAirlineBrand(airline);
  const logoSrc = airlineBrand.logoUrls[Math.min(logoIndex, airlineBrand.logoUrls.length - 1)];
  const savingsPercent = Math.max(0, Math.round(((historicalPrice - totalPrice) / historicalPrice) * 100));
  const stopLabel = stops === 0 ? "Direct" : stops === 1 ? "1 stop" : `${stops} stops`;
  const compactAircraft = (fare.aircraft ?? "Aircraft TBA").replace("Boeing ", "").replace("Airbus ", "");

  const valueMeta = useMemo(() => {
    if (valueScore >= 90) return { label: "Elite value", tone: "from-emerald-500 to-green-400" };
    if (valueScore >= 75) return { label: "Great value", tone: "from-blue-500 to-cyan-400" };
    if (valueScore >= 60) return { label: "Good value", tone: "from-orange-500 to-amber-400" };
    return { label: "Fair value", tone: "from-amber-500 to-orange-500" };
  }, [valueScore]);

  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: index * 0.04 }} className={`group flex h-full flex-col overflow-hidden rounded-[1.6rem] border bg-white transition duration-200 hover:-translate-y-1 ${featured ? "border-violet-200 shadow-[0_28px_68px_rgba(124,58,237,0.24)] hover:shadow-[0_34px_80px_rgba(124,58,237,0.3)]" : "border-slate-200/90 bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.09)] hover:border-violet-200 hover:shadow-[0_24px_52px_rgba(88,28,135,0.16)]"}`}>
      <div className={`relative overflow-hidden bg-slate-200 ${featured ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
        {!imageFailed ? (
          <Image src={imageSet.landscape} alt={`${city} destination`} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes={featured ? "(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 66vw" : "(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"} loading="lazy" unoptimized onError={() => setImageFailed(true)} />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-center text-xl font-semibold text-white/90">Explore {city || destinationEmoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/45 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2"><span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">{dealClassification}</span><span className="rounded-full bg-orange-500/95 px-3 py-1 text-xs font-semibold text-white">Deal {Math.round(dealScore)}</span>{featured && <span className="rounded-full border border-amber-200/70 bg-amber-300/95 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-950">🔥 Best value today</span>}</div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"><div><h3 className={`${featured ? "text-4xl md:text-5xl" : "text-3xl"} font-black leading-none tracking-tight text-white`}>{city}</h3><p className="mt-1 text-sm text-white/90">{country}</p>{featured && <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-100">Highest ranked by value</p>}</div><div className="text-right text-white">
              <div className={`mx-auto flex items-center justify-center rounded-full border border-white/55 bg-gradient-to-br ${valueMeta.tone} ${featured ? "h-20 w-20" : "h-16 w-16"} shadow-lg`}>
                <p className={`${featured ? "text-2xl" : "text-xl"} font-black leading-none`}>{Math.round(valueScore)}</p>
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">{valueMeta.label}</p>
              <p className="text-[11px] text-white/85">{savingsPercent}% cheaper vs avg</p>
            </div></div>
      </div>

      <div className={`flex flex-1 flex-col ${featured ? "gap-4 p-6 md:p-7" : "gap-3.5 p-5 md:p-6"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Final fare</p>
            <p className={`mt-1 font-black leading-none text-orange-600 ${featured ? "text-6xl" : "text-[2.15rem]"}`}>{formatPrice(totalPrice, currency, rates).replace(`${currency} `, "")}</p>
            <p className="mt-1 text-sm text-slate-500">{currency} per traveler · taxes est. {formatPrice(taxAmount, currency, rates)}</p>
            {featured && <p className="mt-1 text-xs font-medium text-violet-700">Strongest value-to-price ratio in current results</p>}
          </div>
          <div className="flex flex-col items-end gap-2">{savingsPercent > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Save {savingsPercent}%</span>}<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{fare.fareType}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <Image key={`${airline}-${logoIndex}`} src={logoSrc} alt={`${airlineBrand.name} logo`} width={48} height={48} className="h-12 w-12 rounded-full border-2 border-white bg-white p-1.5 object-contain shadow-sm" loading="lazy" unoptimized onError={() => {
                if (logoIndex < airlineBrand.logoUrls.length - 1) return setLogoIndex((prev) => prev + 1);
                setLogoFailed(true);
              }} />
            ) : (
              <div className="max-w-[8.5rem] truncate text-xs font-semibold text-slate-700">{airlineBrand.name}</div>
            )}
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{airlineBrand.name}</p><p className="truncate text-xs font-medium text-slate-600">{origin} → {destination}</p><p className="mt-1 text-[11px] text-slate-500">{duration} • {stopLabel} • {formatDate(date)} • {compactAircraft}</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3.5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">Destination vibe</p>
          <p className="mt-1 text-sm text-slate-700">{inspiration.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{inspiration.vibe}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">Best for {inspiration.bestFor}</span>
          </div>
        </div>

        <div className="flex min-h-7 flex-wrap gap-2">{fare.amenities.slice(0, 3).map((amenity) => (<span key={amenity} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{amenity}</span>))}{fare.amenities.length > 3 && <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">+{fare.amenities.length - 3} more</span>}</div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">Price trend</p>
          <PriceSparkline points={trend.map((t) => t.price)} />
          <div className="mt-1 grid grid-cols-4 gap-1 text-[11px] text-slate-600">{trend.map((t) => (<p key={t.label} className="text-center">{t.label}<br />{formatPrice(t.price, currency, rates).replace(`${currency} `, "")}</p>))}</div>
        </div>

        {priceInsight ? <p className="min-h-4 text-xs text-slate-500">Typical fare {formatPrice(priceInsight.usual_price, currency, rates)} · {priceInsight.historical_comparison}</p> : <div className="min-h-4" />}

        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className={`mt-auto rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-[length:140%_140%] text-center font-bold text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] transition duration-200 hover:bg-[position:100%_50%] hover:shadow-[0_14px_30px_rgba(249,115,22,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${featured ? "px-4 py-4 text-lg" : "px-4 py-3 text-[15px]"}`}>See deal →</a>
        <button onClick={() => setShowDetails((prev) => !prev)} className="text-left text-xs font-semibold text-violet-700 transition hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200">{showDetails ? "Hide fare details" : "Show fare details"}</button>
        {showDetails && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"><p>Marketing carrier: {fare.marketingCarrier}</p><p>Operating carrier: {fare.operatingCarrier}</p>{fare.isCodeshare && <p>Codeshare itinerary</p>}{fare.baggage && <p>Baggage: {fare.baggage}</p>}{fare.fareRules && <p>Fare rules: {fare.fareRules}</p>}</div>}

        <button onClick={() => setShowSubscription((prev) => !prev)} className="text-left text-xs font-semibold text-violet-700 transition hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200">{showSubscription ? "Hide price alerts" : `Track fare alerts for ${city}`}</button>
        <AnimatePresence>{showSubscription && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><EmailSubscription destination={city} route={`${origin}-${destination}`} price={Math.round(totalPrice)} travelMonth={date.slice(0, 7)} /></motion.div>}</AnimatePresence>
      </div>
    </motion.article>
  );
}

const DestinationCard = memo(DestinationCardComponent);

export default DestinationCard;
