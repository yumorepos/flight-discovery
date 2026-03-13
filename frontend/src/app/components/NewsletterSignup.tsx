"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && destination) {
      console.log("Subscribing:", { email, destination });
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
        setDestination("");
      }, 3000);
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="container mx-auto px-4 max-w-7xl text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
          Never Miss a <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Deal</span>
        </h2>
        <p className="text-base md:text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Get daily flight alerts for your favorite destinations. We'll notify you when prices drop.
        </p>

        {subscribed ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-green-800 font-bold text-xl">You're all set!</p>
            <p className="text-green-700 mt-2">Check your email for confirmation.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-10 max-w-3xl mx-auto">
            <form onSubmit={handleSubscribe}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="text-left">
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
                    Destination City
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Paris, Tokyo, London"
                    className="w-full h-13 px-4 rounded-lg border-2 border-gray-200 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
                <div className="text-left">
                  <label className="block text-sm font-bold text-gray-700 mb-2.5 uppercase tracking-wider">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-13 px-4 rounded-lg border-2 border-gray-200 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-base h-14 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🔔</span>
                <span>Subscribe to Daily Alerts</span>
              </button>
              <p className="mt-4 text-sm text-slate-500">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
