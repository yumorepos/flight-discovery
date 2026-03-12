export type DestinationImageConfig = {
  hero: string;
  landscape: string;
  portrait: string;
  credit: string;
};

const image = (id: string, w: number, h: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

const remoteSet = (id: string): DestinationImageConfig => ({
  hero: image(id, 1600, 900),
  landscape: image(id, 1200, 720),
  portrait: image(id, 900, 1200),
  credit: "Unsplash",
});

const CURATED_DESTINATION_IMAGES: Record<string, DestinationImageConfig> = {
  London: remoteSet("photo-1513635269975-59663e0ac1ad"),
  Paris: remoteSet("photo-1502602898657-3e91760cbb34"),
  Tokyo: remoteSet("photo-1540959733332-eab4deabeeaf"),
  Rome: remoteSet("photo-1529260830199-42c24126f198"),
  Barcelona: remoteSet("photo-1539037116277-4db20889f2d4"),
  Lisbon: remoteSet("photo-1513735492246-483525079686"),
  Madrid: remoteSet("photo-1543783207-ec64e4d95325"),
  Amsterdam: remoteSet("photo-1534351590666-13e3e96b5017"),
  Berlin: remoteSet("photo-1528728329032-2972f65dfb3f"),
  Dublin: remoteSet("photo-1520637836862-4d197d17c90a"),
  Athens: remoteSet("photo-1555993539-1732b0258235"),
  Prague: remoteSet("photo-1519677100203-a0e668c92439"),
  Vienna: remoteSet("photo-1516550893923-42d28e5677af"),
  Istanbul: remoteSet("photo-1527838832700-5059252407fa"),
  Dubai: remoteSet("photo-1518684079-3c830dcef090"),
  Bangkok: remoteSet("photo-1508009603885-50cf7c579365"),
  Singapore: remoteSet("photo-1525625293386-3f8f99389edd"),
  Seoul: remoteSet("photo-1538485399081-7191377e8241"),
  "Hong Kong": remoteSet("photo-1506973035872-a4ec16b8e8d9"),
  Sydney: remoteSet("photo-1506973035872-a4f23ef0e7f5"),
  Melbourne: remoteSet("photo-1545044846-351ba102b6d5"),
  Auckland: remoteSet("photo-1507699622108-4be3abd695ad"),
  Cairo: remoteSet("photo-1572252009286-268acec5ca0a"),
  Marrakech: remoteSet("photo-1597212618440-806262de4f6b"),
  CapeTown: remoteSet("photo-1576485290814-1c72aa4bbb8e"),
  "Cape Town": remoteSet("photo-1576485290814-1c72aa4bbb8e"),
  Cancun: remoteSet("photo-1552074284-5e88ef1aef18"),
  "Cancún": remoteSet("photo-1552074284-5e88ef1aef18"),
  Honolulu: remoteSet("photo-1507525428034-b723cf961d3e"),
  "New York": remoteSet("photo-1499092346589-b9b6be3e94b2"),
  "Los Angeles": remoteSet("photo-1534190760961-74e8c1c5c3da"),
  Vancouver: remoteSet("photo-1566698629409-787a68fc5724"),
  Toronto: remoteSet("photo-1517935706615-2717063c2225"),
  Miami: remoteSet("photo-1535498730771-e735b998cd64"),
  MexicoCity: remoteSet("photo-1518105779142-d975f22f1b0a"),
  "Mexico City": remoteSet("photo-1518105779142-d975f22f1b0a"),
  "Rio de Janeiro": remoteSet("photo-1483729558449-99ef09a8c325"),
  Lima: remoteSet("photo-1531968455001-5c5272a41129"),
  Bogota: remoteSet("photo-1531968455001-5c5272a41129"),
};

const REGION_FALLBACK_IMAGES: Record<string, DestinationImageConfig[]> = {
  NA: [remoteSet("photo-1489515217757-5fd1be406fef"), remoteSet("photo-1499092346589-b9b6be3e94b2")],
  EU: [remoteSet("photo-1467269204594-9661b134dd2b"), remoteSet("photo-1534351590666-13e3e96b5017")],
  Asia: [remoteSet("photo-1470004914212-05527e49370b"), remoteSet("photo-1508009603885-50cf7c579365")],
  Oceania: [remoteSet("photo-1469854523086-cc02fe5d8800")],
  AF: [remoteSet("photo-1516026672322-bc52d61a55d5")],
  SA: [remoteSet("photo-1483729558449-99ef09a8c325")],
};

const GENERIC_TRAVEL_FALLBACK = remoteSet("photo-1469474968028-56623f02e42e");

const hashValue = (input: string) => Array.from(input).reduce((acc, char) => (acc + char.charCodeAt(0) * 17) % 997, 0);

export const getDestinationImageSet = (city: string, region?: string): DestinationImageConfig => {
  const normalizedCity = city.trim();
  if (CURATED_DESTINATION_IMAGES[normalizedCity]) return CURATED_DESTINATION_IMAGES[normalizedCity];

  if (region && REGION_FALLBACK_IMAGES[region]) {
    const options = REGION_FALLBACK_IMAGES[region];
    return options[hashValue(normalizedCity) % options.length];
  }

  return GENERIC_TRAVEL_FALLBACK;
};
