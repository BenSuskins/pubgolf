# Pub Golf

Pub Golf has a Go backend, a Next.js frontend, and Playwright browser tests.

## Commands

Use Make as the entry point. Run `make setup` to install dependencies.
Run `make backend` and `make frontend` in separate terminals.
Run `make backend-test`, `make frontend-test`, `make lint`, and `make e2e` before opening a PR.
Run `make backend-build` for the backend executable and `cd apps/frontend && bun run build` for the frontend production build.

## Backend design

The Go module lives in `apps/backend`. Use Go 1.27.3 and Bun for frontend tools.

- `internal/domain` owns the protected Round aggregate, validated values, typed facts, and failures.
- `internal/application` owns RoundCommands, RoundQueries, RoundSubscriptions, PlaceSearch, and their ports.
- `internal/adapters` owns HTTP/SSE, SQLite, upstream HTTP, metrics, and fakes.
- `cmd/pubgolf` handles process signals. `internal/bootstrap` wires adapters and owns the server lifecycle.

Dependencies point inward. Keep HTTP, SQL, JSON encoding, and vendor clients in adapters.
Pass time, identifiers, and random outcomes into the core.
Apply rules through immutable Round methods. Keep aggregate state private.
Use validated reconstruction and defensive snapshots. Treat zero as a played score.
Keep permission checks inside use cases against the loaded round. Save a whole round atomically.
Share one private commit coordinator between commands and subscriptions.
Generate command timestamps, identifiers, and random outcomes once before retries.
Publish domain facts and browser snapshots independently after commit. Record success metrics from committed facts.
Keep external routing calls outside database transactions.

Test pure rules and application use cases through their interfaces.
Run shared repository contracts against the fake and SQLite adapters.
The HTTP suite replays captured Kotlin responses and validates OpenAPI against real SQLite.
Keep real integration and browser tests alongside fake-based tests.

Prefer maintained libraries over custom infrastructure. Keep vendor types in adapters.
`make backend-lint` enforces cyclomatic complexity at most 10 and functions at most 60 lines or 40 statements.
Apply these limits to tests too. Refactor instead of adding exclusions.

## Public contracts

The REST API remains under `/api/v1`.
Player mutations use `PubGolf-Player-Id`. Existing rejoin behavior claims a player by name.
SSE streams public game snapshots at `/api/v1/games/{gameCode}/stream`.
The checked-in contract is `apps/backend/internal/adapters/httpapi/openapi.json`.
Swagger UI runs at `/swagger-ui/index.html`.

## References

Read `docs/ARCHITECTURE.md` for interfaces and data flow.
Use `docs/GLOSSARY.md` for domain names. Keep existing wire and stored JSON fields in adapters.
Read `docs/BACKEND-CUTOVER.md` before deploying or rolling back this rewrite.
Follow the local `repo-templates` checkout when changing documentation.
