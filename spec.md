# Pubgolf Game Creation with Map

## Overview

When a host creates a game of Pubgolf, they can optionally pick 9 pubs for the route using an autocomplete search. Once configured, all players have access to a map showing the pubs and a walking route between them.

---

## Feature Requirements

### Pub Selection (During Game Creation)

**Trigger:**
- Toggle checkbox "Add pub route" on the game creation form reveals the pub selection interface

**Selection Interface:**
- 9 numbered slots displayed (progressive reveal pattern)
- Single autocomplete search input that fills the next available slot
- Pubs must be added in sequence: first added = Hole 1, second = Hole 2, etc.
- Only the most recently added pub can be removed
- Game creation requires all 9 slots to be filled when the feature is enabled
- Live mini-map preview updates as pubs are added (pins only, no route until all 9 selected)

**Autocomplete Search:**
- 500ms debounce delay before searching
- Maximum 5 results displayed
- "No results found" message for empty results
- After first pub is selected, subsequent searches are biased toward a 5km radius using Nominatim's viewbox parameter (soft bias - distant results still included)
- No category filtering - users can select any establishment

### Map Display

**Access:**
- "View Map" button appears below the scoreboard (only if pubs are configured)
- Hidden entirely for games without pubs

**Map View:**
- Full-page view at `/game/[code]/map`
- MapLibre GL JS with MapTiler vector tiles (Dark Matter style)
- Domain-restricted MapTiler API key (public, restricted to pubgolf.me)
- Numbered markers (1-9) for each pub
- Tap/click marker to reveal pub name in popup
- Walking route polyline connecting pubs in order
- External navigation: popup includes "Get Directions" link opening walking directions in device's default maps app

**User Location:**
- Single GPS fetch when map opens
- Blue dot shows user position if permission granted
- If GPS permission denied, map displays normally without user position marker

---

## Technical Specification

### External Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Nominatim (OSM) | Place autocomplete search | Proxied through backend, 1 req/sec global rate limit |
| OSRM (public demo server) | Walking route calculation | Called once at game creation, route stored |
| MapTiler | Vector map tiles | Free tier (100k loads/month), Dark Matter style |

### Backend Changes

**New Endpoint: Place Search Proxy**
```
GET /api/v1/places/search?q={query}&lat={latitude}&lng={longitude}
```
- Proxies requests to Nominatim
- No authentication required
- Global rate limit: 1 request/second (enforced across all clients)
- Queue behavior: drop oldest request per client, process newest
- User-Agent: `PubGolf/1.0`
- When lat/lng provided, uses viewbox parameter for 5km soft bias
- Returns: array of `{ name: string, latitude: number, longitude: number }`

**New Endpoint: Set Pubs**
```
POST /api/v1/games/{code}/pubs
```
- Request body:
  ```json
  {
    "hostPlayerId": "uuid",
    "pubs": [
      { "name": "The Red Lion", "latitude": 51.5074, "longitude": -0.1278 },
      // ... 9 pubs total
    ]
  }
  ```
- Validates hostPlayerId matches game's hostPlayerId
- Can only be called once per game
- Triggers OSRM route calculation with retry logic
- If OSRM fails after retries: game created with pub pins but no route polyline
- Response: `201 Created` with game data including route (if available)

**New Endpoint: Get Route**
```
GET /api/v1/games/{code}/route
```
- Returns pub list and route geometry
- Response:
  ```json
  {
    "pubs": [
      { "hole": 1, "name": "The Red Lion", "latitude": 51.5074, "longitude": -0.1278 },
      // ... 9 pubs
    ],
    "route": { "type": "LineString", "coordinates": [[lng, lat], ...] } // null if OSRM failed
  }
  ```

**Domain Model Changes:**

New `Pub` domain model:
```kotlin
data class Pub(
    val id: PubId,
    val gameId: GameId,
    val hole: Hole,
    val name: String,
    val latitude: Double,
    val longitude: Double
)
```

Game model additions:
- Route geometry stored as JSON text column (nullable)
- Relationship to Pub entities

**Database Migration (Flyway):**
- New `pub` table with foreign key to `game`
- New nullable `route_geometry` column on `game` table
- Existing games have null pubs/route

**OSRM Integration:**
- Call `https://router.project-osrm.org/route/v1/foot/{coordinates}?overview=full&geometries=geojson`
- Retry logic with exponential backoff on failure
- Store full route geometry as GeoJSON LineString

### Frontend Changes

**Game Creation Form (`CreateGameForm.tsx`):**
- New "Add pub route" toggle checkbox
- When checked, reveals:
  - Autocomplete search input
  - 9 numbered slots showing selected pubs
  - Remove button on last added pub only
  - Mini-map preview showing pub pins
- Create Game button disabled until all 9 pubs selected (when toggle is on)
- On submit: creates game first, then calls POST /games/{code}/pubs

**New Map Page (`app/game/[code]/map/page.tsx`):**
- MapLibre GL JS map component
- Fetches route data from GET /games/{code}/route
- Numbered markers with click-to-reveal popups
- Route polyline (if available)
- Geolocation API for user position (single fetch)
- Back navigation to game page

**Game Page Changes:**
- Conditionally render "View Map" button below scoreboard
- Only visible when game has pubs configured

**New Components:**
- `PubSearchAutocomplete.tsx` - debounced search input with dropdown
- `PubSlotList.tsx` - numbered list of selected pubs with remove capability
- `MiniMapPreview.tsx` - small map for creation flow showing pins
- `GameMap.tsx` - full map component with route and markers

**API Client Additions (`lib/api.ts`):**
- `searchPlaces(query: string, lat?: number, lng?: number)`
- `setPubs(gameCode: string, hostPlayerId: string, pubs: Pub[])`
- `getRoute(gameCode: string)`

### Testing Strategy

**Backend:**
- Contract tests for new repository methods (Pub storage)
- Unit tests for Nominatim proxy service with rate limiting
- Unit tests for OSRM integration and retry logic
- Integration tests for new endpoints

**Frontend:**
- Component tests for PubSearchAutocomplete, PubSlotList
- Hook tests for any new custom hooks

**E2E:**
- Skip E2E tests for map functionality
- Rely on unit/integration tests and manual testing

---

## UI/UX Details

### Pub Selection Flow
1. Host enters name
2. Host checks "Add pub route" toggle
3. Interface expands showing 9 empty slots and search input
4. Mini-map appears (initially empty)
5. Host searches and selects pubs one by one
6. Mini-map updates with pins as pubs are added
7. After 9th pub, route is calculated and displayed on mini-map
8. Host clicks "Create Game"
9. Game and pubs are saved, player redirected to game page

### Error States
- Search API unavailable: "Search unavailable, please try again"
- OSRM fails after retries: Game created, map shows pins without route polyline
- GPS permission denied: Map displays without user position, no error message

### Terminology
- Keep "Pubs" terminology throughout UI (not "Venues" or "Stops")
- Pub names only visible on map page (not scoreboard or score submission)

---

## Configuration

**Environment Variables:**
- `MAPTILER_API_KEY` - Domain-restricted key for MapTiler
- Existing `NEXT_PUBLIC_API_URL` used for backend communication

**Rate Limiting:**
- Backend enforces 1 req/sec globally for Nominatim proxy
- No search result caching

---

## Out of Scope

- Editing pubs after game creation
- Reordering pubs after selection
- Pub names on scoreboard or score submission screens
- Walking distance/time display
- Current pub highlighting based on game progress
- Continuous GPS location tracking
- Alternative routing providers (fallback)
