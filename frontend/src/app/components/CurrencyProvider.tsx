"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_RATES,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  cacheRates,
  fetchExchangeRates,
  readCachedRates,
  readStoredCurrency,
  storeCurrency,
} from "@/lib/currency";

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  rates: Record<SupportedCurrency, number>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => readStoredCurrency());
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(() => readCachedRates() ?? DEFAULT_RATES);

  useEffect(() => {
    const cached = readCachedRates();

    fetchExchangeRates()
      .then((freshRates) => {
        setRates(freshRates);
        cacheRates(freshRates);
      })
      .catch(() => {
        if (!cached) setRates(DEFAULT_RATES);
      });
  }, []);

  const setCurrency = (next: SupportedCurrency) => {
    if (!SUPPORTED_CURRENCIES.includes(next)) return;
    setCurrencyState(next);
    storeCurrency(next);
  };

  const value = useMemo(() => ({ currency, setCurrency, rates }), [currency, rates]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
};
