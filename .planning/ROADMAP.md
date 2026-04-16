# Roadmap - Encurtador de Links

## Phase 1: Core API
**Goal:** Basic URL shortening functionality

**Plans:** 7 plans in 2 wave(s)

### Plans
- [x] 01-01-PLAN.md — Initialize project foundation (Node.js, TypeScript, Fastify, Prisma, Docker)
- [x] 01-02-PLAN.md — Implement URL shortening core (POST/GET endpoints)
- [x] 01-03-PLAN.md — Implement redirect endpoint with click tracking
- [x] 01-04-PLAN.md — QR code generation
- [x] 01-05-PLAN.md — Interstitial/preview page for external links
- [x] 01-06-PLAN.md — UTM parameter builder
- [x] 01-07-PLAN.md — Unit tests for core functionality

**Success Criteria:** Can create short URL and redirect to original

---

## Phase 2: Link Management
**Goal:** Full CRUD operations and expiration

### Tasks
- [ ] Implement PUT /api/links/:shortCode
- [ ] Implement DELETE /api/links/:shortCode
- [ ] Add expiration date support (expiresAt)
- [ ] Add custom short code validation
- [ ] Handle expired links in redirect
- [ ] Links Expiráveis por Cliques: TTL based on max click count
- [ ] Proteção por Senha: Require password before redirect (interstitial page)
- [ ] Blacklist em Tempo Real: Block malicious domains at creation time
- [ ] Write integration tests

**Success Criteria:** All CRUD operations work correctly

---

## Phase 3: Analytics
**Goal:** Click tracking and statistics

### Tasks
- [ ] Create Click model
- [ ] Track clicks on redirect
- [ ] Implement GET /api/links/:shortCode/stats
- [ ] Add click aggregation queries
- [ ] Add referrer tracking (Twitter, Facebook, e-mail, etc.)
- [ ] Contagem Assíncrona: Queue clicks in Redis, use Worker to batch-insert to DB
- [ ] Geolocalização: Integrate GeoIP (MaxMind) for country/city
- [ ] Device Parsing: Parse User-Agent for mobile/desktop, iOS/Android

**Success Criteria:** Accurate click statistics available

---

## Phase 4: Redis Caching
**Goal:** Performance optimization

### Tasks
- [ ] Configure Redis connection
- [ ] Caching de Redirecionamento (Fast Path): Cache slug -> original URL mapping, fallback to Prisma
- [ ] Cache analytics data
- [ ] Implement cache invalidation
- [ ] Add cache TTL configuration

**Success Criteria:** Cache hit rate > 80% for popular URLs

---

## Phase 5: Production Ready
**Goal:** Production deployment setup

### Tasks
- [ ] Add health check endpoint
- [ ] Configure environment variables
- [ ] Add request validation (Zod)
- [ ] Add error handling middleware
- [ ] Set up logging
- [ ] Rate Limiting Severo: Redis-based rate limiter per IP for link creation
- [ ] Swagger API: Document routes with @fastify/swagger for developer API

**Success Criteria:** Ready for production deployment