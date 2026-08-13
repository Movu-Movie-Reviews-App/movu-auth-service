# Auth Service

Authentication microservice for the Movu platform. Handles user registration, login, session/token validation, and password reset flows. Communicates exclusively over NATS as part of the Movu microservices architecture — it has no public HTTP surface of its own; all client traffic reaches it through the [client-gateway](../client-gateway).

## Tech stack

- [NestJS](https://nestjs.com/) 11 (microservice mode)
- [NATS](https://nats.io/) transport (`@nestjs/microservices`)
- [TypeORM](https://typeorm.io/) + PostgreSQL (`pg`)
- [JWT](https://github.com/nestjs/jwt) for access tokens
- `bcrypt` for password hashing
- `class-validator` / `class-transformer` for DTO validation
- `Joi` for environment variable validation

## Architecture

The service registers as a NATS microservice (no HTTP listener) and exposes message patterns consumed by the client-gateway. On successful registration it publishes/calls into the [user-service](../user-service) to create the corresponding user profile.

```
client-gateway  --(NATS)-->  auth-service  --(NATS)-->  user-service
                                   |
                                   v
                               auth-db (PostgreSQL)
```

## Message patterns

| Pattern | Description |
|---|---|
| `auth.register` | Creates a new account and triggers user profile creation |
| `auth.login` | Validates credentials and issues a JWT |
| `auth.check-status` | Validates a JWT and returns the current user/session |
| `auth.request-password-reset` | Generates and sends a password reset verification code |
| `auth.reset-password` | Verifies the reset code and updates the password |

## Requirements

- Node.js 21+
- Docker & Docker Compose (recommended)
- A running PostgreSQL instance and NATS server (provided via Docker Compose)

## Environment variables

This service reads its configuration from environment variables (see `src/auth/config/envs.ts` for validation rules). When run via the root `docker-compose.yml`, these are supplied automatically from the repo-level `.env` file.

| Variable | Description |
|---|---|
| `PORT` | Port the service reports as running on (informational; NATS transport has no HTTP port) |
| `DB_HOST` | PostgreSQL host |
| `AUTH_DB_PORT` | PostgreSQL port |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `AUTH_DB_NAME` | PostgreSQL database name |
| `NATS_SERVERS` | Comma-separated list of NATS server URLs |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Access token expiration (e.g. `1d`) |

## Running the service

### With Docker Compose (recommended)

This service is designed to run as part of the full Movu stack. From the repository root:

```bash
cp .env.template .env
# fill in the required values in .env
docker compose up auth-service auth-db nats-server
```

Or start the entire stack:

```bash
docker compose up
```

### Standalone (local development)

```bash
npm install
```

Create a `.env` file in this directory with the variables listed above, then:

```bash
npm run start:dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run start` | Start the service |
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start in watch mode with the debugger attached |
| `npm run start:prod` | Run the compiled build (`dist/main`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Lint and auto-fix source files |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage report |

## Project structure

```
src/
├── auth/
│   ├── auth.controller.ts     # NATS message pattern handlers
│   ├── auth.service.ts        # Business logic
│   ├── config/                # Environment variable validation
│   ├── dto/                   # Request payload validation
│   └── entities/               # TypeORM entities (user-auth, verification-code)
├── infrastructure/
│   └── messaging/
│       └── user-client/       # NATS client module for calling user-service
├── app.module.ts
└── main.ts
```
