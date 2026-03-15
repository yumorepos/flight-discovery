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

  const valueMeta = useMemo(() => {
    if (valueScore >= 90) return { label: "Elite value", tone: "from-emerald-500 to-green-400" };
    if (valueScore >= 75) return { label: "Great value", tone: "from-sky-500 to-cyan-400" };
    if (valueScore >= 60) return { label: "Good value", tone: "from-orange-500 to-amber-400" };
    return { label: "Fair value", tone: "from-amber-500 to-orange-500" };
  }, [valueScore]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className={`group flex h-full flex-col overflow-hidden rounded-[1.65rem] border bg-white transition duration-200 hover:-translate-y-1 ${
        featured
          ? "border-orange-200 shadow-[0_28px_68px_rgba(249,115,22,0.2)] hover:shadow-[0_34px_80px_rgba(249,115,22,0.24)]"
          : "border-slate-200/90 shadow-[0_14px_36px_rgba(15,23,42,0.09)] hover:border-orange-200 hover:shadow-[0_24px_52px_rgba(249,115,22,0.14)]"
      }`}
    >
      <div className={`relative overflow-hidden bg-slate-200 ${featured ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
        {!imageFailed ? (
          <Image
            src={imageSet.landscape}
            alt={`${city} destination`}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes={featured ? "(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 66vw" : "(max-width: 768px) 100vw, (max-width: 1400px) 50vw, 33vw"}
            loading="lazy"
            unoptimized
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-700 to-amber-700 text-center text-xl font-semibold text-white/90">Explore {city || destinationEmoji}</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-900 backdrop-blur">{dealClassification}</span>
          <span className="rounded-full bg-orange-500/95 px-3 py-1 text-[11px] font-semibold text-white">{Math.round(dealScore)} score</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <h3 className={`${featured ? "text-4xl md:text-5xl" : "text-3xl"} font-black leading-none tracking-tight text-white`}>{city}</h3>
            <p className="mt-1 text-sm text-white/90">{country}</p>
          </div>
          <div className="text-right text-white">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/55 bg-gradient-to-br ${valueMeta.tone} shadow-lg`}>
              <p className="text-lg font-black leading-none">{Math.round(valueScore)}</p>
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">{valueMeta.label}</p>
          </div>
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${featured ? "gap-4 p-6 md:p-7" : "gap-4 p-5 md:p-6"}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">From</p>
          <p className={`mt-1 font-black leading-none text-orange-600 ${featured ? "text-5xl" : "text-[2.3rem]"}`}>{formatPrice(totalPrice, currency, rates).replace(`${currency} `, "")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">{currency} · taxes est. {formatPrice(taxAmount, currency, rates)}</span>
            {savingsPercent > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Save {savingsPercent}%</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3.5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">Why go now</p>
          <p className="mt-1.5 text-sm text-slate-700">{inspiration.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="rounded-full bg-white px-2.5 py-1">{inspiration.vibe}</span>
            <span className="rounded-full bg-white px-2.5 py-1">Best for {inspiration.bestFor}</span>
            <span className="rounded-full bg-white px-2.5 py-1">{inspiration.seasonHook}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white shadow-sm ring-1 ring-slate-200">
                <Image
                  key={`${airline}-${logoIndex}`}
                  src={logoSrc}
                  alt={`${airlineBrand.name} logo`}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-contain"
                  loading="lazy"
                  unoptimized
                  onError={() => {
                    if (logoIndex < airlineBrand.logoUrls.length - 1) {
                      setLogoIndex((prev) => prev + 1);
                      return;
                    }
                    setLogoFailed(true);
                  }}
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-200" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{airlineBrand.name}</p>
              <p className="truncate text-xs text-slate-600">{origin} → {destination} · {duration} · {stopLabel}</p>
              <p className="mt-1 text-[11px] text-slate-500">{formatDate(date)} · {fare.fareType}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Price trend</p>
            {priceInsight && <p className="text-[11px] text-slate-500">Typical {formatPrice(priceInsight.usual_price, currency, rates)}</p>}
          </div>
          <PriceSparkline points={trend.map((t) => t.price)} />
        </div>

        <a
          href={`${bookingUrl}${bookingUrl.includes('?') ? '&' : '?'}affilid=flightdiscovery`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'affiliate_click', {
                destination: city,
                price: totalPrice,
                airline: airline
              });
            }
          }}
          className={`mt-auto rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-[length:140%_140%] text-center font-bold text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] transition duration-200 hover:bg-[position:100%_50%] hover:shadow-[0_14px_30px_rgba(249,115,22,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
            featured ? "px-4 py-4 text-lg" : "px-4 py-3 text-[15px]"
          }`}
        >
          Book flight →
        </a>

        <button onClick={() => setShowDetails((prev) => !prev)} className="text-left text-xs font-semibold text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
          {showDetails ? "Hide fare details" : "View fare details"}
        </button>
        {showDetails && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p>Marketing carrier: {fare.marketingCarrier}</p>
            <p>Operating carrier: {fare.operatingCarrier}</p>
            {fare.isCodeshare && <p>Codeshare itinerary</p>}
            {fare.baggage && <p>Baggage: {fare.baggage}</p>}
          </div>
        )}

        <button onClick={() => setShowSubscription((prev) => !prev)} className="text-left text-xs font-semibold text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
          {showSubscription ? "Hide alerts" : `Track ${city} fare alerts`}
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

const DestinationCard = memo(DestinationCardComponent);

export default DestinationCard;
