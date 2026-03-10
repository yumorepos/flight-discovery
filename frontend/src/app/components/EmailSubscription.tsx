"use client";

import { useState } from "react";

interface EmailSubscriptionProps {
  destination: string;
  price: number;
}

export default function EmailSubscription({ destination, price }: EmailSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, destination }),
      });

      if (!res.ok) {
        throw new Error("Subscription failed");
      }

      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 font-semibold">
          ✅ Subscribed! You'll get email alerts when prices drop for {destination}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-900 mb-2">
        🔔 Get Price Drop Alerts for {destination}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        We'll email you when this flight drops below ${price}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
