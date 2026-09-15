# hqhb frontend

React 19 + Vite + Tailwind CSS v4 + React Router. See the [root README](../README.md) for the project overview.

## Setup

```bash
npm install
npm run dev
```

Talks to the backend at `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api` if unset — see `.env.example`). In production, this is left unset and defaults to the relative path `/api`, since Nginx serves the built frontend and proxies `/api` to the backend on the same origin (see `../deploy/nginx.conf`) — no CORS, no cross-site cookie issues.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally, to sanity-check it before deploying |
| `npm run lint` | oxlint |

## Architecture

- **`api/client.js`** — the only place `fetch` is called directly. Every request sends `credentials: 'include'` (cookies, never a token in JS). On a `401` it transparently calls `/auth/refresh` once and retries the original request before giving up; on `403`/`5xx`/a network failure it redirects to the matching error page (`/forbidden`, `/error`) via `utils/navigation.js` — a small module that lets this non-component file trigger a React Router navigation, bridged in from `App.jsx`.
- **`context/AuthContext.jsx`** — the single source of truth for "who's logged in." Hydrates from `GET /auth/me` on load (cookies are httpOnly, so this is the only way to know if a session already exists), exposes `login`/`logout`/`refreshUser`.
- **`routes/`** — three guards, composable: `ProtectedRoute` (must be logged in), `GuestRoute` (must *not* be logged in — keeps a logged-in user off `/login`), `RoleRoute` (must have one of the given roles, else redirected to `/forbidden`).
- **Reusable, configuration-driven components**, not one-off per page:
  - `components/table/DataTable.jsx` — columns and row actions are passed in as props; only "Sr No." and "Actions" are built in. Used identically for the admin and super-admin views of the users table, which show different columns and different per-row actions depending on the viewer's role and each row's status.
  - `components/users/UserForm.jsx` — which fields to render is a `fields` prop. The same component backs Create User, Edit User (admin variant and super-admin variant, different field sets), and self-edit-profile.
  - `components/ui/` — Button, Input, PasswordInput (auto-swapped in by `FormField` whenever `type="password"`, so every password field in the app got a show/hide toggle for free), Select, Badge, Alert.
- **Design tokens live in `index.css`** (`@theme` block) — colors, radii. Restyle the whole app by changing values in one place, not by hunting through components for hardcoded hex codes.
- **Create/Edit/self-edit are dedicated pages**, not modals — `/users/new`, `/users/:id/edit`, `/profile/edit`. Each is refresh-safe: `EditUserPage` fetches its target user fresh by ID from the URL param rather than relying on data passed through in-app navigation, so a direct link or a page refresh both still work.
