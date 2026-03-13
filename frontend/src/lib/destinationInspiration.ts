export type DestinationInspiration = {
  blurb: string;
  vibe: string;
  bestFor: string;
  seasonHook: string;
};

const DESTINATION_STORIES: Record<string, DestinationInspiration> = {
  Paris: { blurb: "Café terraces, timeless boulevards, and museum-filled afternoons.", vibe: "Romantic classic", bestFor: "Art weekends", seasonHook: "Best in spring" },
  London: { blurb: "Royal landmarks, neighborhood markets, and packed cultural calendars.", vibe: "Cosmopolitan", bestFor: "City-hopping", seasonHook: "Best in shoulder season" },
  Tokyo: { blurb: "Temple mornings, neon nights, and endlessly good food districts.", vibe: "High-energy", bestFor: "Food + design", seasonHook: "Great year-round" },
  Rome: { blurb: "Ancient landmarks, long dinners, and golden-hour piazza walks.", vibe: "Historic glow", bestFor: "Slow travel", seasonHook: "Best in spring/fall" },
  Barcelona: { blurb: "Beach downtime meets Gaudí architecture in one compact city.", vibe: "Sunny creative", bestFor: "Culture + coast", seasonHook: "Best in early summer" },
  "Cancún": { blurb: "Turquoise water escapes with cenotes and easy coastal luxury.", vibe: "Tropical reset", bestFor: "Beach downtime", seasonHook: "Best in winter" },
  Honolulu: { blurb: "Pacific sunsets, surf-friendly shores, and volcanic scenery.", vibe: "Island luxury", bestFor: "Nature + wellness", seasonHook: "Best in spring" },
  Lima: { blurb: "Clifftop ocean views anchored by one of the region's top food scenes.", vibe: "Urban coastal", bestFor: "Culinary trips", seasonHook: "Best in dry season" },
};

const REGION_STORIES: Record<string, DestinationInspiration> = {
  EU: { blurb: "Storybook old towns and rail-friendly city pairs for easy escapes.", vibe: "Old-world charm", bestFor: "Multi-city breaks", seasonHook: "Best in spring/fall" },
  NA: { blurb: "Short-haul coastlines, mountain air, and quick premium getaways.", vibe: "Easy getaway", bestFor: "Long weekends", seasonHook: "Great year-round" },
  Asia: { blurb: "Skyline energy, market streets, and rich cultural contrast.", vibe: "Dynamic", bestFor: "Big adventures", seasonHook: "Best by region" },
  SA: { blurb: "Warm coastlines and colorful cities with standout cuisine.", vibe: "Colorful", bestFor: "Food + nature", seasonHook: "Best in shoulder season" },
};

export const getDestinationInspiration = (city: string, region: string): DestinationInspiration => {
  return DESTINATION_STORIES[city] ?? REGION_STORIES[region] ?? {
    blurb: "Strong-value routes with enough variety to spark your next trip.",
    vibe: "Discovery mode",
    bestFor: "Flexible travelers",
    seasonHook: "Best with flexible dates",
  };
};
