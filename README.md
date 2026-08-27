# Real-Time Leaderboard

A full-stack leaderboard platform built with NestJS, PostgreSQL, Redis, Socket.IO, and React. Players can authenticate, submit scores, view rankings, manage friends and messages, and join tournaments. Admins can manage the game catalog.

Project brief: https://roadmap.sh/projects/realtime-leaderboard-system

## Highlights

- JWT access and refresh tokens with bcrypt password hashing.
- Admin-only game management and protected user, score, social, and tournament workflows.
- Redis sorted sets for fast leaderboard reads and rank calculations.
- Socket.IO events for leaderboard updates and real-time messaging.
- PostgreSQL persistence with TypeORM migrations for 11 relational tables.
- Request validation, standardized responses, error handling, and a 10-request-per-60-second rate limit.
- React control room for exercising the API from a browser.
- Repeatable demo-data seeding for local development.

## Stack

TypeScript, Node.js, NestJS, TypeORM, PostgreSQL, Redis, Socket.IO, Passport, JWT, React, Vite, and Lucide.

## Requirements

- Node.js 20 or newer.
- PostgreSQL 16 or newer.
- Redis 6 or newer.

## Backend Setup

```bash
git clone https://github.com/Vishukaneki/RealTimeLeaderBoard.git
cd RealTimeLeaderBoard
npm install
```

Create `.env` in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_DATABASE=leaderboard

JWT_SECRET=replace_with_a_long_random_secret
ACCESSTOKEN_LIFETIME=3600
REFRESHTOKEN_LIFETIME=604800
REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Start PostgreSQL and Redis. With Homebrew on macOS:

```bash
brew services start postgresql@16
brew services start redis
```

Create the configured database if it does not exist:

```bash
createdb leaderboard
```

If `createdb` is not on your `PATH`, use the Homebrew binary directly:

```bash
/usr/local/opt/postgresql@16/bin/createdb leaderboard
```

Run migrations and load reproducible demo data:

```bash
npm run migration:run
npm run seed
```

The seed creates users, games, scores, leaderboard entries, friend requests, messages, and a tournament. New demo users use the password `DemoPass123!`; existing users are preserved.

Start the API:

```bash
npm run start:dev
```

The API listens on http://localhost:3000.

## React Control Room

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173. The dashboard provides controls for authentication, games, scores, leaderboards, friends, messages, and tournaments, plus a Socket.IO connection indicator.

The frontend uses `VITE_API_URL` when provided; otherwise it defaults to `http://localhost:3000`.

## API Overview

Protected routes require `Authorization: Bearer <accessToken>`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/protected`, `POST /auth/refreshToken`, `POST /auth/logout` |
| Users | `POST /user`, `GET /user`, `GET /user/me`, `PATCH /user/:id`, `DELETE /user/:id` |
| Rankings | `GET /user/ranking?gameName=...`, `GET /user/ranking/:gameName`, `GET /leaderboard`, `GET /leaderboard/game?gameName=...` |
| Games | `POST /game`, `GET /game`, `GET /game/:id`, `PATCH /game/:id`, `DELETE /game/:id` |
| Scores | `POST /score?gameName=...`, `GET /score?gameName=...`, `GET /score/top-players` |
| Social | `POST /user/friends/request`, `POST /user/friends/request/:id/:status`, `GET /user/friends`, `GET /user/friends/requests/pending` |
| Messages | `POST /user/messages`, `GET /user/messages/:friendId`, `GET /user/messages/unread/count` |
| Tournaments | `POST /tournament`, `GET /tournament`, `GET /tournament/:id`, `PATCH /tournament/:id`, `DELETE /tournament/:id`, `POST /tournament/:id/join` |

Successful responses use `{ success, data, message }`. Leaderboard updates are emitted through Socket.IO events named `leaderboard_update_<gameName>`.

## Verification and Benchmarks

Build both applications:

```bash
npm run build
cd frontend && npm run build
```

Local benchmark commands:

```bash
npx autocannon -c 2 -a 10 http://localhost:3000/
redis-benchmark -n 1000 -c 10 -q
```

One local development run produced 10/10 successful API smoke-test requests with 3 ms median latency, 6.4 ms average latency, and 19 ms p97.5 latency. Redis reported approximately 55K `ZADD` operations/sec. These are machine-specific local measurements, not production capacity guarantees.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Start the backend in watch mode |
| `npm run build` | Build the backend |
| `npm run migration:run` | Apply pending TypeORM migrations |
| `npm run migration:revert` | Revert the latest migration |
| `npm run seed` | Insert repeatable demo data |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## License

This project is private and currently has no published open-source license.
