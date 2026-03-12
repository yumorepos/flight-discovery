export type AirlineBrand = {
  code: string;
  name: string;
  alliance?: string;
  color: string;
  logoUrls: string[];
};

const AIRLINE_METADATA: Record<string, Omit<AirlineBrand, "logoUrls"> & { domain?: string }> = {
  AC: { code: "AC", name: "Air Canada", alliance: "Star Alliance", color: "#d71920", domain: "aircanada.com" },
  UA: { code: "UA", name: "United Airlines", alliance: "Star Alliance", color: "#005da8", domain: "united.com" },
  LH: { code: "LH", name: "Lufthansa", alliance: "Star Alliance", color: "#05164d", domain: "lufthansa.com" },
  AF: { code: "AF", name: "Air France", alliance: "SkyTeam", color: "#002157", domain: "airfrance.com" },
  EK: { code: "EK", name: "Emirates", color: "#d71920", domain: "emirates.com" },
  BA: { code: "BA", name: "British Airways", alliance: "oneworld", color: "#1f2f6d", domain: "britishairways.com" },
  SQ: { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance", color: "#1f3873", domain: "singaporeair.com" },
  DL: { code: "DL", name: "Delta", alliance: "SkyTeam", color: "#c8102e", domain: "delta.com" },
  AA: { code: "AA", name: "American Airlines", alliance: "oneworld", color: "#0078d2", domain: "aa.com" },
  QF: { code: "QF", name: "Qantas", alliance: "oneworld", color: "#e0001b", domain: "qantas.com" },
  KL: { code: "KL", name: "KLM", alliance: "SkyTeam", color: "#00a1de", domain: "klm.com" },
  WS: { code: "WS", name: "WestJet", color: "#003b5c", domain: "westjet.com" },
  PD: { code: "PD", name: "Porter Airlines", color: "#1f2937", domain: "flyporter.com" },
  F8: { code: "F8", name: "Flair Airlines", color: "#84cc16", domain: "flyflair.com" },
  NH: { code: "NH", name: "ANA", alliance: "Star Alliance", color: "#0f2f87", domain: "ana.co.jp" },
};

const AIRLINE_NAME_TO_CODE: Record<string, string> = {
  "Air Canada": "AC",
  "United Airlines": "UA",
  United: "UA",
  Lufthansa: "LH",
  Porter: "PD",
  "Porter Airlines": "PD",
  "Air France": "AF",
  Emirates: "EK",
  Delta: "DL",
  "American Airlines": "AA",
  "British Airways": "BA",
  "Singapore Airlines": "SQ",
  Qantas: "QF",
  LATAM: "LA",
  ANA: "NH",
  KLM: "KL",
  WestJet: "WS",
  Flair: "F8",
  "Flair Airlines": "F8",
};

const resolveCode = (airline: string) => {
  const trimmed = airline.trim();
  const canonical = AIRLINE_NAME_TO_CODE[trimmed];
  if (canonical) return canonical;

  const inline = trimmed.match(/\(([A-Z0-9]{2})\)/)?.[1];
  if (inline) return inline;

  return trimmed.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "XX";
};

const getLogoUrls = (code: string, domain?: string) => {
  const sources = [`https://images.kiwi.com/airlines/128x128/${code}.png`, `https://images.kiwi.com/airlines/64x64/${code}.png`];
  if (domain) sources.push(`https://logo.clearbit.com/${domain}`);
  return sources;
};

export const getAirlineBrand = (airline: string): AirlineBrand => {
  const code = resolveCode(airline);
  const meta = AIRLINE_METADATA[code] ?? { code, name: airline, color: "#334155" };

  return {
    ...meta,
    logoUrls: getLogoUrls(code, meta.domain),
  };
};
