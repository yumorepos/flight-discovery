export type DestinationInspiration = {
  blurb: string;
  vibe: string;
  bestFor: string;
};

const DESTINATION_STORIES: Record<string, DestinationInspiration> = {
  Paris: { blurb: "Golden-hour boulevards, iconic cafés, and museum-heavy city breaks.", vibe: "Romantic classic", bestFor: "Art weekends" },
  London: { blurb: "Royal landmarks, neighborhood markets, and nonstop cultural events.", vibe: "Cosmopolitan", bestFor: "City-hopping" },
  Tokyo: { blurb: "Neon nights, temple mornings, and world-class food districts.", vibe: "High-energy", bestFor: "Food + design" },
  Rome: { blurb: "Ancient streets, late dinners, and timeless piazza evenings.", vibe: "Historic glow", bestFor: "Slow travel" },
  Barcelona: { blurb: "Beach mornings and Gaudí-lined afternoons in one compact city.", vibe: "Sunny creative", bestFor: "Culture + coast" },
  "Cancún": { blurb: "Turquoise shoreline escapes with easy access to cenotes and ruins.", vibe: "Tropical reset", bestFor: "Beach downtime" },
  Honolulu: { blurb: "Pacific sunsets, surf-ready beaches, and lush volcanic backdrops.", vibe: "Island luxury", bestFor: "Nature + wellness" },
  Lima: { blurb: "Clifftop views paired with one of Latin America's best food scenes.", vibe: "Urban coastal", bestFor: "Culinary trips" },
};

const REGION_STORIES: Record<string, DestinationInspiration> = {
  EU: { blurb: "Storybook old towns and rail-friendly city pairs for fast escapes.", vibe: "Old-world charm", bestFor: "Multi-city breaks" },
  NA: { blurb: "Coastal weekends, mountain air, and easy short-haul flexibility.", vibe: "Easy getaway", bestFor: "Long weekends" },
  Asia: { blurb: "Skyline energy, street-food discoveries, and rich cultural contrast.", vibe: "Dynamic", bestFor: "Big adventures" },
  SA: { blurb: "Warm coastlines and rhythm-filled cities with standout cuisine.", vibe: "Colorful", bestFor: "Food + nature" },
};

export const getDestinationInspiration = (city: string, region: string): DestinationInspiration => {
  return DESTINATION_STORIES[city] ?? REGION_STORIES[region] ?? {
    blurb: "Fresh routes with strong value and enough variety to spark your next trip.",
    vibe: "Discovery mode",
    bestFor: "Flexible travelers",
  };
};
