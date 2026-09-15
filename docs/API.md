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

`401` on wrong ITS/password — deliberately the same message for both ("Invalid ITS or password") to avoid confirming whether an ITS exists.

### `POST /auth/refresh`
Public (reads the `refresh_token` cookie itself).

Rotates both tokens and re-sets both cookies. Rejects (`401`) if the refresh token is invalid/expired, or if its embedded `tokenVersion` doesn't match the user's current one (i.e. they logged out, or a super-admin didn't do anything — logout is the only thing that bumps it, invalidating every other outstanding session for that user across all devices).

### `POST /auth/logout`
Requires auth. Bumps the user's `tokenVersion` (invalidating every refresh token issued before this point, everywhere) and clears both cookies.

### `GET /auth/me`
Requires auth. Returns the current user's own record. Used by the frontend on every page load to hydrate the session from the cookies.

---

## Users — `/api/users`

All endpoints require auth. Row-level visibility follows one rule everywhere (`utils/userPermissions.js`): **admin** may act on `role: user` rows; **super-admin** may act on `role: user` and `role: admin` rows, never `role: super-admin` (including their own row). Anyone may always edit *their own* row regardless of role, subject to the field restrictions below.

### `GET /users`
Admin, super-admin. Returns every row the caller can manage, with `status: D` (deleted) rows excluded entirely. Admin's rows additionally have `watan` stripped from the response.

### `GET /users/:id`
Admin, super-admin. Same row-visibility rule as the list — a row outside what the caller can manage returns `404` (not `403`), so it doesn't confirm the row exists.

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
- `its`: exactly 8 digits, unique.
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
Admin only. Target must be `status: A` and a row the admin can manage (`role: user`). Sets `status: I`, appends an audit entry.

### `PATCH /users/:id/mark-active`
Super-admin only. Target must be `status: I` and a row the super-admin can manage. Sets `status: A`, appends an audit entry.

### `DELETE /users/:id`
Super-admin only. Soft delete — target must be `status: I` first. Sets `status: D` (never physically removed; the row and its audit history remain in the database, just excluded from every listing/lookup from then on).

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
