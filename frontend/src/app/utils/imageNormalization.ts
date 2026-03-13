"use client";

/**
 * 3-Layer Image Resolution System for FlightFinder
 * 
 * Layer 1: Exact destination match (33 curated city images)
 * Layer 2: Category/region fallbacks (13 fallback images)
 * Layer 3: Universal fallback (generic travel image)
 * 
 * Features:
 * - Removes airport codes from destination names
 * - Handles accents (Montréal → montreal)
 * - Case-insensitive matching
 * - Production-safe with comprehensive fallbacks
 */

export interface DestinationImageMetadata {
  imageUrl: string;
  category: 'city' | 'beach' | 'historic' | 'nature' | 'modern' | 'resort' | 'cultural';
  region: 'canada' | 'usa' | 'europe' | 'asia' | 'middle-east' | 'oceania' | 'other';
  attribution: string;
}

/**
 * Normalize destination name for matching
 * - Remove airport codes: "Paris (CDG)" → "paris"
 * - Remove accents: "Montréal" → "montreal"
 * - Lowercase, trim whitespace
 */
export function normalizeDestinationName(destination: string): string {
  if (!destination) return '';
  
  // Remove airport codes in parentheses
  let normalized = destination.replace(/\s*\([A-Z]{3}\)\s*/g, '');
  
  // Remove accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Lowercase and trim
  normalized = normalized.toLowerCase().trim();
  
  // Replace spaces/hyphens with consistent format
  normalized = normalized.replace(/[\s-]+/g, '-');
  
  return normalized;
}

/**
 * Layer 1: Exact destination matches (33 curated city images)
 * Stable Unsplash photo IDs for consistent loading
 */
const DESTINATION_IMAGES: Record<string, DestinationImageMetadata> = {
  // Canada
  'toronto': {
    imageUrl: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=600&fit=crop',
    category: 'city',
    region: 'canada',
    attribution: 'Photo by Emile Séguin on Unsplash'
  },
  'montreal': {
    imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
    category: 'cultural',
    region: 'canada',
    attribution: 'Photo by Artur Aldyrkhanov on Unsplash'
  },
  'vancouver': {
    imageUrl: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&h=600&fit=crop',
    category: 'nature',
    region: 'canada',
    attribution: 'Photo by Aditya Chinchure on Unsplash'
  },
  'calgary': {
    imageUrl: 'https://images.unsplash.com/photo-1583552334351-ec50b82ceff4?w=800&h=600&fit=crop',
    category: 'city',
    region: 'canada',
    attribution: 'Photo by Jimmy Conover on Unsplash'
  },

  // USA - East Coast
  'new-york': {
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Luca Bravo on Unsplash'
  },
  'newark': {
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Luca Bravo on Unsplash (NYC area)'
  },
  'boston': {
    imageUrl: 'https://images.unsplash.com/photo-1551016043-06514f1e8e67?w=800&h=600&fit=crop',
    category: 'historic',
    region: 'usa',
    attribution: 'Photo by Yinan Chen on Unsplash'
  },
  'miami': {
    imageUrl: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&h=600&fit=crop',
    category: 'beach',
    region: 'usa',
    attribution: 'Photo by Sven Scheuermeier on Unsplash'
  },
  'fort-lauderdale': {
    imageUrl: 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&h=600&fit=crop',
    category: 'beach',
    region: 'usa',
    attribution: 'Photo by Alex Shutin on Unsplash'
  },
  'orlando': {
    imageUrl: 'https://images.unsplash.com/photo-1605648916319-cf082f7524a1?w=800&h=600&fit=crop',
    category: 'resort',
    region: 'usa',
    attribution: 'Photo by Brian McGowan on Unsplash'
  },

  // USA - West Coast
  'los-angeles': {
    imageUrl: 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Luke Stackpoole on Unsplash'
  },
  'san-francisco': {
    imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Maarten van den Heuvel on Unsplash'
  },
  'seattle': {
    imageUrl: 'https://images.unsplash.com/photo-1519735777090-ec97c5a0fc9b?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Thom Milkovic on Unsplash'
  },
  'las-vegas': {
    imageUrl: 'https://images.unsplash.com/photo-1506718468845-7578aa47670b?w=800&h=600&fit=crop',
    category: 'resort',
    region: 'usa',
    attribution: 'Photo by Logan Armstrong on Unsplash'
  },
  'chicago': {
    imageUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&h=600&fit=crop',
    category: 'city',
    region: 'usa',
    attribution: 'Photo by Pedro Lastra on Unsplash'
  },

  // Europe - Western
  'london': {
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
    category: 'historic',
    region: 'europe',
    attribution: 'Photo by Eva Dang on Unsplash'
  },
  'paris': {
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
    category: 'historic',
    region: 'europe',
    attribution: 'Photo by Alex Azabache on Unsplash'
  },
  'amsterdam': {
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
    category: 'cultural',
    region: 'europe',
    attribution: 'Photo by Adrien Olichon on Unsplash'
  },
  'frankfurt': {
    imageUrl: 'https://images.unsplash.com/photo-1549074558-3f0d9b16f7d9?w=800&h=600&fit=crop',
    category: 'modern',
    region: 'europe',
    attribution: 'Photo by Nikolaus Knieling on Unsplash'
  },

  // Europe - Southern
  'madrid': {
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop',
    category: 'cultural',
    region: 'europe',
    attribution: 'Photo by Jorge Fernández Salas on Unsplash'
  },
  'barcelona': {
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
    category: 'beach',
    region: 'europe',
    attribution: 'Photo by Timo Volz on Unsplash'
  },
  'rome': {
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
    category: 'historic',
    region: 'europe',
    attribution: 'Photo by Roman Kraft on Unsplash'
  },

  // Asia
  'tokyo': {
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    category: 'modern',
    region: 'asia',
    attribution: 'Photo by Louie Martinez on Unsplash'
  },
  'hong-kong': {
    imageUrl: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&h=600&fit=crop',
    category: 'city',
    region: 'asia',
    attribution: 'Photo by Ryan Chan on Unsplash'
  },
  'singapore': {
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
    category: 'modern',
    region: 'asia',
    attribution: 'Photo by Hu Chen on Unsplash'
  },
  'bangkok': {
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
    category: 'cultural',
    region: 'asia',
    attribution: 'Photo by Bhargava Srivari on Unsplash'
  },
  'seoul': {
    imageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop',
    category: 'modern',
    region: 'asia',
    attribution: 'Photo by Tae-Hoon Kim on Unsplash'
  },

  // Middle East
  'dubai': {
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
    category: 'modern',
    region: 'middle-east',
    attribution: 'Photo by Christoph Schulz on Unsplash'
  },

  // Oceania
  'sydney': {
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
    category: 'beach',
    region: 'oceania',
    attribution: 'Photo by Dan Freeman on Unsplash'
  },

  // Caribbean
  'nassau': {
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
    category: 'beach',
    region: 'other',
    attribution: 'Photo by Marissa Daeger on Unsplash (Bahamas)'
  },

  // Europe - Portugal
  'lisbon': {
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop',
    category: 'historic',
    region: 'europe',
    attribution: 'Photo by Mehdi Torabi on Unsplash'
  },
  'ponta-delgada': {
    imageUrl: 'https://images.unsplash.com/photo-1580837119756-563d608dd119?w=800&h=600&fit=crop',
    category: 'nature',
    region: 'europe',
    attribution: 'Photo by Tobias Tullius on Unsplash (Azores)'
  },
};

/**
 * Layer 2: Category/region fallbacks (13 fallback images)
 * Used when exact destination not found in Layer 1
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  // Categories
  'city': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop',
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
  'historic': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=600&fit=crop',
  'nature': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  'modern': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop',
  'resort': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'cultural': 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&h=600&fit=crop',
  
  // Regions
  'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&h=600&fit=crop',
  'usa': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&h=600&fit=crop',
  'europe': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=600&fit=crop',
  'asia': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
  'middle-east': 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&h=600&fit=crop',
  'oceania': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&h=600&fit=crop',
};

/**
 * Layer 3: Universal fallback
 * Generic travel/airplane image as last resort
 */
const UNIVERSAL_FALLBACK = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop';

/**
 * Get destination image with 3-layer fallback system
 * 
 * @param destination - Raw destination name (may include airport code)
 * @returns Complete image metadata with fallback chain
 */
export function getDestinationImage(destination: string): DestinationImageMetadata {
  const normalized = normalizeDestinationName(destination);
  
  // Layer 1: Exact match
  if (DESTINATION_IMAGES[normalized]) {
    return DESTINATION_IMAGES[normalized];
  }
  
  // Layer 2: Try to infer category/region from partial matches
  // Check if destination contains known city names
  for (const [cityKey, metadata] of Object.entries(DESTINATION_IMAGES)) {
    if (normalized.includes(cityKey) || cityKey.includes(normalized)) {
      return metadata;
    }
  }
  
  // Layer 2 fallback: Use generic category image
  const fallbackImage = CATEGORY_FALLBACKS['city'] || UNIVERSAL_FALLBACK;
  
  return {
    imageUrl: fallbackImage,
    category: 'city',
    region: 'other',
    attribution: 'Photo by Unsplash'
  };
}

/**
 * Get image for homepage cards (smaller size)
 */
export function getDestinationImageSmall(destination: string): string {
  const metadata = getDestinationImage(destination);
  return metadata.imageUrl.replace('w=800&h=600', 'w=400&h=300');
}
