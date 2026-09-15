# hqhb backend

Express + MongoDB + Redis API. See the [root README](../README.md) for the project overview and [`docs/API.md`](../docs/API.md) for the full endpoint reference.

## Setup

```bash
npm install
cp .env.example .env   # see below
npm run seed:watans     # populates the watan (hometown) dropdown list
npm run dev              # nodemon, restarts on change
# or: npm start           # plain node, for production (used by PM2 in deploy/)
```

## Environment variables

See `.env.example` for the full list with inline comments. The two that don't have safe defaults and must be set:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings, must differ from each other. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `MONGO_URI` — defaults to a local `mongodb://localhost:27017/user_management_system` if unset.

Everything else (Redis toggle, cookie names/flags, log level, JWT expiries) has a working default for local dev.

## Architecture

- **`config/`** — every piece of external configuration (env vars, Mongo connection, Redis client, Pino logger) lives here, nowhere else. `config/env.js` is the single object every other file reads from.
- **`constants/`** — `roles.js` and `status.js` are the single source of truth for role/status values, used by both the Mongoose schema enums and the permission logic. Change a role name in one place.
- **`services/`** — all business logic and DB access. Every function is wrapped in `try { ... } catch (err) { throw err; }` — services never decide how to respond to an error, only propagate it.
- **`controllers/`** — thin. Parse the request, call a service, shape the response. Every function has its own `try/catch`: logs via `logger.logException`, then responds with a normalized status/message via `utils/normalizeError.js` (maps Mongoose `ValidationError`/`CastError`/duplicate-key errors to `400` instead of a generic `500`).
- **`utils/userPermissions.js`** — the one place the admin/super-admin management hierarchy is defined (`canManage`, `canEdit`, `editableFieldsFor`). The user-listing filter, the edit endpoint, and the status-change endpoints all call into this rather than each re-implementing the rule, so they can't drift apart.
- **Redis is optional by design** — `services/redisService.js` gates every operation behind `config.redis.enabled` (`IS_REDIS_SERVER_ON` env var). When disabled, `getOrSet()` falls straight through to the database call passed in by the caller. No other code needs to know or care whether caching is on.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on file change) |
| `npm start` | Start once, plain `node` — used in production under PM2 |
| `npm run seed:watans` | One-off: populates the `WatanMaster` collection. Safe to re-run (upserts by name, won't duplicate). |
