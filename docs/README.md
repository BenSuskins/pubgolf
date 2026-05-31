# Pub Golf

> Real-time leaderboard for Pub Golf games — create a game, share a QR code, and watch scores update live.

## Screenshots

![Pub Golf Screenshots](Screenshot.png?raw=true "Screenshots")

**Live Demo:** [pubgolf.me](https://pubgolf.me)

## Overview

Pub Golf turns a pub crawl into a competitive game: each pub is a "hole", drinks are scored
like strokes, and the lowest aggregate wins. This app lets a host create a custom game,
invite players via QR code, and follow a live leaderboard that updates over WebSockets as
scores come in.

## Features

- Real-time leaderboard updates over WebSocket (STOMP)
- Custom game creation with configurable rules
- QR code game invitations
- Randomise wheel for in-game twists (double drink, half score, etc.)
- Penalty tracking per hole

## Tech Stack

- Kotlin 2 / Spring Boot 3 (backend, JDK 21)
- Next.js (App Router) / React / TypeScript / Tailwind CSS (frontend)
- Bun (frontend/e2e package manager + test runner)
- SQLite + JPA/Hibernate + Flyway (storage)
- STOMP over WebSocket (`@stomp/stompjs`) for real-time updates
- Playwright (e2e), JUnit + Result4k (backend), Bun Test + Happy DOM (frontend)
- Podman / Docker (local infra)

## Project Structure

```
pubgolf/
├── apps/
│   ├── backend/   # Kotlin + Spring Boot REST API + WebSocket
│   └── frontend/  # Next.js App Router application
├── e2e/           # Playwright end-to-end tests
└── docs/          # Documentation
```

## Getting Started

### Prerequisites

- [JDK 21+](https://adoptium.net/)
- [Node.js 18+](https://nodejs.org/)
- [Bun](https://bun.sh/)
- [Make](https://www.gnu.org/software/make/)
- [Podman](https://podman.io/) (for local database)

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
| `make setup` | Build backend (Gradle) and install frontend + e2e deps |
| `make backend` | Run backend (port 8080, `local` profile) |
| `make frontend` | Run frontend dev server (port 3000) |
| `make backend-test` | Run backend unit tests (JUnit) |
| `make frontend-test` | Run frontend unit tests (Bun + Happy DOM) |
| `make e2e` | Run Playwright e2e tests |
| `make e2e-ui` | Run e2e tests with Playwright UI |
| `make lint` | Run ktlint + ESLint |
| `make backend-lint` | Run ktlint only |
| `make frontend-lint` | Run ESLint only |

Backend integration tests are excluded from `make backend-test`. Run them with `./gradlew integrationTest` (tagged `@Tag("integration")`).

## Testing

- **Backend:** Contract tests pair every repository interface with a `Fake` and a real
  implementation; both must satisfy the same contract (see `GameRepositoryContract`).
  Fakes live in the `testFixtures` source set and are reused by unit and scenario tests.
  Functions return `Result<T, PubGolfFailure>` (Result4k) instead of throwing.
- **Frontend:** Component tests with `@testing-library/react`, accessibility checks via
  `jest-axe`. Setup in `apps/frontend/test/setup.ts`.
- **E2E:** Playwright drives the full stack from `e2e/`.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for system design, components, and request flow.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

[MIT](../LICENSE)
