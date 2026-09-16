# hqhb — User Management System

A MERN-stack user management system with JWT authentication (httpOnly cookies), a three-tier role hierarchy (user / admin / super-admin) with per-field and per-status permission rules, an audit trail for status changes, and a Redis caching layer that's fully toggleable at runtime.

**Live demo:** https://hqhb-ebrahim-morkas.duckdns.org

## Tech stack

| | |
|---|---|
| Backend | Node.js, Express 5, MongoDB (Mongoose), Redis |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4 |
| Auth | JWT (access + refresh), httpOnly cookies |
| Logging | Pino (pretty-printed in dev, JSON file in prod) |
| Deployment | AWS EC2, Nginx, PM2, Let's Encrypt, MongoDB Atlas |

## Features

- **Authentication** — login with ITS (8-digit ID) + password. Short-lived access token and longer-lived refresh token, both httpOnly cookies. Refresh tokens rotate on every use and are invalidated server-side on logout (`tokenVersion` bump).
- **Inactive/deleted accounts can't log in or stay logged in** — a correct password against an Inactive account gets a specific "contact an administrator" message (only revealed after the password is verified, so a wrong password never confirms an account's status); a deleted account is indistinguishable from one that never existed. The refresh endpoint re-checks status on every use too, so an already-logged-in session can't keep renewing itself after the account is deactivated.
- **Role-based access control** — three roles (`user`, `admin`, `super-admin`) with a strict management hierarchy: admin manages plain users, super-admin manages users and admins but never a fellow super-admin. Enforced identically at the listing, edit, and status-change endpoints via a single shared permission rule (`utils/userPermissions.js`), not duplicated per route. One deliberate exception: super-admin can also deactivate an **admin**-role account, since a regular admin can never manage another admin's row at all — without that bypass, an admin-role account could never be deactivated by anyone.
- **Per-field edit permissions** — admin can edit Name/Email/Phone/Age; super-admin can additionally edit ITS/Watan; a user editing their own profile can edit Email/Phone/Age (not Name).
- **Status workflow + audit trail** — every user has status `A` (Active) / `I` (Inactive) / `D` (Deleted, soft). Admin deactivates (A→I), super-admin reactivates (I→A) or deletes (I→D). Every transition is recorded with who did it and when. Deleted users are excluded from every listing permanently, and their **ITS becomes reusable** by a new account (a partial unique index, not a plain one).
- **Watan master list** — hometown is a dropdown backed by a seeded reference collection, not free text, validated server-side against that list.
- **Redis caching, fully optional** — a single env flag (`IS_REDIS_SERVER_ON`) turns caching on or off; when off, every read transparently falls through to MongoDB with no code change and no broken requests.
- **Reusable, configuration-driven UI** — a generic `DataTable` (columns and row actions are passed in, not hardcoded) and a generic `UserForm` (which fields to render are passed in) power every create/edit screen in the app from the same two components.
- **Dedicated pages, not modals** — Create User, Edit User, and self-edit-profile are each their own route (`/users/new`, `/users/:id/edit`, `/profile/edit`), refresh-safe and directly linkable.
- **Collapsible sidebar** — persistent across navigation (open/closed state lives in a context above the router, not per-page, so it doesn't reset when you navigate), collapses to an icon-only rail rather than disappearing. Contents differ by role: super-admin gets Create/Update/Mark Active/Delete, admin gets Update/Mark Inactive.
- **Find-by-ITS action pages** — Update, Mark Active, Delete, and Mark Inactive are all also reachable from the sidebar by searching a user's ITS directly, not just from the table row. One reusable page component handles all four, configured by an `action` prop.
- **Actions stay on the page** — every action (table row buttons, sidebar find-and-act pages, create/edit forms) shows a closable success or error banner in place, instead of redirecting back to the users table.
- **Custom error pages** — 404 / 403 / 500 each get a dedicated page; a 403 or 500 from any API call redirects there automatically.

## Roles & permissions

| | User | Admin | Super Admin |
|---|---|---|---|
| View own profile | ✅ | — | — |
| Edit own profile (Email/Phone/Age) | ✅ | — | — |
| View users table | ❌ | ✅ (`user` rows only) | ✅ (`user` + `admin` rows) |
| See Watan column | ❌ | ❌ | ✅ |
| Create a user | ❌ | ❌ | ✅ (as `user` or `admin`, never `super-admin`) |
| Edit a user's Name/Email/Phone/Age | — | ✅ (while Active) | ✅ (while Active) |
| Edit a user's ITS/Watan | — | ❌ | ✅ (while Active) |
| Mark a user Inactive (A→I) | — | ✅ (`user` rows) | ✅ (`admin` rows only — the bypass) |
| Mark a user Active (I→A) | — | ❌ | ✅ |
| Delete a user (I→D, soft) | — | ❌ | ✅ |

A super-admin's own row never appears in their own table (not even to themselves) — the table is for managing others.

The Mark Inactive split looks unusual but is deliberate: a regular admin can never manage an admin-role row at all (not even to view it), so super-admin is the *only* one who can ever deactivate a fellow admin — it isn't optional, it's the only path that exists.

## Project structure

```
hqhb/
├── backend/
│   ├── src/
│   │   ├── config/        # env, db, redis, logger — all config in one place
│   │   ├── constants/      # roles, status — single source of truth
│   │   ├── controllers/    # thin — parse request, call service, shape response
│   │   ├── middlewares/    # authMiddleware (protect/authorize), requestLogger
│   │   ├── models/         # User, WatanMaster
│   │   ├── routes/
│   │   ├── scripts/        # seedWatanMaster.js
│   │   ├── services/       # business logic, caching, DB access
│   │   └── utils/          # ApiError, normalizeError, token, userPermissions, ...
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/            # fetch client + per-resource API wrappers
│       ├── components/     # ui/ (Button, Input, DataTable, ...), layout/ (Navbar, Sidebar, AdminLayout, ...), users/
│       ├── constants/       # roles, status, form field sets
│       ├── context/         # AuthContext, SidebarContext
│       ├── hooks/           # useWatanOptions, useSidebarItems
│       ├── pages/           # ..., FindUserActionPage (Update/Mark Active/Delete/Mark Inactive via ITS search)
│       └── routes/         # ProtectedRoute, GuestRoute, RoleRoute
├── deploy/                 # nginx.conf, ecosystem.config.js, deployment runbook
└── docs/
    └── API.md              # full endpoint reference
```

## Getting started

**Prerequisites:** Node.js 18+, MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas)), Redis (optional — the app runs fine without it).

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets, etc. — see backend/README.md
npm run seed:watans     # seeds the watan (hometown) dropdown list
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Defaults to talking to the backend at `http://localhost:5000/api` — see `frontend/.env.example` to change it.

### Creating the first account

User creation requires being logged in as a super-admin — which means the very first account can't be created through the app itself. Seed one directly:

```bash
# from backend/, with .env already configured
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./src/config/env');
const User = require('./src/models/User');
require('./src/models/WatanMaster');
mongoose.connect(config.mongo.uri).then(async () => {
  await User.create({
    name: 'Super Admin', email: 'admin@example.com',
    its: '11111111', age: 30, watan: 'Surat',
    role: 'super-admin', password: 'ChangeMe123!',
  });
  console.log('Created. Log in with ITS 11111111.');
  process.exit(0);
});
"
```

Every other account (any role) can be created from the app afterward by a super-admin.

## Environment variables

Full reference with defaults and comments: `backend/.env.example` and `frontend/.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `IS_REDIS_SERVER_ON` | `1` to enable caching, anything else to disable it — no other code changes needed either way |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Must be set, must differ from each other |
| `FRONTEND_URL` | CORS origin allowlist |
| `COOKIE_SECURE` | Independent of `NODE_ENV` — set to `0` if running production mode over plain HTTP (no SSL yet); `Secure` cookies are silently dropped by browsers over HTTP |

## API reference

See [`docs/API.md`](docs/API.md) for every endpoint, its auth requirements, and request/response shapes.

## Deployment

See [`deploy/README.md`](deploy/README.md) for the full AWS EC2 + Nginx + PM2 + Let's Encrypt runbook this app is actually deployed with.
