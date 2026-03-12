export type DestinationImageConfig = {
  hero: string;
  landscape: string;
  portrait: string;
  credit: string;
};

const ENABLE_REMOTE_ASSETS = process.env.NEXT_PUBLIC_ENABLE_REMOTE_ASSETS === "true";

const localSet = (asset: string): DestinationImageConfig => ({
  hero: asset,
  landscape: asset,
  portrait: asset,
  credit: "Local",
});

const LOCAL_DESTINATION_IMAGES: Record<string, DestinationImageConfig> = {
  London: localSet("/globe.svg"),
  Paris: localSet("/window.svg"),
  Tokyo: localSet("/globe.svg"),
  Rome: localSet("/window.svg"),
  Barcelona: localSet("/globe.svg"),
};

const image = (id: string, w: number, h: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const REMOTE_CURATED_DESTINATION_IMAGES: Record<string, DestinationImageConfig> = {
  London: {
    hero: image("photo-1513635269975-59663e0ac1ad", 1600, 900),
    landscape: image("photo-1513635269975-59663e0ac1ad", 1200, 700),
    portrait: image("photo-1513635269975-59663e0ac1ad", 900, 1200),
    credit: "Unsplash",
  },
  Paris: {
    hero: image("photo-1502602898657-3e91760cbb34", 1600, 900),
    landscape: image("photo-1502602898657-3e91760cbb34", 1200, 700),
    portrait: image("photo-1502602898657-3e91760cbb34", 900, 1200),
    credit: "Unsplash",
  },
  Tokyo: {
    hero: image("photo-1536098561742-ca998e48cbcc", 1600, 900),
    landscape: image("photo-1536098561742-ca998e48cbcc", 1200, 700),
    portrait: image("photo-1536098561742-ca998e48cbcc", 900, 1200),
    credit: "Unsplash",
  },
  Rome: {
    hero: image("photo-1529260830199-42c24126f198", 1600, 900),
    landscape: image("photo-1529260830199-42c24126f198", 1200, 700),
    portrait: image("photo-1529260830199-42c24126f198", 900, 1200),
    credit: "Unsplash",
  },
  Barcelona: {
    hero: image("photo-1539037116277-4db20889f2d4", 1600, 900),
    landscape: image("photo-1539037116277-4db20889f2d4", 1200, 700),
    portrait: image("photo-1539037116277-4db20889f2d4", 900, 1200),
    credit: "Unsplash",
  },
};

const REMOTE_REGION_FALLBACK_IMAGES: Record<string, DestinationImageConfig[]> = {
  NA: [
    { hero: image("photo-1489515217757-5fd1be406fef", 1600, 900), landscape: image("photo-1489515217757-5fd1be406fef", 1200, 700), portrait: image("photo-1489515217757-5fd1be406fef", 900, 1200), credit: "Unsplash" },
    { hero: image("photo-1523905330026-b8bd1f5f320e", 1600, 900), landscape: image("photo-1523905330026-b8bd1f5f320e", 1200, 700), portrait: image("photo-1523905330026-b8bd1f5f320e", 900, 1200), credit: "Unsplash" },
  ],
  EU: [{ hero: image("photo-1467269204594-9661b134dd2b", 1600, 900), landscape: image("photo-1467269204594-9661b134dd2b", 1200, 700), portrait: image("photo-1467269204594-9661b134dd2b", 900, 1200), credit: "Unsplash" }],
  Asia: [{ hero: image("photo-1470004914212-05527e49370b", 1600, 900), landscape: image("photo-1470004914212-05527e49370b", 1200, 700), portrait: image("photo-1470004914212-05527e49370b", 900, 1200), credit: "Unsplash" }],
  Oceania: [{ hero: image("photo-1469854523086-cc02fe5d8800", 1600, 900), landscape: image("photo-1469854523086-cc02fe5d8800", 1200, 700), portrait: image("photo-1469854523086-cc02fe5d8800", 900, 1200), credit: "Unsplash" }],
  AF: [{ hero: image("photo-1516026672322-bc52d61a55d5", 1600, 900), landscape: image("photo-1516026672322-bc52d61a55d5", 1200, 700), portrait: image("photo-1516026672322-bc52d61a55d5", 900, 1200), credit: "Unsplash" }],
  SA: [{ hero: image("photo-1483729558449-99ef09a8c325", 1600, 900), landscape: image("photo-1483729558449-99ef09a8c325", 1200, 700), portrait: image("photo-1483729558449-99ef09a8c325", 900, 1200), credit: "Unsplash" }],
};

const REMOTE_GENERIC_FALLBACK: DestinationImageConfig = {
  hero: image("photo-1436491865332-7a61a109cc05", 1600, 900),
  landscape: image("photo-1436491865332-7a61a109cc05", 1200, 700),
  portrait: image("photo-1436491865332-7a61a109cc05", 900, 1200),
  credit: "Unsplash",
};

const LOCAL_REGION_FALLBACK_IMAGES: Record<string, DestinationImageConfig[]> = {
  NA: [localSet("/globe.svg")],
  EU: [localSet("/window.svg")],
  Asia: [localSet("/globe.svg")],
  Oceania: [localSet("/window.svg")],
  AF: [localSet("/globe.svg")],
  SA: [localSet("/window.svg")],
};

const LOCAL_GENERIC_FALLBACK = localSet("/globe.svg");

const hashValue = (input: string) => Array.from(input).reduce((acc, char) => (acc + char.charCodeAt(0) * 17) % 997, 0);

export const getDestinationImageSet = (city: string, region?: string): DestinationImageConfig => {
  const curated = ENABLE_REMOTE_ASSETS ? REMOTE_CURATED_DESTINATION_IMAGES : LOCAL_DESTINATION_IMAGES;
  const regionFallbacks = ENABLE_REMOTE_ASSETS ? REMOTE_REGION_FALLBACK_IMAGES : LOCAL_REGION_FALLBACK_IMAGES;
  const genericFallback = ENABLE_REMOTE_ASSETS ? REMOTE_GENERIC_FALLBACK : LOCAL_GENERIC_FALLBACK;

  if (curated[city]) return curated[city];
  if (region && regionFallbacks[region]) {
    const options = regionFallbacks[region];
    return options[hashValue(city) % options.length];
  }
  return genericFallback;
};
