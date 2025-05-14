# 🍻⛳️ Pub Golf

![Pub Golf Home Page](docs/home.png?raw=true "Home Page")

Pub Golf Leaderboard Application.

## 🚀 Getting Started

This is a monorepo for Pub Golf, containing:

- 🧠 **Backend**: Kotlin + Spring Boot (`apps/backend`)
- 💅 **Frontend**: Next.js (`apps/frontend`)
- 🛠️ Task automation: [`make`](https://www.gnu.org/software/make/) for local dev tasks

---

### 📦 Prerequisites

Make sure you have the following installed:

- [JDK 17+](https://adoptium.net/)
- [Node.js (v18+)](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Make](https://www.gnu.org/software/make/) (comes preinstalled on macOS and most Linux distros)

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

## 📁 Project Structure

```
pubgolf/
├── apps/
│   ├── backend/         # Spring Boot backend
│   └── frontend/        # Next.js frontend
├── Makefile             # Task automation
├── README.md            # Project documentation
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
