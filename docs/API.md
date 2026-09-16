# API Reference

Base URL: `/api` (e.g. `http://localhost:5000/api` in dev).

All responses follow the same envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

**Auth** is entirely cookie-based (httpOnly `access_token` + `refresh_token`, set by `/auth/login`). There is no `Authorization` header — the browser sends the cookies automatically; a non-browser client needs to persist and resend the `Set-Cookie` values itself.

**Status codes**: `400` validation error, `401` not authenticated / expired session, `403` authenticated but not permitted, `404` not found (also used instead of `403` where confirming a resource's existence would itself leak information — see Users below), `500` unexpected error.

---

## Auth — `/api/auth`

### `POST /auth/login`
Public.

Request:
```json
{ "its": "12345678", "password": "..." }
```

Response `200`: `{ "user": { ...safe user fields... } }`, plus sets `access_token` (15 min) and `refresh_token` (7 days) cookies.

`401` responses, by case:
- Wrong ITS or wrong password: `"Invalid ITS or password"` — deliberately identical for both, and only returned *after* the password is checked, so a failed attempt never confirms an ITS exists.
- Correct credentials, but the account's `status` is `I` (Inactive): `"Your account is inactive. Please contact an administrator."`
- Correct ITS but the account is `status: D` (deleted), or the ITS never existed: same generic `"Invalid ITS or password"` as a wrong password — a deleted account is indistinguishable from one that never existed.

### `POST /auth/refresh`
Public (reads the `refresh_token` cookie itself).

Rotates both tokens and re-sets both cookies. Rejects (`401`) if the refresh token is invalid/expired, its embedded `tokenVersion` doesn't match the user's current one (logout is what bumps it, invalidating every other outstanding session for that user across all devices), or the account is `status: D`. If the account is `status: I`, returns the same `"Your account is inactive..."` message as login — this is what stops an already-logged-in session from continuing after the account is deactivated; without it, the login-time block alone wouldn't actually end an existing session.

### `POST /auth/logout`
Requires auth. Bumps the user's `tokenVersion` (invalidating every refresh token issued before this point, everywhere) and clears both cookies.

### `GET /auth/me`
Requires auth. Returns the current user's own record. Used by the frontend on every page load to hydrate the session from the cookies.

---

## Users — `/api/users`

All endpoints require auth. Row-level visibility (which rows an actor can even see or reach) follows one rule everywhere (`utils/userPermissions.js`, `canManage`): **admin** may act on `role: user` rows; **super-admin** may act on `role: user` and `role: admin` rows, never `role: super-admin` (including their own row). Anyone may always edit *their own* row regardless of role, subject to the field restrictions below. Layered on top of `canManage`, the mark-inactive endpoint has one further exception (below) letting super-admin act on an admin-role row that a regular admin structurally never could.

### `GET /users`
Admin, super-admin. Returns every row the caller can manage, with `status: D` (deleted) rows excluded entirely. Admin's rows additionally have `watan` stripped from the response.

### `GET /users/:id`
Admin, super-admin. Same row-visibility rule as the list — a row outside what the caller can manage returns `404` (not `403`), so it doesn't confirm the row exists.

### `GET /users/its/:its`
Admin, super-admin. Same shape and row-visibility rule as `GET /users/:id`, looked up by ITS instead of Mongo `_id`. Excludes deleted users (see the `its` note below - a deleted account's ITS may since have been reissued to a different, current account). Backs the sidebar's "find a user by ITS" flow (Update / Mark Active / Delete / Mark Inactive all start here).

### `POST /users`
Super-admin only.

Request — all fields required except `phone`:
```json
{
  "name": "...", "email": "...", "phone": "9876543210",
  "its": "12345678", "age": 30, "watan": "Surat",
  "role": "user", "password": "..."
}
```
- `its`: exactly 8 digits, unique **among non-deleted users only** (partial index) — once a user is deleted (`status: D`), their ITS becomes available for a brand-new account to reuse.
- `phone`: optional; if present, 7–15 digits, unique.
- `email`: valid format, **not** unique (intentional — see root README).
- `watan`: must exist in the watan master list (`GET /watans`).
- `role`: `user` or `admin` — `super-admin` is rejected even from a super-admin caller.

`201` with the created user (password/internal fields stripped).

### `PUT /users/:id`
Any authenticated role, but effectively: self-edit for `user`, or a row the caller can manage for admin/super-admin. Only allowed while the target's `status` is `A` (Active) — `400` otherwise.

Which fields are accepted, silently dropping anything else in the body:
| Caller | Fields |
|---|---|
| `user` (self only) | `email`, `phone`, `age` |
| `admin` | `name`, `email`, `phone`, `age` |
| `super-admin` | `name`, `email`, `phone`, `age`, `its`, `watan` |

### `PATCH /users/:id/mark-inactive`
Admin **or** super-admin, but not interchangeably — the target's `role` decides which:
- Admin deactivating a `role: user` row (the normal case)
- Super-admin deactivating a `role: admin` row (the bypass - a regular admin can never manage another admin's row at all, so without this exception no one could ever deactivate an admin-role account)

Target must currently be `status: A`. Sets `status: I`, appends an audit entry. `400` if the target isn't Active: `"Can't mark Inactive as user is already Inactive"` (or `Deleted`, naming whatever it actually is).

### `PATCH /users/:id/mark-active`
Super-admin only. Target must be `status: I` and a row the super-admin can manage (`role: user` or `role: admin`). Sets `status: A`, appends an audit entry. `400` if not Inactive: `"Can't mark Active as user is already Active"`.

### `DELETE /users/:id`
Super-admin only. Soft delete — target must be `status: I` first. Sets `status: D` (never physically removed; the row and its audit history remain in the database, just excluded from every listing/lookup from then on, and its ITS becomes reusable - see above). `400` if the target is still Active: `"Can't delete user as they are still Active - Ask admin to mark them Inactive first"`.

---

## Watans — `/api/watans`

### `GET /watans`
Requires auth (any role — this is reference data, not sensitive). Returns the full watan master list, used to populate the dropdown in the create/edit forms. Seeded via `backend/src/scripts/seedWatanMaster.js`.

---

## User object shape

```json
{
  "_id": "...",
  "name": "...",
  "email": "...",
  "phone": "9876543210",       // omitted if not set
  "its": "12345678",
  "age": 30,
  "watan": "Surat",             // omitted from admin's view of other rows
  "role": "user | admin | super-admin",
  "status": "A | I | D",
  "createdAt": "...",
  "updatedAt": "..."
}
```

`password`, `tokenVersion`, and `statusAudit` are never included in any API response (schema-level `select: false`, and explicitly stripped where a document is built in memory rather than queried).
