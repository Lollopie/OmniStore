# OmniStore

OmniStore is a multi-user warehouse and inventory management app. Organizations manage their members, warehouses and stock, with role-based permissions and Stripe subscriptions. It's built with NestJS, React, PostgreSQL, Redis and shared TypeScript DTOs.

## Features

- **Organizations:** self-service sign-up with email verification. Members have the roles `owner`, `admin` or `member`. Members can be invited, removed or have their role changed, and an organization can be renamed or deleted.
- **Warehouses:** multiple warehouses per organization, with per-warehouse roles (`admin`, `manager`, `staff`), warehouse invites and an active-warehouse switcher.
- **Inventory:** add, edit and delete items, with sorting, search and pagination. The homepage shows an interactive in-browser demo of the same inventory table.
- **Subscriptions:** Starter, Growth and Enterprise plans through Stripe Checkout, with a Stripe Customer Portal for billing. Organizations without an active subscription are read-only.
- **Security:**
  - Short-lived access tokens with rotating refresh tokens.
  - Removed users lose access immediately through a Redis revocation list.
  - PostgreSQL row-level security isolates organizations and warehouses.
  - Separate database roles for migrations, the app and read-only access.
- **Email:** verification and invite emails through SMTP (Mailpit locally) or Resend, plus a contact form.
- **UI:** React with light/dark themes and responsive navigation.

## Repository layout

- `backend/`: NestJS API, TypeORM migrations, and unit, integration and e2e tests
- `frontend/`: React + Vite client and Playwright tests
- `shared/`: DTOs, validation and role enums used by both sides
- `docker-entrypoint-initdb.d/`: creates the database roles and the `test_db` database on first Postgres start

## Authentication

Logging in sets two httpOnly cookies:

| Cookie | Lifetime | Purpose |
|---|---|---|
| `token` | JWT valid for 15 min (`JWT_EXPIRATION`) | Access token checked by `AuthGuard` |
| `refresh_token` | 7 days (`REFRESH_TOKEN_EXPIRATION`) | Renews the access token via `POST /auth/refresh` |

- **Renewal:** the frontend's axios client (`frontend/src/api/client.ts`) handles expired access tokens on its own. On a 401 from `AuthGuard` it calls `/auth/refresh` once and retries the request.
- **Rotation:** each refresh token is stored as a hash in Postgres and replaced on every use. If an already-used token is presented again, every session of that user ends.
- **Revocation:** removing a member, deleting an organization or deleting an account writes the affected users to a Redis revocation list, so their access tokens stop working immediately.
- **Without Redis:** `AuthGuard` falls back to checking membership in Postgres.

## Requirements

- Node.js 24 and npm
- PostgreSQL 18 (or compatible)
- Redis 8 (or compatible)
- An SMTP server for email. Docker Compose includes [Mailpit](https://mailpit.axllent.org/).
- A Stripe account with test keys, for subscriptions

Docker Compose provides everything except Node.js and Stripe.

## Environment variables

### Docker Compose (`.env` in the repository root)

| Variable | Purpose |
|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres superuser and database |
| `MIGRATOR_PASSWORD` | Password for the `nestjs_migrator` role, which runs migrations |
| `APP_PASSWORD` | Password for the `nestjs_app_user` role, which the API connects as |
| `MCP_READONLY_PASSWORD` | Password for the read-only `mcp_readonly` role |
| `STRIPE_PUBLISHABLE_KEY` | Passed to the frontend container |

The roles are created by `docker-entrypoint-initdb.d/init-user.sh` when the Postgres volume is first initialized.

### Backend

The backend loads `backend/.env.<NODE_ENV>` (`dev`, `test` or `prod`), then `backend/.env`, then `/etc/secrets/.env`. Keep secrets in `backend/.env`, which git ignores.

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dev
DATABASE_SYNCHRONIZE=false
APP_USER=nestjs_app_user
APP_PASSWORD=apppassword
MIGRATOR_USER=nestjs_migrator
MIGRATOR_PASSWORD=migratorpassword

# Auth
JWT_SECRET=your_secret
JWT_EXPIRATION=900                 # access token, seconds
REFRESH_TOKEN_EXPIRATION=604800    # refresh token, seconds
BCRYPT_SALT_ROUNDS=14

# Redis and rate limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT=10
RATE_TIMEOUT=60000

# App
FRONTEND_URL=http://localhost:5173

# Email (MAIL_USER=resend sends through Resend instead of SMTP)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM="No Reply <noreply@localhost>"
RESEND_SECRET=
CONTACT_RECIPIENT=you@example.org
INVITE_TOKEN_EXPIRATION_HOURS=24
REGISTER_TOKEN_EXPIRATION_MINUTES=30

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PORTAL_CONFIGURATION=       # optional
```

### Frontend

```env
VITE_NESTJS_HOST_URL=http://localhost:3000
```

## Run locally

### With Docker Compose

```bash
docker compose up --build
```

This starts:
- Postgres
- a one-off migration runner
- the backend on `http://localhost:3000`
- the frontend on `http://localhost:5173`
- Redis
- Mailpit, with its inbox at `http://localhost:8025`

The backend and frontend containers mount the source folders and reload on changes.

Each container has its own `node_modules` volume. After adding a dependency, install it inside the container too, e.g. `docker exec react_frontend sh -c "cd /app/frontend && npm install"`.

### Without Docker

Start Postgres, Redis and an SMTP server yourself, then:

```bash
# Shared package (rebuild after changing it)
cd shared && npm install && npm run build

# Backend
cd backend && npm install
npm run migration:run
npm run start:dev

# Frontend
cd frontend && npm install
npm run dev
```

## Database migrations

Migrations live in `backend/src/migrations`. They run as the `nestjs_migrator` role, while the API connects as `nestjs_app_user`, which is subject to row-level security.

```bash
cd backend
npm run migration:run     # development database
npm run test:migration    # test_db, used by the integration and e2e tests
```

The production image runs `migration:run:prod` on startup.

## Testing

### Backend

```bash
cd backend
npm run test       # unit tests
npm run test:int   # integration tests (needs Postgres and Redis)
npm run test:e2e   # e2e tests (needs Postgres, Redis and Mailpit)
```

The integration and e2e tests use `test_db`, so run `npm run test:migration` after adding a migration.

### Frontend

```bash
cd frontend
npm run lint
npx playwright test
```

Playwright starts the backend and the Vite dev server itself, or reuses ones that are already running. It seeds accounts directly through `backend/test/playwright/seedAccount.ts`, skipping the registration emails and Stripe.

## CI/CD

GitHub Actions (`.github/workflows/`):
- **`main.yml`**, on pushes and pull requests to `main`:
  - runs the backend unit, integration and e2e tests, and the Playwright tests, against Postgres, Redis and Mailpit service containers
  - after both test jobs pass, triggers the Render deployments for the frontend and backend, then polls `GET /healthz`
- **`eslint.yml`** lints the backend, frontend and shared packages and uploads the results as SARIF to code scanning.

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /login`, `POST /logout`, `GET /auth/status`, `POST /auth/refresh` |
| Registration | `POST /register`, `GET /register/verify`, `POST /organizations/register` |
| Organization | `GET /organizations/me`, `PATCH/DELETE /organizations`, `GET /organizations/subscription`, `/organizations/users`, `/organizations/invites`, `/organizations/billing` |
| Warehouses | `POST /warehouses`, `POST /warehouses/select`, `/warehouses/users`, `POST /warehouses/invites` |
| Inventory | `GET/POST/PATCH/DELETE /inventory` |
| Account | `PATCH/DELETE /users` |
| Payments | `POST /checkout/create-session`, `POST /webhook` (Stripe) |
| Other | `POST /invites/accept`, `POST /contact`, `GET /healthz` |

## License

MIT. See [LICENSE](LICENSE).
