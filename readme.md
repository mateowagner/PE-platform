# 🏆 Liga Pulpito Esports (LPE) Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)

**Liga Pulpito Esports (LPE)** is a full-stack competitive tournament platform designed specifically for amateur *League of Legends* teams and grassroots organizations. It bridges the gap between casual matchmaking and professional esports by delivering automated tournament workflows, verified player rosters, live brackets, and dynamic round-robin league standings.

---

## 📌 1. Target Audience & Core Value Proposition

Organizing amateur esports tournaments traditionally relies on fragmented tools such as manual spreadsheets, unverified Discord threads, and third-party platforms with high barriers to entry. Liga Pulpito Esports provides:

* **Fair Competitive Integrity (Anti-Smurf):** Validates accounts against Riot Games APIs (Solo/Duo & Flex ranks, PUUID ownership) to prevent roster fraud and enforce SkillTier thresholds.
* **Automated Tournament Engine:** Supports both single-elimination weekend cups (`CUP`) and seasonal multi-round leagues (`LEAGUE`) with automatic tie-breakers and standings.
* **OP.GG-Style Match Telemetry:** Ingests match statistics via Riot Games API webhooks to display post-match stats, KDA, gold, damage graphs, items, and trinkets.
* **Esports Experience:** Custom dark glassmorphism UI with vibrant neon accents (`#9333ea`, `#dc2626`, `#06b6d4`) tailored for competitive gamers.

---

## 🖼️ 2. Interface Showcase

| Bracket View & Knockout Cups (`CUP`) | League Standings & Matchdays (`LEAGUE`) |
| :---: | :---: |
| ![Cup Bracket Preview](docs/screenshots/bracket-preview.png) | ![League Workspace Preview](docs/screenshots/league-preview.png) |
| *SVG-powered live bracket trees with champion trophy celebration.* | *Dynamic round-robin standings with playoff & relegation indicators.* |

| OP.GG Match Scoreboard | Roster Selection & Verification |
| :---: | :---: |
| ![Match Scoreboard Preview](docs/screenshots/match-scoreboard.png) | ![Roster Selector Preview](docs/screenshots/roster-selector.png) |
| *Detailed breakdown of damage, gold, items, and summoners per match.* | *Real-time eligibility validation (Riot ID, rank, skill tier).* |

---

## 🏗️ 3. Architecture & Technical Stack

The system follows a decoupled client-server architecture built with TypeScript.

```
┌────────────────────────────────────────────────────────┐
│               pe-web (React 18 + Vite)                 │
│         Zustand | Custom Hooks | Neon Glassmorphism    │
└───────────────────────────┬────────────────────────────┘
                            │ REST API + Bearer JWT
                            ▼
┌────────────────────────────────────────────────────────┐
│               pe-api (NestJS + TypeORM)                │
│    Authentication (JWT) | Guards (RBAC) | Interceptors │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
  PostgreSQL 16 │                        │ Riot Games API
 (TypeORM ORM)  │                        │ (Account-v1, League-v4,
                ▼                        │  Tournament-Stub v5, Match-v5)
┌───────────────────────┐                ▼
│ Database Persistence  │     ┌─────────────────────────┐
│ Users, Teams, Series, │     │ Riot Callback Webhooks  │
│ Matches, Standings    │     │ HMAC SHA-256 Validated  │
└───────────────────────┘     └─────────────────────────┘
```

### **Backend (`pe-api`)**
* **Framework:** NestJS (Modular Architecture, Dependency Injection, DTO validation with `class-validator`).
* **Persistence & ORM:** PostgreSQL 16 managed via TypeORM entities (`User`, `Team`, `TeamInvitation`, `Tournament`, `Serie`, `Match`, `Standing`, `MatchRoster`).
* **Authentication & RBAC:** Dual-token JWT (Access: 15m in-memory, Refresh: 30d bcrypt-hashed in DB) with `@Roles()` decorator and `RolesGuard`.
* **External Integration:** Riot Games API (`Account-v1`, `League-v4`, `Tournament-Stub v5`, `Match-v5`) with `RiotWebhookGuard` HMAC-SHA256 signature verification.

### **Frontend (`pe-web`)**
* **Core Stack:** React 18, TypeScript, Vite, React Router v6.
* **State Management:** Zustand (`authStore`) managing global user authentication state and token rotation.
* **HTTP Network Layer:** Axios instance with transparent 401 refresh request queuing.
* **UI & Design System:** Custom dark glassmorphism styling (`#0a0a0c`, `#9333ea`, `#dc2626`), custom SVG bracket trees (`CupBracket`), and responsive standings (`LeagueWorkspace`).

---

## 📂 4. Project Structure

```text
PE-platform/
├── pe-api/                   # NestJS Backend API
│   ├── src/
│   │   ├── auth/             # Passport JWT Strategy, AuthService & Guards
│   │   ├── users/            # User Entity, Rank Sync & User Services
│   │   ├── teams/            # Team Management, Roster Logic & Logo Uploads
│   │   ├── team-invitations/ # Member Recruitment & Invitation Handling
│   │   ├── tournaments/      # Fixture Generator (CUP & LEAGUE)
│   │   ├── series/           # Series Scheduling & Best-of Match Control
│   │   ├── matches/          # Match Persistence & Riot Webhook Ingestion
│   │   ├── standings/        # Round-Robin League Points Calculation
│   │   ├── rosters/          # MatchRoster & TournamentRoster Audit
│   │   └── riot/             # Riot Games API Integration Client
│   ├── Dockerfile            # Multi-stage production container setup
│   └── docker-compose.yml    # Database container configuration
│
└── pe-web/                   # React + Vite Frontend Application
    ├── src/
    │   ├── components/       # CupBracket, LeagueWorkspace, Scoreboards, Modals
    │   ├── hooks/            # Custom Domain Hooks (useTournaments, useTeams, useAuth)
    │   ├── pages/            # HomePage, DashboardPage, TeamPage, TournamentDetailPage
    │   ├── store/            # Zustand Global State (authStore)
    │   ├── config/           # Axios Interceptor Client (apiClient)
    │   └── types/            # Shared TypeScript Interfaces & Enums
```

---

## ⚡ 5. Key Features

1. **Roster Verification & Eligibility**
   * Verifies Riot Games account ownership via PUUID lookup.
   * Validates rank compliance (Solo/Duo & Flex) against tournament tier rules.
   * Enforces 5 starters + up to 3 substitutes per team.

2. **Automated Tournament Execution**
   * **Knockout Cups:** Generates linked binary bracket trees (`Series`) with automatic progression of winning teams to downstream slots.
   * **Round-Robin Leagues:** Auto-generates matchdays and updates standings (Points, Matches Played, Wins, Losses, Map Differential).

3. **Riot Webhook & Match Telemetry**
   * Ingests live match completion callbacks from Riot Games API.
   * Stores raw JSONB stats (`match.stats`) including items, trinkets, kills, deaths, gold, damage, and summoner spells.

---

## 🚀 6. Local Setup & Installation

### **Prerequisites**
* Node.js (v18 or higher)
* Docker & Docker Compose
* PostgreSQL 16 (or running via Docker container)
* Riot Games API Key (`RGAPI-...`)

### **1. Clone Repository**
```bash
git clone https://github.com/mateowagner/PE-platform.git
cd PE-platform
```

### **2. Start PostgreSQL via Docker**
```bash
docker-compose up -d
```

### **3. Backend Setup (`pe-api`)**
```bash
cd pe-api

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run database seed (Generates test accounts and initial team)
npm run seed:team

# Start backend in development mode
npm run start:dev
```
Backend server will run at: `http://localhost:3000/api/v1`

### **4. Frontend Setup (`pe-web`)**
```bash
cd ../pe-web

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start dev server
npm run dev
```
Client application will run at: `http://localhost:5173`

---

## 🗺️ 7. ROADMAP / Upcoming Work (20+ Hours)

This roadmap outlines planned features, query optimizations, and technical improvements structured for open-source contributors and project reviewers:

### **Module A: Database Integrity & Query Optimization (5–6 Hours)**
- [ ] **Atomic Transactional Refactoring:** Refactor `TournamentsService.inscribeTeam` and `TournamentsService.generateFixture` to execute inside TypeORM `queryRunner` blocks (`startTransaction`, `commitTransaction`, `rollbackTransaction`) to eliminate partial state corruption.
- [ ] **PostgreSQL Indexing & Optimization:** Add composite indexes to `matches` (`series_id`, `status`), `users` (`riot_puuid`), and `standings` (`tournament_id`, `points`) to optimize live standings calculation and webhook throughput under concurrent loads.

### **Module B: Comprehensive Automated Testing Suite (6–7 Hours)**
- [ ] **Backend Unit & Integration Tests:** Build NestJS unit test suites (`Jest`) for `RiotWebhookGuard` (HMAC timing attacks), `UsersService`, and `TournamentsService`.
- [ ] **Testcontainers Integration:** Set up PostgreSQL integration testing with `Testcontainers` to validate bracket recursion and tie-breaker sorting algorithms deterministically.
- [ ] **Frontend Interceptor & Hook Tests:** Write `Vitest` + `React Testing Library` tests for `apiClient` refresh-queue handling under simultaneous 401 response scenarios.

### **Module C: Event-Driven Real-Time Gateway (5–6 Hours)**
- [ ] **WebSocket Gateway Integration:** Implement NestJS `@WebSocketGateway()` (`TournamentsGateway`) to support real-time team chat, Pick & Ban phase synchronization, and instant bracket advancement events without client polling.

### **Module D: Dynamic Roster Locking & Administrative Overrides (4–5 Hours)**
- [ ] **Dynamic Roster Lock:** Enforce strict `LOCKED` states on `Team.members` during active tournaments (`STARTED` / `IN_PROGRESS`) to block illegal transfers.
- [ ] **Staff Audit & Override Endpoints:** Implement manual match override routes (`is_manual_override`) allowing administrators to resolve technical forfeits, remakes, and manual winner overrides with full audit logging.

---

## 🔒 8. Security & Secrets Management Policy

> ⚠️ **Important Security Notice:**
> No passwords, environment files (`.env`), private keys, JWT secrets, or live Riot API tokens are stored within this repository history.
> 
> * All configuration is injected via environment variables at runtime.
> * Environment templates (`.env.example`) contain placeholders only.
> * If you contribute to this project, ensure `.env` remains listed in `.gitignore` before submitting any pull request.

---

## 📄 9. License

This project is open-source software licensed under the **[MIT License](LICENSE)**.