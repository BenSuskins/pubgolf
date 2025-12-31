# Backend-Driven Routes Specification

## Overview

Make the drink routes on the how-to-play page backend-driven via a new API endpoint, similar to how `penalty-options` and `randomise-options` work. The API returns 1-2 routes with associated drink names per hole and shared par values.

## API Design

### Endpoint

```
GET /api/v1/games/routes
```

- **Authentication**: Public (matches existing options endpoints)
- **Method**: GET

### Response Structure

```json
{
  "holes": [
    {
      "hole": 1,
      "par": 1,
      "drinks": {
        "Route A": "Tequila",
        "Route B": "Sambuca"
      }
    },
    {
      "hole": 2,
      "par": 3,
      "drinks": {
        "Route A": "Beer",
        "Route B": "Double Vodka & Single Vodka w/ Mixer"
      }
    }
  ]
}
```

- **Hole count**: Always 9 (fixed, not communicated in response)
- **Par**: Shared across routes per hole
- **Drinks map**: Keys are route names (backend-driven, e.g., "Route A", "Route B", or potentially "Classic", "Hardcore")
- **Single route**: If only 1 route exists, `drinks` map has 1 entry (frontend adapts layout accordingly)

### Backend Implementation

- **Data source**: Hardcoded in Kotlin (similar to `Outcomes` and `PenaltyType` enums)
- **Structure**: Use data classes or objects (whichever fits existing patterns best)
- **Location**: Add to `controller/GameController.kt` following existing endpoint patterns
- **Response classes**: Add `RoutesResponse`, `HoleResponse` (or similar) to models

### Example Kotlin Structure

```kotlin
data class HoleConfig(
    val hole: Int,
    val par: Int,
    val drinks: Map<String, String>
)

val HOLE_CONFIGS = listOf(
    HoleConfig(1, 1, mapOf("Route A" to "Tequila", "Route B" to "Sambuca")),
    HoleConfig(2, 3, mapOf("Route A" to "Beer", "Route B" to "Double Vodka & Single Vodka w/ Mixer")),
    // ... remaining 7 holes
)
```

## Frontend Implementation

### Fetch Strategy

- **When**: Once at app load, cached
- **Pattern**: Server component with async fetch (same as penalties in `how-to-play/page.tsx`)
- **Retry logic**: 3 retries with loading state shown during retries
- **Error handling**: Show error state if all retries fail (no hardcoded fallback)

### API Client

Add to `lib/api.ts`:

```typescript
interface HoleRoute {
  hole: number;
  par: number;
  drinks: Record<string, string>;
}

interface RoutesResponse {
  holes: HoleRoute[];
}

export async function getRoutes(): Promise<RoutesResponse> {
  // Implementation with retry logic
}
```

### UI Changes

#### How-to-Play Page (`app/how-to-play/page.tsx`)

- Remove import of `DRINKS` constant
- Fetch routes via `getRoutes()` with retry logic
- Pass route data to table component
- **Adaptive layout**:
  - If 2 routes: Show table with route name columns (from API, e.g., "Route A", "Route B")
  - If 1 route: Show simplified single-column list without route labels
- **Route names**: Use names from API response as column headers (not hardcoded "Route A"/"Route B")
- **Scope**: Route names only displayed on how-to-play page, not elsewhere in app

#### Table Polish

- Minimal visual changes - just wire up dynamic data
- Keep current table structure

### Cleanup

- **Remove**: `DRINKS` constant and `DrinkInfo` interface from `lib/constants.ts`
- **Keep**: `RULES` and `PENALTIES` constants (rules text stays static)

## Testing

### Backend

- **Controller test**: Simple test that `/api/v1/games/routes` returns expected structure and data
- No contract test needed (no abstraction layer)

### Frontend

- **Unit test**: Add colocated test file for how-to-play page component
  - Test rendering with 2 routes
  - Test adaptive layout with 1 route
  - Test loading state during retries
  - Test error state
- **E2E test**: Playwright test covering the how-to-play page integration

## Non-Goals

- No localisation/i18n (English only)
- No score validation against route drinks (purely display data)
- No route tracking per player (guidance only, not enforced)
- No changes to game scoring or rules logic
