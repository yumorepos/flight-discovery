export type AirlineBrand = {
  code: string;
  name: string;
  alliance?: string;
  color: string;
  logoUrls: string[];
};

const ENABLE_REMOTE_ASSETS = process.env.NEXT_PUBLIC_ENABLE_REMOTE_ASSETS === "true";

const AIRLINE_METADATA: Record<string, Omit<AirlineBrand, "logoUrls">> = {
  AC: { code: "AC", name: "Air Canada", alliance: "Star Alliance", color: "#d71920" },
  UA: { code: "UA", name: "United Airlines", alliance: "Star Alliance", color: "#005da8" },
  LH: { code: "LH", name: "Lufthansa", alliance: "Star Alliance", color: "#05164d" },
  AF: { code: "AF", name: "Air France", alliance: "SkyTeam", color: "#002157" },
  EK: { code: "EK", name: "Emirates", color: "#d71920" },
  BA: { code: "BA", name: "British Airways", alliance: "oneworld", color: "#1f2f6d" },
  SQ: { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance", color: "#1f3873" },
  DL: { code: "DL", name: "Delta", alliance: "SkyTeam", color: "#c8102e" },
  AA: { code: "AA", name: "American Airlines", alliance: "oneworld", color: "#0078d2" },
  QF: { code: "QF", name: "Qantas", alliance: "oneworld", color: "#e0001b" },
};

const AIRLINE_NAME_TO_CODE: Record<string, string> = {
  "Air Canada": "AC",
  "United Airlines": "UA",
  United: "UA",
  Lufthansa: "LH",
  Porter: "PD",
  "Air France": "AF",
  Emirates: "EK",
  Delta: "DL",
  "American Airlines": "AA",
  "British Airways": "BA",
  "Singapore Airlines": "SQ",
  Qantas: "QF",
  LATAM: "LA",
  ANA: "NH",
};

const resolveCode = (airline: string) => {
  const canonical = AIRLINE_NAME_TO_CODE[airline.trim()];
  if (canonical) return canonical;
  const inline = airline.match(/\(([A-Z0-9]{2})\)/)?.[1];
  if (inline) return inline;
  return airline.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "XX";
};

const getLogoUrls = (code: string) => {
  if (!ENABLE_REMOTE_ASSETS) return ["/file.svg"];
  return [
    `https://images.kiwi.com/airlines/64x64/${code}.png`,
    `https://images.kiwi.com/airlines/128x128/${code}.png`,
  ];
};

export const getAirlineBrand = (airline: string): AirlineBrand => {
  const code = resolveCode(airline);
  const meta = AIRLINE_METADATA[code] ?? { code, name: airline, color: "#334155" };

  return {
    ...meta,
    logoUrls: getLogoUrls(code),
  };
};
