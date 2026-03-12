export interface DemoFlight {
  id: number;
  origin: string;
  destination: string;
  city: string;
  country: string;
  total_price: number;
  tax_amount: number;
  date: string;
  airline: string;
  duration: string;
  stops: number;
  value_score: number;
  region: string;
  deal_score: number;
  deal_classification: string;
  historical_price: number;
  destination_emoji: string;
  booking_url: string;
  price_insight: {
    usual_price: number;
    current_discount: number;
    discount_amount: number;
    historical_comparison: string;
  };
}

interface DestinationTemplate {
  destination: string;
  city: string;
  country: string;
  region: string;
  emoji: string;
  airline: string;
  duration: string;
  stops: number;
  basePrice: number;
  historicalPrice: number;
}

const DESTINATIONS: DestinationTemplate[] = [
  { destination: "CDG", city: "Paris", country: "France", region: "EU", emoji: "🗼", airline: "Air Canada", duration: "7h 15m", stops: 0, basePrice: 648, historicalPrice: 902 },
  { destination: "LHR", city: "London", country: "United Kingdom", region: "EU", emoji: "🎡", airline: "British Airways", duration: "6h 50m", stops: 0, basePrice: 612, historicalPrice: 860 },
  { destination: "NRT", city: "Tokyo", country: "Japan", region: "Asia", emoji: "🗾", airline: "Japan Airlines", duration: "13h 25m", stops: 0, basePrice: 1028, historicalPrice: 1490 },
  { destination: "FCO", city: "Rome", country: "Italy", region: "EU", emoji: "🏛️", airline: "ITA Airways", duration: "8h 25m", stops: 1, basePrice: 688, historicalPrice: 960 },
  { destination: "BCN", city: "Barcelona", country: "Spain", region: "EU", emoji: "⛪", airline: "Air Transat", duration: "8h 10m", stops: 0, basePrice: 634, historicalPrice: 918 },
  { destination: "LIM", city: "Lima", country: "Peru", region: "SA", emoji: "🦙", airline: "LATAM Airlines", duration: "10h 45m", stops: 1, basePrice: 772, historicalPrice: 1042 },
  { destination: "CUN", city: "Cancún", country: "Mexico", region: "NA", emoji: "🏖️", airline: "Air Canada Rouge", duration: "4h 35m", stops: 0, basePrice: 452, historicalPrice: 618 },
  { destination: "HNL", city: "Honolulu", country: "United States", region: "NA", emoji: "🌺", airline: "United Airlines", duration: "12h 40m", stops: 1, basePrice: 886, historicalPrice: 1165 },
];

const MONTH_OFFSET = [3, 6, 9, 12, 15, 18, 21, 24];

const toDate = (month?: string, offset = 3) => {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return `${month}-${String(Math.min(offset, 27)).padStart(2, "0")}`;
  }

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1, offset);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const classifyDeal = (value: number) => {
  if (value >= 92) return "Elite Deal";
  if (value >= 82) return "Outstanding";
  if (value >= 72) return "Great Value";
  return "Good Deal";
};

export function buildDemoFlights(origin: string, month?: string, destination?: string): DemoFlight[] {
  const normalizedOrigin = (origin || "YUL").toUpperCase();
  const destinationFilter = destination?.trim().toUpperCase();

  return DESTINATIONS
    .filter((template) => {
      if (!destinationFilter || destinationFilter === "ANYWHERE") return true;
      if (destinationFilter.length === 3) return template.destination === destinationFilter;
      if (["EUROPE", "ASIA", "BEACH"].includes(destinationFilter)) {
        if (destinationFilter === "EUROPE") return template.region === "EU";
        if (destinationFilter === "ASIA") return template.region === "Asia";
        if (destinationFilter === "BEACH") return ["CUN", "HNL", "LIM"].includes(template.destination);
      }
      return true;
    })
    .map((template, index) => {
      const date = toDate(month, MONTH_OFFSET[index] ?? 8);
      const delta = (index % 3) * 18;
      const totalPrice = template.basePrice + delta;
      const historicalPrice = template.historicalPrice + delta;
      const discountAmount = Math.max(0, historicalPrice - totalPrice);
      const discountPct = Math.round((discountAmount / historicalPrice) * 100);
      const valueScore = Math.max(58, Math.min(96, 95 - index * 4));
      const dealScore = Math.max(62, Math.min(98, 97 - index * 3));

      return {
        id: 9000 + index,
        origin: normalizedOrigin,
        destination: template.destination,
        city: template.city,
        country: template.country,
        total_price: totalPrice,
        tax_amount: Math.round(totalPrice * 0.14),
        date,
        airline: template.airline,
        duration: template.duration,
        stops: template.stops,
        value_score: valueScore,
        region: template.region,
        deal_score: dealScore,
        deal_classification: classifyDeal(valueScore),
        historical_price: historicalPrice,
        destination_emoji: template.emoji,
        booking_url: "https://www.google.com/travel/flights",
        price_insight: {
          usual_price: historicalPrice,
          current_discount: discountPct,
          discount_amount: discountAmount,
          historical_comparison: `${discountPct}% cheaper than seasonal average`,
        },
      };
    });
}
