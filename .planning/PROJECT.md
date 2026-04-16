# Encurtador de Links

## Project Context

**Name:** Encurtador de Links (URL Shortener)  
**Type:** Backend API Service  
**Description:** A URL shortening service with analytics, allowing users to create short links, track clicks, and manage their links.
**Tech Stack:** TypeScript, Fastify, Prisma, Redis, Docker

## Goals
- Create a reliable URL shortening service
- Provide click analytics with referrer, device, and geolocation
- Enable link management (edit, delete, expire)
- Support custom short codes (user-defined slugs)
- Cache frequently accessed data with Redis (Fast Path)
- Protect links with password or expiration rules
- Prevent malicious URLs (blacklist)
- Rate limit API to prevent abuse

## Non-Goals
- User authentication (future phase)
- Frontend (future phase)
- Advanced A/B testing

## Timeline

| Phase | Focus |
|-------|-------|
| Phase 1 | Core API (shortening, custom slugs, QR, UTM, preview) |
| Phase 2 | Link Management (CRUD, expiration, password, blacklist) |
| Phase 3 | Analytics (async clicks, geo, device, referrer) |
| Phase 4 | Redis Caching (Fast Path redirect, cache analytics) |
| Phase 5 | Production Ready (rate limiting, Swagger, validation) |