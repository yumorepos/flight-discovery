"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import EmailSubscription from "./EmailSubscription";
import { getAirlineBrand, getDestinationImage } from "@/lib/visualAssets";

interface DestinationCardProps {
  id: number;
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
    case "Mistake Fare":
      return "bg-rose-500/95 text-white";
    case "Hot Deal":
      return "bg-orange-500/95 text-white";
    case "Good Deal":
      return "bg-emerald-500/95 text-white";
    default:
      return "bg-slate-900/75 text-white";
  }
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
  region,
  index = 0,
}: DestinationCardProps) {
  const [showSubscription, setShowSubscription] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const imageUrl = getDestinationImage(city, region);
  const { airlineCode, logoUrl } = getAirlineBrand(airline);

  const savingsPercent = Math.max(0, Math.round(((historicalPrice - totalPrice) / historicalPrice) * 100));
  const stopLabel = stops === 0 ? "Direct" : stops === 1 ? "1 stop" : `${stops} stops`;

  const valueMeta = useMemo(() => {
    if (valueScore >= 90) return { label: "Exceptional Value", tone: "from-emerald-500 to-green-400" };
    if (valueScore >= 75) return { label: "Great Value", tone: "from-blue-500 to-cyan-400" };
    if (valueScore >= 60) return { label: "Good Value", tone: "from-violet-500 to-purple-500" };
    return { label: "Fair Value", tone: "from-amber-500 to-orange-500" };
  }, [valueScore]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(15,23,42,0.13)]"
    >
      <div className="relative h-52 overflow-hidden">
        {!imageFailed ? (
          <Image
            src={imageUrl}
            alt={`${city} destination`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-7xl">{destinationEmoji}</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDealTone(dealClassification)}`}>{dealClassification}</span>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900">Deal score {Math.round(dealScore)}</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-3xl font-bold leading-none text-white">{city}</h3>
            <p className="mt-1 text-sm text-white/90">{country}</p>
          </div>
          <div className={`rounded-2xl bg-gradient-to-r ${valueMeta.tone} px-3 py-1.5 text-right text-white shadow-lg`}>
            <p className="text-[11px] font-medium uppercase tracking-wide">{valueMeta.label}</p>
            <p className="text-3xl font-black leading-none">{Math.round(valueScore)}%</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Final tax-inclusive fare</p>
            <p className="mt-1 text-4xl font-black leading-none text-violet-600">{formatMoney(totalPrice).replace("CAD ", "")}</p>
            <p className="mt-1 text-sm text-slate-500">CAD per traveler · taxes included ({formatMoney(taxAmount)} est.)</p>
          </div>
          {savingsPercent > 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">↓ {savingsPercent}% vs typical</span>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <Image
                src={logoUrl}
                alt={`${airline} logo`}
                width={38}
                height={38}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600">{airlineCode}</div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{airline}</p>
              <p className="text-xs text-slate-500">Operated by {airlineCode} · {destination}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
          <p className="rounded-xl bg-slate-50 px-2 py-1.5 text-center font-medium">{duration}</p>
          <p className="rounded-xl bg-slate-50 px-2 py-1.5 text-center font-medium">{stopLabel}</p>
          <p className="rounded-xl bg-slate-50 px-2 py-1.5 text-center font-medium">{formatDate(date)}</p>
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3.5 text-center text-base font-bold text-white shadow-[0_8px_22px_rgba(124,58,237,0.35)] transition hover:brightness-110"
        >
          Book this fare
        </a>

        <button
          onClick={() => setShowSubscription((prev) => !prev)}
          className="text-left text-xs font-semibold text-violet-700 transition hover:text-violet-800"
        >
          {showSubscription ? "Hide price alerts" : `Track ${city} price alerts`}
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
