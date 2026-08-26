# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Setup
```bash
make setup
```
Builds backend with Gradle, installs frontend and E2E dependencies.

### Running Locally
```bash
make backend    # Backend on port 8080
make frontend   # Frontend on port 3000
```

### Testing
```bash
make backend-test   # JUnit tests for Kotlin backend
make frontend-test  # Bun tests for React frontend
make e2e            # Playwright E2E tests
make e2e-ui         # Playwright UI mode
```

Backend tests exclude integration tests by default. Run integration tests with:
```bash
./gradlew integrationTest
```

Integration tests are tagged with `@Tag("integration")` in JUnit.

### Running Single Tests
```bash
# Backend: run a specific test class
./gradlew test --tests "uk.co.suskins.pubgolf.service.GameServiceTest"

# Frontend: run tests in watch mode
cd apps/frontend && bun test --watch

# E2E: run in debug mode
cd e2e && bun run test:debug
```

### Linting
```bash
make lint            # Run all linters
make backend-lint    # ktlint on Kotlin code
make frontend-lint   # ESLint on TypeScript/React
```

### Building
```bash
./gradlew build                    # Backend: compile + test
cd apps/frontend && bun run build  # Frontend: production build
```

## Architecture

### Backend (Kotlin + Spring Boot)

**Key Patterns:**
- **Result4k for error handling**: Functions return `Result<T, PubGolfFailure>` instead of throwing exceptions
- **Contract tests with Fakes**: Repository interfaces have `Contract` test interfaces that both real and fake implementations must pass
- **Test fixtures**: Fakes live in `testFixtures` source set (e.g., `GameRepositoryFake`, `GameStateBroadcasterFake`)
- **Domain-driven models**: Separate Domain, DTO, and Entity layers in `models/` package

**File Structure:**
```
apps/backend/src/
├── main/kotlin/uk/co/suskins/pubgolf/
│   ├── config/           # WebSocket, CORS, OpenAPI, validation
│   ├── controller/       # REST endpoints
│   ├── models/
│   │   ├── Domain.kt     # Core domain models (Game, Player, etc.)
│   │   ├── DTO.kt        # API request/response objects
│   │   ├── Entity.kt     # JPA entities
│   │   └── Types.kt      # Type aliases and value classes
│   ├── repository/       # Data access interfaces + JPA adapters
│   └── service/          # Business logic
├── test/kotlin/
│   ├── scenarios/        # High-level scenario tests
│   └── approvals/        # Approval tests for OpenAPI spec
└── testFixtures/kotlin/  # Fakes for testing
```

**Testing Approach:**
- Contract tests ensure fakes match real implementations (see `GameRepositoryContract`)
- Scenario tests simulate full game flows (see `scenarios/` package)
- Use fakes in unit tests, real implementations in integration tests

**Database:**
- SQLite for local development (database file: `apps/backend/pubgolf.db`)
- JPA with Hibernate Community Dialects for SQLite support
- Flyway for migrations

### Frontend (Next.js + React)

**Key Patterns:**
- **Next.js App Router**: Pages in `app/` directory with file-based routing
- **WebSocket for real-time updates**: `useGameWebSocket` hook connects to STOMP/WebSocket for live game state
- **Bun test runner**: Uses Happy DOM for fast testing without a real browser

**File Structure:**
```
apps/frontend/
├── app/                    # Next.js app router pages
│   ├── game/[code]/        # Game scoreboard page
│   ├── randomise/          # Randomise wheel page
│   ├── submit-score/       # Score submission page
│   └── page.tsx            # Home page (create/join game)
├── components/             # React components
├── hooks/                  # Custom hooks (useGameWebSocket, useLocalStorage, etc.)
├── lib/
│   ├── api.ts              # Backend API client
│   └── types.ts            # TypeScript types
└── test/
    ├── mocks/              # Test mocks (next/navigation)
    └── setup.ts            # Test setup (cleanup, localStorage mocks)
```

**API Communication:**
- REST API calls via `lib/api.ts`
- Real-time updates via STOMP WebSocket (`@stomp/stompjs`)
- Base URL: `process.env.NEXT_PUBLIC_API_URL` (defaults to `https://api.pubgolf.me`)

**Testing:**
- Component tests use `@testing-library/react`
- Accessibility tests with `jest-axe`
- Test setup in `test/setup.ts` handles cleanup and mocks

### E2E Tests (Playwright)

Located in `e2e/` directory. Run with `make e2e` or `make e2e-ui` for interactive mode.

## Development Notes

- **Bun** is used for frontend and E2E (not npm/yarn)
- **Java 21** required for backend
- **Podman** used for local database (in production setup)
- **Make** commands are the preferred way to run tasks
