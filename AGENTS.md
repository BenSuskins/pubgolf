# Pub Golf

Pub Golf has a Go backend, a Next.js frontend, and Playwright browser tests.

## Commands

Use Make as the entry point. Run `make setup` to install dependencies.
Run `make backend` and `make frontend` in separate terminals.
Run `make backend-test`, `make frontend-test`, `make lint`, and `make e2e` before opening a PR.
Run `make backend-build` for the backend executable and `cd apps/frontend && bun run build` for the frontend production build.

## Backend design

The Go module lives in `apps/backend`. Use Go 1.25 and Bun for frontend tools.

- `internal/domain` owns pure game rules, values, and typed failures.
- `internal/application` owns use cases and the ports they consume.
- `internal/adapters` owns HTTP/SSE, SQLite, upstream HTTP, metrics, and fakes.
- `cmd/pubgolf` wires adapters and starts the process.

Dependencies point inward. Keep HTTP, SQL, JSON encoding, and vendor clients in adapters.
Pass time, identifiers, and random outcomes into the core.
Keep permission checks inside use cases and save a whole game atomically.
Publish snapshots and record success metrics after commit.
Keep external routing calls outside database transactions.

Test pure rules and application use cases through their interfaces.
Run shared repository contracts against the fake and SQLite adapters.
The HTTP suite replays captured Kotlin responses and validates OpenAPI against real SQLite.
Keep real integration and browser tests alongside fake-based tests.

## Public contracts

The REST API remains under `/api/v1`.
Player mutations use `PubGolf-Player-Id`. Existing rejoin behavior claims a player by name.
SSE streams public game snapshots at `/api/v1/games/{gameCode}/stream`.
The checked-in contract is `apps/backend/internal/adapters/httpapi/openapi.json`.
Swagger UI runs at `/swagger-ui/index.html`.

## References

Read `docs/ARCHITECTURE.md` for interfaces and data flow.
Read `docs/BACKEND-CUTOVER.md` before deploying or rolling back this rewrite.
Follow the local `repo-templates` checkout when changing documentation.
