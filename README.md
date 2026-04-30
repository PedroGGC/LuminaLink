# Encurtador de Links

> A robust, high-performance URL shortening service with analytics, fast-path caching, and link management.

## Quick Start

The fastest way to get the project running locally is by using Docker to set up the environment, including the database and application server.

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- npm (or your preferred package manager)

### 1. Start the Environment

Run the entire application and database via Docker:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`.

### 2. Local Development (Alternative)

If you prefer running the application outside of Docker while using Docker just for the database:

```bash
# Start the Postgres and Redis databases
docker-compose up -d db redis

# Install dependencies
npm install

# Run database migrations
npx tsx src/db/migrate.ts

# Run the development server
npm run dev
```

## Features

- **URL Shortening:** Generate concise, easy-to-share links.
- **Fast Redirection:** High-performance redirection leveraging Redis caching (Fast Path) to minimize database lookups.
- **Link Management:** Dashboard to create, edit, and manage generated links.
- **Advanced Analytics:** Track clicks, geographical data, and user agents asynchronously via Redis queues.
- **Security:**
  - Redis-based rate limiting per IP.
  - Domain blacklist integration to prevent malicious URLs.
  - Strict request validation using Zod.
- **QR Code Generation:** Easily generate QR codes for your shortened links.
- **UTM Builder:** Integrated builder to add tracking parameters to external links.

## Technology Stack

- **Backend Framework:** Node.js, Fastify
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Caching & Queues:** Redis (ioredis)
- **Testing:** Vitest
- **Containerization:** Docker & Docker Compose

## Configuration

The service uses environment variables for configuration. Create a `.env` file in the root directory.

| Variable       | Description                  | Default                                               |
| -------------- | ---------------------------- | ----------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://shorten:shorten@localhost:5432/shorten` |
| `REDIS_URL`    | Redis connection string      | `redis://localhost:6379`                              |
| `PORT`         | Application server port      | `3000`                                                |

_(Note: When using `docker-compose`, the database credentials and URL are automatically configured.)_

## Scripts

- `npm run dev`: Starts the development server using `tsx`.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the production build.
- `npm run test`: Executes unit and integration tests using Vitest.

## Project Roadmap & Architecture

This project is built in structured phases using a Spec-Driven Development workflow:

1. **Core API:** Basic shortening and redirection logic.
2. **Link Management:** CRUD operations for URLs.
3. **Analytics:** Detailed click tracking and reporting.
4. **Redis Caching:** Performance optimization and asynchronous click counting.
5. **Frontend:** Implementation of the user interface.
6. **Production Ready:** Security hardening and final deployment preparations.

Detailed planning and context documents can be found in the `.planning/` directory.

## License

MIT
