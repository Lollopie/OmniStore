# OmniStore: A Multi-User Isolated Web Application
## Key Features

- **Multi-User Isolation**: Complete data separation at the database level using PostgreSQL Row-Level Security (RLS). Each user interacts only with their own data context.
- **Secure Authentication**: Stateless session handling via JSON Web Tokens (JWT) and industry-standard password hashing using `bcrypt`.
- **Modern User Interface**: A clean, responsive, and intuitive dashboard built with React and styled dynamically using Tailwind CSS.
- **Robust & Scalable API**: A modular, enterprise-ready backend architecture powered by NestJS and TypeScript.
- **Automated Quality Assurance**: Continuous Integration (CI) workflow configured with GitHub Actions to run automated tests on every push or pull request.

---

## Tech Stack

### Front-End
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **Data Fetching & State**: Fetch API

### Back-End
- **Framework**: NestJS (TypeScript)
- **Authentication**: JWT (JSON Web Tokens)
- **Cryptography**: bcrypt

### Database
- **Engine**: PostgreSQL
- **Security**: Row-Level Security (RLS) policies

### DevOps & CI/CD
- **CI Workflow**: GitHub Actions (Automated testing suite)

---

## Security Architecture

### Data Isolation (PostgreSQL RLS)
Unlike traditional multi-tenant applications that rely entirely on application-level filtering (e.g., appending `WHERE user_id = X` to every query), OmniStore enforces isolation directly within the database engine using **Row-Level Security (RLS)**.
- Every query executed on behalf of an authenticated user sets a local transaction session variable (e.g., `SELECT set_config('app.current_user_id', {user_id}, true)`).
- PostgreSQL native RLS policies automatically restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations based on this context.
- This pattern mitigates the risk of accidental cross-tenant data leaks caused by potential developer oversight in the API layer.

### Authentication Flow
1. **Login**: User submits credentials through the React front-end.
2. **Verification**: NestJS handles the request, uses `bcrypt` to securely verify the password hash stored in PostgreSQL.
3. **Token Issuance**: Upon successful validation, the backend generates a cryptographically signed **JWT**.
4. **Authorized Requests**: The client securely stores this token as an HTML only cookie and includes it as a cookie in subsequent API transactions.

---

## 📋 Prerequisites

Before running this project, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v24)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (v14)

---

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/omnistore.git](https://github.com/yourusername/omnistore.git)
cd omnistore
```
### 2. Back-End Configuration
Navigate to the backend directory and install the required dependencies:
```bash
cd backend
npm install
```
Create a .env file in the root of the backend/ directory and configure your environment variables:
```env
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION=3600#Expiration Time in seconds (1 hour)
```
Adapt the database connection and password encryption setttings in the .env.dev, .env.test, and .env.prod files to match your setup.
```env
DATABASE_HOST=localhost
DATABASE_NAME=dev
DATABASE_USER=postgres
DATABASE_PASSWORD=passwoord
DATABASE_PORT=5432
DATABASE_SYNCHRONIZE=false
BCRYPT_SALT_ROUNDS=14
```
Run database migrations/initialization scripts, and start the development server:
```bash
npm run start:dev
```
### 3. Front-End Configuration

Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```
## Testing & CI/CD
OmniStore implements automated testing to ensure stability, reliability, and code quality.
Running Tests Locally

Backend Tests:
Run unit and end-to-end (e2e) tests inside the backend folder:
```bash
npm run test
npm run test:e2e
```
### GitHub Actions (CI)

The repository features an integrated GitHub Actions CI pipeline. On every push or pull request to the main branches, the workflow handles:

1. Automated setup of the Node.js runtime environment.

1. Caching and installing project dependencies.

1. Executing the comprehensive test suite to prevent regressions.

The configuration can be inspected in .github/workflows/main.yml.

## RoadMap & Future Scope (TODOs)
- [ ] Dockerization: Containerize both Front-End and Back-End applications utilizing Dockerfile configs and orchestrate multi-container deployment via docker-compose.
- [ ] Enhanced Security: Implement additional security measures such as rate limiting and advanced logging for suspicious activities.
- [ ] Automatic Cloud Deployment: Build continuous deployment (CD) pipelines through GitHub Actions to automatically roll out updates to a cloud provider (e.g., AWS, Render, DigitalOcean).
- [ ] Advanced User Management: Introduce role-based access control (RBAC) to allow for different user permissions and administrative capabilities.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details