# Pub Golf

![Pub Golf Mockups](docs/Mockups.png?raw=true "Mockups")

A real-time leaderboard application for tracking Pub Golf games. Create custom games, invite friends via QR codes, and compete on live scoreboards.

**Live Demo:** [pubgolf.me](https://pubgolf.me)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Kotlin, Spring Boot |
| Testing | Playwright (E2E), Bun Test, JUnit |
| Infrastructure | Docker, Podman |

## Features

- Real-time leaderboard updates
- Custom game creation with configurable rules
- QR code game invitations

## Architecture

This is a monorepo containing:

```
apps/
├── backend/   # Kotlin + Spring Boot REST API
└── frontend/  # Next.js application
e2e/           # Playwright end-to-end tests
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
make setup
```

This builds the backend with Gradle and installs frontend and E2E dependencies.

### Running Locally

**Backend** (runs on port 8080):
```bash
make backend
```

**Frontend** (runs on port 3000):
```bash
make frontend
```

## Testing

**Backend unit tests:**
```bash
make backend-test
```

**Frontend unit tests:**
```bash
make frontend-test
```

**E2E tests:**
```bash
make e2e
```

**E2E tests with Playwright UI:**
```bash
make e2e-ui
```

## Development

| Command | Description |
|---------|-------------|
| `make setup` | Initial project setup |
| `make backend` | Run backend server |
| `make frontend` | Run frontend dev server |
| `make backend-test` | Run backend unit tests |
| `make frontend-test` | Run frontend unit tests |
| `make e2e` | Run Playwright E2E tests |
| `make e2e-ui` | Run E2E tests with Playwright UI |

## License

MIT License - see [LICENSE](LICENSE) for details.
