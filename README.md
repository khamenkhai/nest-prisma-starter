# NestJS Prisma Starter Template

A production-ready [NestJS](https://github.com/nestjs/nest) starter template featuring Prisma, PostgreSQL, JWT Authentication, Role-Based Access Control (RBAC), Winston Logging, Swagger/Scalar API Documentation, and full Docker integration.

---

## 🚀 Features & Modules

- **Core**: NestJS 11+, TypeScript 5+, Prisma 0.3+.
- **Database**: PostgreSQL with Prisma migrations.
- **Security**:
  - JWT Authentication (Passport.js).
  - Role-Based Access Control (RBAC).
  - Throttling (Rate Limiting).
  - Helmet (Security headers) & CORS enabled.
- **Documentation**:
  - Swagger UI: `http://localhost:3000/swagger`
  - Scalar UI: `http://localhost:3000/reference`
- **Logging**: Advanced logging with Winston (Winston Daily Rotate File).
- **Validation**: Global Pipe with `class-validator` and `class-transformer`.
- **Docker**: Full Docker Compose setup for local development.

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) & Docker Compose
- [npm](https://www.npmjs.com/)

### 2. Environment Setup

Copy the example environment file and update the values:

```bash
cp env_example .env
```

> [!IMPORTANT]
> Change `DB_HOST` to `db` if running with Docker, or `localhost` if running Postgres locally.

### 3. Running the Application

#### **Using Docker (Recommended)**

The fastest way to get everything running (App + Postgres):

```bash
docker compose up --build
```

- API: `http://localhost:3000`
- Database: `localhost:5432`

#### **Local Development**

```bash
# Install dependencies
npm install

# Start in watch mode
npm run start:dev
```

---

## 📦 Project Structure

```text
src/
├── common/             # Global modules (Logger, Middlewares)
├── database/           #
├── modules/            # Domain modules
│   ├── auth/           # Login, JWT, Authentication logic
│   ├── users/          # User management & Roles
│   └── todo/           # CRUD example with Todo entity
├── main.ts             # Application entry point
└── app.module.ts       # Root module
```

---

## 🏗️ Database Migrations

Since we use Docker, run migrations through the container to ensure environment consistency.

### **Generate a Migration**

Automatically detect schema changes in your entities:

```bash
docker exec -it nest-api npm run migration:generate --name=AddMyNewField
```

### **Run Pending Migrations**

```bash
docker exec -it nest-api npm run migration:run
```

### **Revert Last Migration**

```bash
docker exec -it nest-api npm run migration:revert
```

---

## 📝 API Endpoints

| Method | Path                 | Description      | Access |
| :----- | :------------------- | :--------------- | :----- |
| `GET`  | `/`                  | Health Check     | Public |
| `POST` | `/api/auth/login`    | User Login       | Public |
| `GET`  | `/api/users/profile` | Get current user | JWT    |
| `GET`  | `/api/todo`          | List Todos       | JWT    |

---

---

## ⚖️ License

This project is [UNLICENSED](LICENSE).
