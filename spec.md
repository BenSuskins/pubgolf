# Host Driven Events

## Overview

Hosts can trigger special events during gameplay through a dedicated host panel. These events are purely informational
announcements that appear to all players, creating moments of shared experience during the game.

## Event Data Model

Events are served from a hardcoded backend list with 5-10 global events available to all games.

Each event contains:

- **Title**: Short event name
- **Description**: Explanation of what the event means

### Suggested Events

1. **"Photo Op!"** - Everyone must take a group photo at the current venue
2. **"Speed Round"** - Finish your current drink within 2 minutes
3. **"Halftime"** - Take a 5-minute break
4. **"Last Orders"** - Final warning before moving to next venue
5. **"Club Swap"** - You must drink with your non dominant hand, getting caught is a +1 penalty
6. **"Stranger Danger"** - Convince a stranger to buy you a drink, -2 points

## Persistence

- Active event state is **persisted in the database** with the game record
- Survives server restarts
- Only one event can be active per game at a time

## Host Panel

### Access Control

- Accessible via dedicated page route: `/game/{code}/host`
- **Host-only access** - validated via player id in storage vs game state
- Only the original game creator can access the host panel

### UI Behavior

- Cards are provided by API endpoint
- Displays available event cards (title + description)
- Host selects a card, then confirms activation
- Active event card is highlighted/distinguished in the panel
- Host can end the active event at any time
- No event history shown - once ended, events disappear from panel
- They should show in a responsive card grid

### Game End Behavior

- When the game ends (all holes completed), active events automatically end
- Host panel becomes inaccessible for finished games

## Player Experience

### Event Activation

When an event is activated:

1. **WebSocket notification** sent to all connected clients via existing game state updates (active event embedded in
   game state payload)
2. **Notification appears** on the scoreboard page:
    - Middle of screen overlay with semi-transparent backdrop
    - Auto dismiss after 3 seconds
    - Shows event title and description
    - Dismissible by clicking/tapping anywhere
    - Only shown once per activation (not shown to late joiners)
3. **Banner appears** above the score table:
    - Shows active event title/description
    - Scrolls with page content (not sticky)
    - Visible until event ends

### Notification Queueing

- If player is not on scoreboard when event triggers, Notification is queued
- Notification displays when player next navigates to scoreboard
- Late joiners (connected after activation) do not see the Notification, only the banner

### Event End

When host ends an event:

1. Banner is removed from scoreboard
2. Toast/snackbar notification briefly appears: "Event ended"
3. Game state updated via WebSocket

## API Design

### Endpoints

All endpoints under `/api/v1/games/{gameCode}`:

| Method | Path                         | Auth      | Description                       |
|--------|------------------------------|-----------|-----------------------------------|
| GET    | `/events`                    | None      | List available events             |
| GET    | `/events/active`             | None      | Get current active event (if any) |
| POST   | `/events/{eventId}/activate` | Host only | Activate an event                 |
| POST   | `/events/end`                | Host only | End the active event              |

### Response: Available Events

```json
{
  "events": [
    {
      "id": "photo-op",
      "title": "Photo Op!",
      "description": "Everyone must take a group photo at the current venue"
    }
  ]
}
```

### Response: Active Event

```json
{
  "activeEvent": {
    "id": "photo-op",
    "title": "Photo Op!",
    "description": "Everyone must take a group photo at the current venue",
    "activatedAt": "2024-01-15T20:30:00Z"
  }
}
```

Returns `null` for `activeEvent` if no event is active.

### WebSocket Game State

Active event is embedded in the existing game state payload:

```json
{
  "gameCode": "ABC123",
  "players": [
    ...
  ],
  "activeEvent": {
    "id": "photo-op",
    "title": "Photo Op!",
    "description": "Everyone must take a group photo at the current venue",
    "activatedAt": "2024-01-15T20:30:00Z"
  }
}
```

## Frontend State Management

### Notification Display Logic

Track per-session state:

- `lastSeenEventId`: The most recent event ID for which Notification was shown
- When `activeEvent.id` changes and differs from `lastSeenEventId`:
    - If on scoreboard: show Notification immediately
    - If not on scoreboard: queue Notification for next scoreboard visit
- After Notification dismissed: update `lastSeenEventId`

### Host Disconnect

- If host closes browser or loses connection, active event remains active indefinitely
- Host can reconnect and end the event later
- Event persists in database until explicitly ended or game ends
- Host connectivity is irrelevant, we don't track the host connection anywhere

## Error Handling

- Attempting to activate event when one is already active: Return error, require ending current event first
- Attempting to end event when none is active: No-op, return success
- Non-host attempting to activate/end: Return 403 Forbidden
- Accessing host panel for finished game: Return 403 or redirect to game page
