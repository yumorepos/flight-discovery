# FlightFinder Architecture

## Overview

FlightFinder is a Next.js 14 application using the App Router for server-side rendering and client-side interactivity.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Playwright, Vitest
- **Deployment:** Vercel

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── layout.tsx            # Root layout
│   │   └── components/
│   │       ├── SearchForm.tsx    # Search input
│   │       ├── ResultsPage.tsx   # Results display
│   │       ├── DestinationCard.tsx # Flight card
│   │       └── PriceSparkline.tsx  # Price chart
│   └── lib/
│       ├── currency.ts           # Currency conversion
│       ├── flightEnrichment.ts  # Fare ranking logic
│       └── destinationImages.ts  # Image utilities
└── tests/
    └── e2e/                      # Playwright tests
```

## Key Components

### Search Flow
1. User enters origin/destination/month in `SearchForm`
2. State updates trigger `ResultsPage` re-render
3. Fare data filtered by user criteria
4. Results ranked by value score

### Fare Ranking Algorithm

```typescript
// Simplified scoring logic
valueScore = 
  (savings / typicalPrice) * 100 +  // Price advantage
  dealQuality * 20 +                 // Deal tier bonus
  routingScore * 10                  // Direct flight bonus
```

### Currency System
- Multi-currency support (CAD, USD, EUR, GBP, JPY, AUD)
- Real-time conversion via context provider
- Persistent currency selection

## Data Flow

1. **Static fare data** loaded from JSON files
2. **Client-side filtering** by origin/destination/dates
3. **Value scoring** applied to each fare
4. **Sorted results** displayed in curated sections

## Performance Optimizations

- Image optimization via Next.js Image component
- Server-side rendering for initial page load
- Client-side routing for fast navigation
- Lazy loading for below-the-fold content

## Testing Strategy

### Visual Regression Tests
- Playwright captures screenshots
- Perceptual hash comparison (hamming distance)
- Tolerance thresholds to reduce flakiness

### Unit Tests
- Fare ranking logic
- Currency conversion
- Utility functions

## Deployment

- **Platform:** Vercel
- **Auto-deploy:** Push to `main` triggers production deployment
- **Preview deploys:** PRs get unique preview URLs
- **Environment:** Edge runtime for global performance

## Future Architecture Considerations

### Live Flight API Integration
```
Client → Next.js API Route → Flight API (Skyscanner/Amadeus)
                           → Cache results
                           → Apply ranking algorithm
                           → Return to client
```

### User Accounts
- Auth via NextAuth.js
- PostgreSQL for user data
- Redis for session management

### Price Alerts
- Cron job checks fare changes
- Email notifications via SendGrid
- User preference management
