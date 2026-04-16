# Requirements - Encurtador de Links

## Core Features

### F1: URL Shortening

- **F1.1** Create short URL from long URL
- **F1.2** Generate unique short codes (6-8 characters)
- **F1.3** Custom short code support (user-defined slugs)
- **F1.4** Return short URL in response
- **F1.5** QR Code generation for short URLs
- **F1.6** UTM parameter builder (source, medium, campaign)

### F2: URL Redirection

- **F2.1** Redirect short URL to original URL
- **F2.2** Track click statistics on redirect
- **F2.3** Handle invalid/expired URLs gracefully
- **F2.4** Optional interstitial page ("Você está sendo redirecionado para...")
- **F2.5** Password protection: require password before redirect

### F3: Link Management

- **F3.1** Get original URL by short code
- **F3.2** Update original URL (edit link)
- **F3.3** Delete short link
- **F3.4** Set expiration date (expiresAt)
- **F3.5** Set expiration by max click count
- **F3.6** Blacklist domains at creation time (prevent phishing)

### F4: Analytics

- **F4.1** Count total clicks per short URL
- **F4.2** Track clicks over time
- **F4.3** Referrer tracking (Twitter, Facebook, e-mail, etc.)
- **F4.4** Device/browser statistics (User-Agent parsing)
- **F4.5** Geolocation (country/city via GeoIP MaxMind)
- **F4.6** Async click counting via Redis + Worker (batch inserts)

### F5: Caching (Redis)

- **F5.1** Cache slug -> original URL mapping (Fast Path)
- **F5.2** Cache analytics data
- **F5.3** TTL-based cache expiration
- **F5.4** Rate limiting per IP for link creation

### F6: Security

- **F6.1** Rate limiting (Redis-based per IP)
- **F6.2** Domain blacklist for malicious URLs
- **F6.3** Request validation (Zod)

## API Endpoints

| Method | Endpoint                    | Description                    |
| ------ | --------------------------- | ------------------------------ |
| POST   | /api/links                  | Create short URL               |
| GET    | /api/links/:shortCode       | Get link info                  |
| PUT    | /api/links/:shortCode       | Update link                    |
| DELETE | /api/links/:shortCode       | Delete link                    |
| GET    | /:shortCode                 | Redirect to original           |
| GET    | /:shortCode/preview         | Show interstitial page         |
| POST   | /:shortCode/unlock          | Unlock password-protected link |
| GET    | /api/links/:shortCode/stats | Get click stats                |
| GET    | /api/links/:shortCode/qr    | Get QR code image              |

## Data Models

### Link

- id: UUID
- shortCode: string (unique)
- originalUrl: string
- customCode: boolean
- hasPassword: boolean
- passwordHash: string (nullable)
- expiresAt: DateTime (nullable)
- maxClicks: integer (nullable)
- clickCount: integer
- showPreview: boolean
- isActive: boolean
- createdAt: DateTime
- updatedAt: DateTime

### Click

- id: UUID
- linkId: UUID (FK)
- clickedAt: DateTime
- referrer: string (optional)
- userAgent: string (optional)
- ipAddress: string (optional)
- country: string (optional)
- city: string (optional)
- device: string (optional) // mobile, desktop
- os: string (optional) // iOS, Android, Windows, etc.

## Acceptance Criteria

1. Short URL creation returns valid short code
2. Custom slugs accepted (alphanumeric, hyphens)
3. Redirect preserves original URL destination
4. Invalid short code returns 404
5. Expired links (by date or click count) show error
6. Password-protected links show unlock page
7. Preview page shows "Redirecting to..." before redirect
8. Analytics return accurate click counts with referrer/device/geo
9. Redis caching reduces database load (>80% hit rate)
10. Rate limiting blocks excessive requests per IP
11. Malicious domains blocked at creation
12. QR Code generated for any short URL
13. API documented with Swagger
14. Docker Compose runs all services
15. API handles concurrent requests
