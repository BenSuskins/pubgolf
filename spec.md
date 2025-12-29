# Penalties Attribution

## Overview

Extract penalties from static rules page display into a functional feature where players can submit penalties. Penalties are shown on the scoreboard similarly to how randomise is displayed.

## Penalty Types

Two penalty types (removing "Spill your drink"):

| Type | Name | Points | Emoji |
|------|------|--------|-------|
| SKIP | Skip a drink | +5 | :no_entry_sign: |
| CHUNDER | Tactical chunder | +10 | :face_vomiting: |

Both penalties are "penalty-only" - they auto-set the score for that hole with no sips input required.

## Core Behavior

### Penalty Scope
- Penalties are tied to a specific hole (like randomise)
- Maximum one penalty per hole per player
- Players self-report their own penalties (no host assignment)

### Penalty vs Sips
- Selecting a penalty disables sips input and auto-sets the score (Skip=5, Chunder=10)
- Applying a penalty to a hole clears any existing sips score for that hole
- Penalties can be applied to holes that already have a score (allow adding later)
- A hole can have both a randomise result AND a penalty

### Editing/Removal
- Players can edit or remove penalties after submission
- Submitting a score without a penalty clears any existing penalty (implicit removal)
- Players can switch from penalty to regular sips (full flexibility)

## API Design

### New Endpoint: GET /penalty-options

Returns available penalty types. Frontend maps emoji locally.

```json
{
  "penalties": [
    { "type": "SKIP", "name": "Skip a drink", "points": 5 },
    { "type": "CHUNDER", "name": "Tactical chunder", "points": 10 }
  ]
}
```

### Extended Endpoint: POST /{gameCode}/players/{playerId}/scores

Add optional `penaltyType` field to existing request:

```json
{
  "hole": 3,
  "score": null,
  "penaltyType": "SKIP"
}
```

When `penaltyType` is provided:
- `score` field is ignored (penalty determines the score)
- Any existing sips for that hole are cleared
- Backend validates penalty type is valid

When `penaltyType` is null/omitted:
- Normal sips submission behavior
- Clears any existing penalty for that hole

### Game State Response

Add penalties to Player object in game state response:

```json
{
  "players": [
    {
      "id": "...",
      "name": "...",
      "scores": [3, null, 5, ...],
      "totalScore": 15,
      "randomise": { "hole": 2, "result": "Guinness" },
      "penalties": [
        { "hole": 3, "type": "SKIP", "points": 5 }
      ]
    }
  ]
}
```

## Backend Implementation

### Domain Model

New enum:
```kotlin
enum class PenaltyType(val points: Int) {
    SKIP(5),
    CHUNDER(10)
}
```

### Entity Design

Separate Penalty entity with composite primary key (playerId, hole):

```kotlin
@Entity
@IdClass(PenaltyId::class)
class PenaltyEntity(
    @Id val playerId: String,
    @Id val hole: Int,
    @Enumerated(EnumType.STRING)
    val penaltyType: PenaltyType
)

data class PenaltyId(
    val playerId: String = "",
    val hole: Int = 0
) : Serializable
```

### Score Calculation

Total score = sum(sips) + sum(penalty points)
- Sips and penalties stored separately
- Computed at query time

### Validation

- Backend validates submitted penalty type is one of the allowed enum values
- Sips validation remains unchanged (-10 to 10)
- Penalty points can make total exceed 10 (no total validation)

## Frontend Implementation

### Submit Score Page

Add penalty selection below sips input:

1. Sips input field (existing)
2. Penalty chip/toggle buttons below
3. When penalty selected:
   - Sips input becomes disabled
   - Shows score preview: "Score: 5" or "Score: 10"
4. No confirmation dialog needed

### Scoreboard Display

- Score cell shows the number (sips or penalty value)
- Penalty indicator shown below score (emoji only: :no_entry_sign: or :face_vomiting:)
- Similar to how randomise result is displayed
- No special cell styling for penalty scores
- Hover/tap on emoji for details (optional)

### Rules Page (How to Play)

- Update to fetch penalties from `/penalty-options` API
- Remove hardcoded PENALTIES constant usage
- Display only Skip and Chunder

### Type Definitions

Add to `types.ts`:
```typescript
export interface Penalty {
  hole: number;
  type: 'SKIP' | 'CHUNDER';
  points: number;
}

export const PENALTY_EMOJI_MAP: Record<string, string> = {
  SKIP: ':no_entry_sign:',
  CHUNDER: ':face_vomiting:',
};
```

Update Player interface:
```typescript
export interface Player {
  id: string;
  name: string;
  scores: (number | null)[];
  totalScore: number;
  randomise: Randomise | null;
  penalties: Penalty[];
}
```

## Testing

### Backend Tests
- Contract tests for penalty repository
- Unit tests for penalty validation
- Integration/scenario tests for penalty submission flows

### Frontend Tests
- Component tests for penalty selection UI
- ScoreboardTable tests for penalty display

### E2E Tests
- New Playwright tests covering:
  - Submitting a penalty
  - Penalty display on scoreboard
  - Editing/removing a penalty
  - Switching between penalty and sips

## Summary of Decisions

| Decision | Choice |
|----------|--------|
| Penalty scope | Tied to specific hole |
| Max penalties per hole | One |
| Penalty vs sips | Penalty replaces sips entirely |
| Who assigns | Self-report only |
| Penalty types | Skip (+5), Chunder (+10) - removed Spill |
| Sips input when penalty selected | Disabled with preview |
| Edit/removal | Allowed, implicit via submission |
| Data source | Backend API (not hardcoded) |
| Backend validation | Validate penalty type |
| Storage | Separate entity, computed total |
| Response format | penalties array on Player |
| Scoreboard indicator | Emoji only below score |
| API path | /penalty-options |
| E2E tests | Yes |
