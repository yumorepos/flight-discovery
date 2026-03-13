export type AirlineBrand = {
  code: string;
  name: string;
  alliance?: string;
  color: string;
  logoUrls: string[];
};

const AIRLINE_METADATA: Record<string, Omit<AirlineBrand, "logoUrls"> & { domain?: string }> = {
  AC: { code: "AC", name: "Air Canada", alliance: "Star Alliance", color: "#d71920", domain: "aircanada.com" },
  RV: { code: "RV", name: "Air Canada Rouge", alliance: "Star Alliance", color: "#d71920", domain: "flyrouge.com" },
  TS: { code: "TS", name: "Air Transat", color: "#0f2f87", domain: "airtransat.com" },
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
  JL: { code: "JL", name: "Japan Airlines", alliance: "oneworld", color: "#c6002b", domain: "jal.co.jp" },
  B6: { code: "B6", name: "JetBlue", color: "#003876", domain: "jetblue.com" },
  VS: { code: "VS", name: "Virgin Atlantic", color: "#da0530", domain: "virginatlantic.com" },
  LA: { code: "LA", name: "LATAM Airlines", color: "#492874", domain: "latamairlines.com" },
  AZ: { code: "AZ", name: "ITA Airways", color: "#0b4d2f", domain: "ita-airways.com" },
};

const AIRLINE_NAME_TO_CODE: Record<string, string> = {
  "air canada": "AC",
  "air canada rouge": "RV",
  rouge: "RV",
  "air transat": "TS",
  transat: "TS",
  "united airlines": "UA",
  united: "UA",
  lufthansa: "LH",
  porter: "PD",
  "porter airlines": "PD",
  "air france": "AF",
  emirates: "EK",
  delta: "DL",
  "american airlines": "AA",
  "british airways": "BA",
  "singapore airlines": "SQ",
  qantas: "QF",
  latam: "LA",
  "latam airlines": "LA",
  ana: "NH",
  "japan airlines": "JL",
  jal: "JL",
  jetblue: "B6",
  "virgin atlantic": "VS",
  klm: "KL",
  westjet: "WS",
  flair: "F8",
  "flair airlines": "F8",
  "ita airways": "AZ",
};

const normalizeAirlineName = (airline: string) => airline.trim().toLowerCase().replace(/\s+/g, " ");

const resolveCode = (airline: string) => {
  const normalized = normalizeAirlineName(airline);
  if (AIRLINE_NAME_TO_CODE[normalized]) return AIRLINE_NAME_TO_CODE[normalized];

  const keywordMatch = Object.entries(AIRLINE_NAME_TO_CODE).find(([name]) => normalized.includes(name));
  if (keywordMatch) return keywordMatch[1];

  const inline = airline.match(/\(([A-Z0-9]{2})\)/i)?.[1]?.toUpperCase();
  if (inline) return inline;

  return airline.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "XX";
};

const monogramFallback = (airlineName: string, color: string) => {
  const initials = airlineName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "FL";

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(color.replace("#", ""))}&color=ffffff&bold=true&size=128&format=png`;
};

const getLogoUrls = (code: string, name: string, color: string, domain?: string) => {
  const sources = [
    `https://images.kiwi.com/airlines/128x128/${code}.png`,
    `https://images.kiwi.com/airlines/64x64/${code}.png`,
  ];

  if (domain) {
    sources.push(`https://logo.clearbit.com/${domain}`);
  }

  sources.push(monogramFallback(name, color));
  return sources;
};

export const getAirlineBrand = (airline: string): AirlineBrand => {
  const code = resolveCode(airline);
  const meta = AIRLINE_METADATA[code] ?? { code, name: airline, color: "#334155" };

  return {
    ...meta,
    logoUrls: getLogoUrls(code, meta.name, meta.color, meta.domain),
  };
};
