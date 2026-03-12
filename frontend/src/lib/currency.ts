export const SUPPORTED_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "JPY", "AUD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_META: Record<SupportedCurrency, { symbol: string; label: string }> = {
  CAD: { symbol: "$", label: "CAD $" },
  USD: { symbol: "$", label: "USD $" },
  EUR: { symbol: "€", label: "EUR €" },
  GBP: { symbol: "£", label: "GBP £" },
  JPY: { symbol: "¥", label: "JPY ¥" },
  AUD: { symbol: "$", label: "AUD $" },
};

const STORAGE_KEY = "flightfinder_currency";
const RATE_CACHE_KEY = "flightfinder_exchange_rates";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

interface ExchangeCache {
  timestamp: number;
  rates: Record<SupportedCurrency, number>;
}

export const DEFAULT_RATES: Record<SupportedCurrency, number> = {
  CAD: 1,
  USD: 0.74,
  EUR: 0.68,
  GBP: 0.58,
  JPY: 110,
  AUD: 1.13,
};

export const readStoredCurrency = (): SupportedCurrency => {
  if (typeof window === "undefined") return "CAD";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_CURRENCIES.includes(saved as SupportedCurrency)) {
    return saved as SupportedCurrency;
  }
  return "CAD";
};

export const storeCurrency = (currency: SupportedCurrency) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, currency);
};

export const readCachedRates = (): Record<SupportedCurrency, number> | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RATE_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ExchangeCache;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
};

export const cacheRates = (rates: Record<SupportedCurrency, number>) => {
  if (typeof window === "undefined") return;
  const payload: ExchangeCache = { timestamp: Date.now(), rates };
  window.localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(payload));
};

export async function fetchExchangeRates(): Promise<Record<SupportedCurrency, number>> {
  const targets = SUPPORTED_CURRENCIES.filter((code) => code !== "CAD").join(",");
  const response = await fetch(`https://api.frankfurter.app/latest?from=CAD&to=${targets}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load exchange rates");

  const payload = (await response.json()) as { rates?: Partial<Record<SupportedCurrency, number>> };
  const rates = { ...DEFAULT_RATES, ...(payload.rates ?? {}), CAD: 1 };
  return rates;
}

export const convertPrice = (cadAmount: number, currency: SupportedCurrency, rates: Record<SupportedCurrency, number>) => {
  return cadAmount * (rates[currency] ?? 1);
};

export const formatPrice = (cadAmount: number, currency: SupportedCurrency, rates: Record<SupportedCurrency, number>, options?: Intl.NumberFormatOptions) => {
  const amount = convertPrice(cadAmount, currency, rates);
  const symbol = CURRENCY_META[currency].symbol;
  const maximumFractionDigits = currency === "JPY" ? 0 : 0;
  return `${currency} ${symbol}${Math.round(amount).toLocaleString(undefined, { maximumFractionDigits, ...options })}`;
};
