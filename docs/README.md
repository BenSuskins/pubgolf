# Pub Golf

> Real-time leaderboard for Pub Golf games — create a game, share a QR code, and watch scores update live.

## Screenshots

![Pub Golf Screenshots](Screenshot.png?raw=true "Screenshots")

**Live Demo:** [pubgolf.me](https://pubgolf.me)

## Overview

Pub Golf turns a pub crawl into a competitive game: each pub is a "hole", drinks are scored
like strokes, and the lowest aggregate wins. This app lets a host create a custom game,
invite players via QR code, and follow a live leaderboard that updates through server-sent events as
scores come in.

## Features

- Real-time leaderboard updates through SSE
- Custom game creation with configurable rules
- Host panel: per-game drinks and pars, pub route, and live events
- QR code game invitations
- Randomise wheel for in-game twists (double drink, half score, etc.)
- Penalty tracking per hole

## Tech Stack

- Go 1.27.3 / net/http (backend)
- Next.js (App Router) / React / TypeScript / Tailwind CSS (frontend)
- Bun (frontend/e2e package manager + test runner)
- SQLite with sqlx and Goose migrations (storage)
- Browser EventSource for real-time updates
- Playwright (e2e), Go tests (backend), Bun Test + Happy DOM (frontend)
- Podman / Docker (local infra)

## Project Structure

```
pubgolf/
├── apps/
│   ├── backend/   # Go REST API + SSE
│   └── frontend/  # Next.js App Router application
├── e2e/           # Playwright end-to-end tests
└── docs/          # Documentation
```

## Getting Started

### Prerequisites

- [Go 1.27.3+](https://go.dev/)
- [Node.js](https://nodejs.org/) compatible with the pinned Next.js release
- [Bun](https://bun.sh/)
- [Make](https://www.gnu.org/software/make/)
- [Podman](https://podman.io/) or Docker (optional, for containers)

### Setup

```bash
git clone git@github.com:bensuskins/pubgolf.git
cd pubgolf
make setup
make backend   # in one terminal
make frontend  # in another
```

Verify: visit `http://localhost:3000` — you should see the Pub Golf home page where you can create or join a game. The backend runs on `http://localhost:8080`.

## Commands

| Command | Purpose |
|---------|---------|
| `make setup` | Download Go modules and install frontend + e2e dependencies |
| `make backend` | Run backend (port 8080) |
| `make frontend` | Run frontend dev server (port 3000) |
| `make backend-test` | Run all backend tests with the race detector |
| `make frontend-test` | Run frontend unit tests (Bun + Happy DOM) |
| `make e2e` | Run Playwright e2e tests |
| `make e2e-ui` | Run e2e tests with Playwright UI |
| `make lint` | Run gofmt checks, golangci-lint, and ESLint |
| `make backend-lint` | Check Go formatting and run golangci-lint |
| `make frontend-lint` | Run ESLint only |

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | no | `8080` | Backend port |
| `DATABASE_PATH` | no | `pubgolf-go.db` | Fresh Go SQLite file; container default is `/data/pubgolf-go.db` |
| `ALLOWED_ORIGINS` | no | Localhost and existing Pub Golf web origins | Comma-separated CORS origins |
| `OSRM_BASE_URL` | no | `https://router.project-osrm.org` | Routing provider |
| `OSRM_PROFILE` | no | `foot` | Routing profile |
| `NOMINATIM_BASE_URL` | no | `https://nominatim.openstreetmap.org` | Place search provider |
| `NEXT_PUBLIC_API_URL` | no | `https://api.pubgolf.me` | Browser API URL; `make frontend` sets localhost |
| `API_SERVER_URL` | no | Production API origin | Server-side API URL; Compose uses the backend service address |

## Testing

`make backend-lint` runs pinned golangci-lint v2.15.0. Cyclomatic complexity must be at most 10.
Functions must have at most 60 lines and 40 statements. The same limits apply to tests.

- **Backend:** Pure domain rules, fake-based application tests, shared fake/SQLite contracts,
  real HTTP/SQLite contract checks, external adapter tests, and SSE tests. Run one package with
  `cd apps/backend && go test ./internal/domain`.
- **Frontend:** Bun, Happy DOM, Testing Library, and accessibility tests. EventSource tests
  cover snapshots, reconnects, cleanup, and switching games.
- **E2E:** Playwright starts the Go backend and Next.js. It runs desktop and mobile Chromium.
  Install Chromium with `cd e2e && bunx playwright install chromium` before the first run.
- **Contract explorer:** Visit `http://localhost:8080/swagger-ui/index.html`.

## Deployment

Build containers with `podman compose build` or `docker compose -f podman-compose.yml build`.
The backend image retains the name `ghcr.io/bensuskins/pubgolf-backend`.
Read [BACKEND-CUTOVER.md](BACKEND-CUTOVER.md) before switching from Kotlin. This release needs a
fresh database and a coordinated frontend/backend cutover. It does not migrate old games.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design, components, and request flow.
See [GLOSSARY.md](GLOSSARY.md) for the agreed Game domain terms.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[GPL-2.0](../LICENSE)
