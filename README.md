# 🍻⛳️ Pub Golf

![Pub Golf Mockups](docs/Mockups.png?raw=true "Mockups")

A Pub Golf Leaderboard App, to track scores.

---

Check it out here:

👉 [Here](https://pubgolf.me)

---

## ✨ Features

- 📊 Pub Golf Leaderboard.
- 🕹️ Create custom games with your friends.
- 📷 Share game invites with QR Codes.
- ⚙️ Game Rules.

This Monorepo contains:
- 🧠 **Backend**: Kotlin + Spring Boot (`apps/backend`)
- 💅 **Frontend**: Next.js (`apps/frontend`)
- 🛠️ Task automation: [`make`](https://www.gnu.org/software/make/) for local dev tasks

---

### 📦 Prerequisites

Make sure you have the following installed:

- [JDK 21+](https://adoptium.net/)
- [Node.js (v18+)](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Make](https://www.gnu.org/software/make/)
- [Podman](https://podman.io) (For local database)

---

### 🛠 Setup

From the root of the repo, run:

```bash
make setup
```

This command will:

- Build the backend using Gradle (`./gradlew clean build`)
- Install frontend dependencies (`npm install` in `apps/frontend`)

---

### 🧪 Running the App

#### 🔁 Backend (Spring Boot)

```bash
make backend
```

Runs the backend at [http://localhost:8080](http://localhost:8080)

#### 💻 Frontend (Next.js)

```bash
make frontend
```

Runs the frontend at [http://localhost:3000](http://localhost:3000)

---

# 🧭 Pub Golf – Roadmap & Future Plans

Planned enhancements and production improvements.

---

## 🚀 New Features

- [ ] Final scorecard export (JSON or styled PDF)
- [ ] Game state tracking: In Progress / Finished
- [x] QR code for joining games
- [ ] Bonus/penalty rule system

---

## 📈 Observability & Productionisation

- [x] Prometheus metrics
- [ ] Structured JSON logs
- [ ] Grafana dashboards
- [ ] Rate limiting
- [ ] Slow request logging / tracing
- [ ] Alerting

---

## 🛠 Infrastructure & Code Architecture

- [ ] Admin endpoints for game reset and cleanup
- [ ] Multi-stage Docker builds with non-root users
- [ ] Deployment manifests for Docker Compose / K8s
- [ ] Feature toggles for WIP functionality
- [ ] Linting
- [x] Tiny Types
- [x] Pass environment variables via Docker to frontend

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
