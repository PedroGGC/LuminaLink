# Phase 1 Context

## Decisions for Core API Implementation

### Database
- **PostgreSQL** via Docker Compose
- Prisma as ORM
- Schema defined in `prisma/schema.prisma`

### QR Code
- Use `qrcode` npm package
- Return as data URL PNG image

### Click Tracking (Phase 1)
- Simplified: record click count only
- Full analytics deferred to Phase 3

### Preview/Interstitial Page
- Server-rendered HTML via Fastify
- Template: `src/public/preview.html`
- Meta refresh redirect after 3 seconds
- Message: "Você está sendo redirecionado para..."

### API Framework
- Fastify with TypeScript
- Zod for validation

### File Structure
```
src/
  app.ts
  routes/
    links.ts
    redirect.ts
    preview.ts
    qrcode.ts
    utm.ts
  services/
    link.service.ts
  utils/
    slug.ts
    utm.ts
  public/
    preview.html
prisma/
  schema.prisma
tests/unit/
  slug.test.ts
  link.test.ts
```

### Next Steps
1. Create package.json with dependencies
2. Set up Docker Compose with PostgreSQL
3. Define Prisma schema
4. Implement endpoints