"use client";

import { FormEvent, useState } from "react";

interface EmailSubscriptionProps {
  destination: string;
  route: string;
  price: number;
  travelMonth: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSubscription({ destination, route, price, travelMonth }: EmailSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState(price);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (event: FormEvent) => {
    event.preventDefault();

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          destination,
          route,
          threshold_price: threshold,
          travel_month: travelMonth,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Subscription failed");
      }

      setSubscribed(true);
      setEmail("");
    } catch (subscribeError) {
      const message = subscribeError instanceof Error ? subscribeError.message : "Subscription failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Alert enabled for <strong>{destination}</strong> ({travelMonth}) under CAD ${threshold}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} noValidate className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Smart price alerts</p>
      <p className="mt-1 text-xs text-slate-500">Track destination, route, threshold, and travel month.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          disabled={loading}
          aria-label="Email address"
        />
        <input
          type="number"
          value={threshold}
          min={100}
          step={10}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          aria-label="Price threshold"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving..." : "Notify me"}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </form>
  );
}
