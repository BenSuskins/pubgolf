# Host Panel: Custom Drinks & Pars

## Context
The host panel (`/game/[code]/host`) already drives the pub route and built-in/custom events
from the server. Drinks and pars are the last piece still hard-coded: `Routes` in
`models/Domain.kt` holds a fixed nine-hole course ("Route A"/"Route B") that every game shares,
served from `GET /api/v1/config/routes` and used for par-relative ranking. A host cannot change
what players drink or what each hole is worth.

This makes the course per-game and host-editable, and moves route-map setup out of the create
form so the host panel is the single place a game is configured.

Decisions (confirmed):
- **Keep named routes.** A course has one or more named routes (e.g. "Route A"/"Route B"), each
  with a drink per hole, plus a par shared by all routes on that hole. Same `drinks: Map<name, drink>`
  shape the API and `RoutesTable` already use.
- **Editable any time during an active game.** Saving broadcasts the new game state over STOMP
  like events do, so a par change re-ranks the leaderboard live. Editing a completed game is rejected.
- **Remove the "Add route map" toggle from the create form.** Hosts land on the leaderboard and
  configure everything from the host panel.
- Functional pass only; host panel layout/design is a separate session.

## Data model
New table, mirroring `pubs` (keyed by game + hole, cascade-deleted with the game):

```sql
CREATE TABLE game_holes (
    game_id BLOB NOT NULL,
    hole    INT  NOT NULL,
    par     INT  NOT NULL,
    drinks  TEXT NOT NULL,           -- ordered JSON object: {"Route A":"Tequila","Route B":"Sambuca"}
    PRIMARY KEY (game_id, hole),
    CONSTRAINT fk_game_hole_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

`drinks` is stored as JSON rather than a second table: it is always read and written whole with
the game, key order carries column order for the table view, and `games.route_geometry` sets the
precedent for JSON-in-column here.

Domain: `Game` gains `holes: List<CourseHole>`, where
`CourseHole(hole: Hole, par: Int, drinks: Map<String, String>)`. The course lives inside the
`Game` aggregate (like `pubs`), so it rides the existing optimistic-lock and broadcast path and
needs no new repository. `holes` is empty for games created before this change; `Game.course()`
falls back to `Routes.defaultCourse`, so old games keep today's behaviour and every response is
populated.

## API
- `PUT /api/v1/games/{gameCode}/holes` — host only, replaces the whole course, returns the updated
  `GameStateResponse`. Body reuses the hole shape from the response, so the client can round-trip
  what it read:
  ```json
  { "holes": [ { "hole": 1, "par": 1, "drinks": { "Route A": "Tequila", "Route B": "Sambuca" } } ] }
  ```
- `GameStateResponse` gains `holes: [{ hole, par, drinks }]`. Pars and drinks then arrive with game
  state over REST *and* the WebSocket, so no client needs a separate fetch and edits land live.
- `parRelative` in `GameStateResponse` uses the game's own pars instead of `Routes.par(hole)`.
- `GET /api/v1/config/routes` is unchanged — it stays the default course/template, used by
  `/how-to-play` when the visitor is not in a game.

Validation (`InvalidCourseFailure` → 400):
- exactly `GameConstants.MAX_HOLES` holes, each of 1..9 exactly once
- par 1..10
- 1..4 routes; names trimmed, non-blank, ≤ 40 chars, unique case-insensitively
- every hole carries the same route names; order is taken from the first hole and applied to all
- drink names non-blank, ≤ 100 chars

Reuses existing failures: non-host → `NotHostPlayerFailure` (403), completed game →
`GameAlreadyCompletedFailure` (409), unknown game → 404.

## Frontend
- `lib/types.ts`: `GameState.holes: RouteHole[]`; `lib/api.ts`: `setHoles(gameCode, playerId, holes)`.
- `components/CourseEditor.tsx` (new): nine rows of par + one drink field per route, add/rename/remove
  a route, save/reset. Seeded from `gameState.holes`. Plain, functional styling for now.
- Host panel: new "Drinks & Pars" section wrapping `CourseEditor`; keeps the existing route-map link.
- `app/game/page.tsx` and `app/submit-score/page.tsx`: take pars from game state (`holes`) and drop
  their `getRoutes()` calls and the `DEFAULT_PARS` copy of the backend config.
- `app/how-to-play/page.tsx`: show the current game's course when a game code is stored, falling back
  to `getRoutes()` otherwise — this is where players read the drinks list.
- `components/CreateGameForm.tsx`: delete the toggle and always navigate to `/game`.

## Tests
- Backend `GameServiceTest`: happy path, non-host, completed game, and each validation rule;
  par-relative ranking against custom pars.
- `GameRepositoryContract`: course round-trips (both JPA and Fake).
- OpenAPI approval file regenerated for the new endpoint and response field.
- Frontend: `CourseEditor.test.tsx`; update `how-to-play` page test for the game-course path.
- E2E: replace the create-form toggle test in `create-game.spec.ts` with the host-panel entry point;
  new spec for editing the course and seeing it on the rules page.

## Out of scope
- Host panel layout/visual design (next session).
- Showing the hole's drink on the log-score screen — worth doing, but it is a design call.
- Per-player route assignment (which of Route A/B a player is drinking) — still player-managed.
- Variable hole counts; `MAX_HOLES` stays 9.
