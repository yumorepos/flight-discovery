export type CabinClass = "Economy" | "Premium Economy" | "Business" | "First";
export type FareType = "Basic Economy" | "Standard Economy" | "Flex" | "Premium Economy" | "Business" | "First";

export interface FareMetadata {
  fareType: FareType;
  cabinClass: CabinClass;
  amenities: string[];
  aircraft?: string;
  marketingCarrier: string;
  operatingCarrier: string;
  isCodeshare: boolean;
  fareRules?: string;
  baggage?: string;
}

const AIRCRAFT = ["Boeing 787-9", "Airbus A321neo", "Boeing 777-300ER", "Airbus A350-900", "Boeing 737 MAX 8"];

const FARE_PROFILES: Array<Pick<FareMetadata, "fareType" | "cabinClass" | "amenities" | "fareRules" | "baggage">> = [
  { fareType: "Basic Economy", cabinClass: "Economy", amenities: ["Carry-on included", "Meal included"], fareRules: "No changes; non-refundable", baggage: "1 carry-on" },
  { fareType: "Standard Economy", cabinClass: "Economy", amenities: ["Carry-on included", "Seat selection included", "Meal included"], fareRules: "Changes with fee", baggage: "1 carry-on · 1 checked bag" },
  { fareType: "Flex", cabinClass: "Economy", amenities: ["Carry-on included", "Checked bag included", "Refundable", "Changes allowed"], fareRules: "Flexible change and cancellation", baggage: "1 carry-on · 1 checked bag" },
  { fareType: "Premium Economy", cabinClass: "Premium Economy", amenities: ["Carry-on included", "Checked bag included", "Seat selection included", "Meal included"], fareRules: "Lower change fees", baggage: "1 carry-on · 2 checked bags" },
  { fareType: "Business", cabinClass: "Business", amenities: ["Carry-on included", "Checked bag included", "Lounge access", "Wi‑Fi available"], fareRules: "Fully changeable", baggage: "2 carry-ons · 2 checked bags" },
  { fareType: "First", cabinClass: "First", amenities: ["Carry-on included", "Checked bag included", "Meal included", "Refundable"], fareRules: "Fully flexible", baggage: "2 carry-ons · 3 checked bags" },
];

const hash = (input: string) => Array.from(input).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 7);

export const buildFareMetadata = (seed: string, airline: string, stops: number): FareMetadata => {
  const base = FARE_PROFILES[hash(seed) % FARE_PROFILES.length];
  const isCodeshare = stops > 0 && hash(`${seed}-codeshare`) % 3 === 0;
  return {
    ...base,
    amenities: base.amenities.slice(0, 4),
    aircraft: AIRCRAFT[hash(`${seed}-aircraft`) % AIRCRAFT.length],
    marketingCarrier: airline,
    operatingCarrier: isCodeshare ? `${airline} Partner` : airline,
    isCodeshare,
  };
};

export const buildTrendSeries = (basePrice: number, month: string) => {
  const now = month ? new Date(`${month}-01`) : new Date();
  return Array.from({ length: 4 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 + idx, 1);
    const drift = 0.88 + ((idx * 17 + (basePrice % 13)) % 18) / 100;
    return {
      label: d.toLocaleDateString("en-CA", { month: "short" }),
      price: Math.round(basePrice * drift),
    };
  });
};
