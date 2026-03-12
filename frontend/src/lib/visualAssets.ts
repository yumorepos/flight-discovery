const DESTINATION_IMAGE_MAP: Record<string, string> = {
  London: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80",
  Paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80",
  Rome: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1400&q=80",
  Barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1400&q=80",
  Tokyo: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=80",
  Singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=80",
  Dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
  Sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1400&q=80",
  Lisbon: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80",
  Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1400&q=80",
  Zurich: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=1400&q=80",
  Nassau: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80",
  Chicago: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1400&q=80",
  Toronto: "https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=1400&q=80",
  Orlando: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?auto=format&fit=crop&w=1400&q=80",
};

const REGION_FALLBACK_IMAGES: Record<string, string[]> = {
  NA: [
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1523905330026-b8bd1f5f320e?auto=format&fit=crop&w=1400&q=80",
  ],
  EU: [
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80",
  ],
  Asia: [
    "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1555217851-6141535bd771?auto=format&fit=crop&w=1400&q=80",
  ],
  SA: [
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  ],
  AF: [
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
  ],
  Oceania: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1510740213221-14e4a69ef8ee?auto=format&fit=crop&w=1400&q=80",
  ],
};

const GENERIC_FALLBACKS = [
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
];

const AIRLINE_CODE_MAP: Record<string, string> = {
  "Air Canada": "AC",
  "United Airlines": "UA",
  United: "UA",
  Lufthansa: "LH",
  Porter: "PD",
  "Air France": "AF",
  KLM: "KL",
  SWISS: "LX",
  "Swiss International": "LX",
  Emirates: "EK",
  Delta: "DL",
  "American Airlines": "AA",
  "British Airways": "BA",
  "Singapore Airlines": "SQ",
  Qantas: "QF",
  "Turkish Airlines": "TK",
  "Virgin Atlantic": "VS",
  Iberia: "IB",
  JetBlue: "B6",
  LATAM: "LA",
  ANA: "NH",
  JAL: "JL",
};

const hashValue = (input: string) =>
  Array.from(input).reduce((acc, char) => {
    const code = char.charCodeAt(0);
    return (acc + code * 17) % 997;
  }, 0);

const selectStable = (pool: string[], key: string) => pool[hashValue(key) % pool.length];

export const getDestinationImage = (city: string, region?: string) => {
  if (DESTINATION_IMAGE_MAP[city]) {
    return DESTINATION_IMAGE_MAP[city];
  }

  if (region && REGION_FALLBACK_IMAGES[region]) {
    return selectStable(REGION_FALLBACK_IMAGES[region], city);
  }

  return selectStable(GENERIC_FALLBACKS, city);
};

const normalizeAirlineCode = (airline: string) => {
  const codeFromName = AIRLINE_CODE_MAP[airline.trim()];
  if (codeFromName) return codeFromName;

  const inlineCode = airline.match(/\(([A-Z0-9]{2})\)/)?.[1];
  if (inlineCode) return inlineCode;

  return airline.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "XX";
};

export const getAirlineBrand = (airline: string) => {
  const airlineCode = normalizeAirlineCode(airline);
  return {
    airlineCode,
    logoUrl: `https://images.kiwi.com/airlines/64x64/${airlineCode}.png`,
  };
};
