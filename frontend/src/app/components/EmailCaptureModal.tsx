"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailCaptureModal() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Show after 10 seconds
  useState(() => {
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send to backend /api/subscribe
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'modal' })
    });
    setSubmitted(true);
    setTimeout(() => setShow(false), 2000);
  };

  if (submitted) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="rounded-2xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="text-5xl mb-4">✈️</div>
            <h3 className="text-2xl font-bold">You're on the list!</h3>
            <p className="mt-2 text-slate-600">We'll send you the best deals weekly.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-2xl font-bold">Never miss a deal</h3>
            <p className="mt-2 text-slate-600">
              Get weekly email alerts with the best flight deals
            </p>
            <form onSubmit={handleSubmit} className="mt-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl"
              >
                Get weekly deals
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              Free forever. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
