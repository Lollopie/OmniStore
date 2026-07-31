# OmniStore

OmniStore is a multi-user warehouse and inventory management app built with NestJS, React, PostgreSQL, Redis, and shared TypeScript DTOs.

## Features

- Authentication with register, login, logout, and cookie-based session checks
- Warehouse and inventory management behind protected routes
- Role-based warehouse access
- PostgreSQL migrations with row-level security support
- Redis-backed request throttling
- React UI with theme switching and responsive navigation

## Repository layout

- `backend/` - NestJS API
- `frontend/` - React + Vite client
- `shared/` - shared validation and DTO utilities

## Requirements

- Node.js 24
- npm
- PostgreSQL 18 or compatible
- Redis 8 or compatible

## Environment variables

### Backend

Create `backend/.env.dev`, `backend/.env.test`, or `backend/.env.prod` as needed.

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dev
APP_USER=postgres
APP_PASSWORD=postgres
DATABASE_SYNCHRONIZE=false
BCRYPT_SALT_ROUNDS=14
JWT_SECRET=your_secret
JWT_EXPIRATION=3600
REDIS_URL=redis://localhost:6379
RATE_LIMIT=10
RATE_TIMEOUT=60000
```

### Frontend

```env
VITE_NESTJS_HOST_URL=http://localhost:3000
```

## Run locally

### Shared package

```bash
cd shared
npm install
npm run build
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3000`.

## Docker Compose

You can also start the full stack with Docker Compose:

```bash
docker compose up --build
```

## Testing

Backend:

```bash
cd backend
npm run test
npm run test:e2e
```

Frontend Playwright tests:

```bash
cd frontend
npx playwright test
```

## CI/CD

The project uses GitHub Actions to automate quality gates and deployment:

- runs backend unit tests and E2E tests on pull requests and pushes to `main`
- runs frontend Playwright tests against the same PostgreSQL and Redis services
- builds the shared package and backend before browser tests
- triggers production deployments after both test jobs pass
- performs a post-deploy health check against `GET /healthz`

## Health check

The backend exposes a health endpoint at `GET /healthz`.

## License

MIT. See [LICENSE](LICENSE).
