import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLinkBySlug, incrementClickCount } from '../services/link.service.js';
import { createClick } from '../services/click.service.js';
import { lookupGeo } from '../services/geo.service.js';

function parseDevice(userAgent: string | undefined): { device: string; os: string } {
  const ua = (userAgent || '').toLowerCase();
  let device = 'desktop';
  let os = 'unknown';

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    device = 'mobile';
  }

  if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  return { device, os };
}

export async function redirectRoutes(fastify: FastifyInstance) {
  fastify.get('/:shortCode', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shortCode } = request.params as { shortCode: string };

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const now = Date.now();
    if (link.expiresAt && link.expiresAt < now) {
      return reply.status(410).send({ error: 'Link expired' });
    }

    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      return reply.status(410).send({ error: 'Link clicks exhausted' });
    }

    if (link.hasPassword) {
      const unlocked = request.cookies[`unlocked_${shortCode}`];
      if (unlocked !== 'true') {
        return reply.redirect(`/${shortCode}/locked`, 302);
      }
    }

    await incrementClickCount(shortCode);

    const userAgent = request.headers['user-agent'] as string | undefined;
    const referrer = request.headers['referer'] as string | undefined;
    const ipAddress = (request.ip === '::1' || request.ip === '127.0.0.1' ? '' : request.ip) || request.headers['x-forwarded-for'] as string || '';
    const { device, os } = parseDevice(userAgent);

    const geo = await lookupGeo(ipAddress);

    await createClick({
      linkId: link.id,
      referrer,
      userAgent,
      ipAddress,
      country: geo.country,
      city: geo.city,
      device,
      os,
    });

    reply.redirect(link.originalUrl, 302);
  });

  fastify.get('/:shortCode/locked', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shortCode } = request.params as { shortCode: string };

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Protected Link</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Geist:wght@400;500;600&display=swap');
    body { 
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100dvh; 
      margin: 0; 
      background: #F9F8F6; /* Warm coffee bone background */
      color: #111111;
    }
    .container { 
      background: #FFFFFF; 
      padding: 48px 40px; 
      border-radius: 8px; 
      border: 1.5px solid #111111;
      box-shadow: 4px 4px 0px 0px rgba(17, 17, 17, 1);
      text-align: center; 
      width: 100%;
      max-width: 400px;
    }
    h1 { 
      font-family: 'Newsreader', serif;
      font-size: 28px;
      font-weight: 600;
      color: #111111; 
      margin-top: 0;
      margin-bottom: 8px; 
      letter-spacing: -0.02em;
    }
    p {
      color: #787774;
      font-size: 15px;
      margin-bottom: 32px;
    }
    .input-group {
      position: relative;
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border: 1.5px solid #EAEAEA;
      border-radius: 6px;
      padding: 4px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-group:focus-within {
      border-color: #111111;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    input { 
      flex: 1;
      padding: 10px 16px; 
      border: none;
      background: transparent;
      font-size: 15px;
      color: #111111;
      outline: none;
    }
    input::placeholder {
      color: #A0A0A0;
    }
    button { 
      padding: 10px 20px; 
      background: #111111; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
      font-weight: 500;
      font-size: 14px;
      transition: transform 0.2s, background 0.2s;
    }
    button:hover { 
      background: #333333; 
    }
    button:active {
      transform: scale(0.96);
    }
    .error { 
      color: #D93025; 
      font-size: 13px;
      font-weight: 500;
      margin-top: 16px; 
      min-height: 20px;
    }
    .lock-icon {
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="lock-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <h1>Protected Link</h1>
    <p>Please enter the password to continue.</p>
    <form id="unlockForm" data-short-code="${shortCode}">
      <div class="input-group">
        <input type="password" id="password" placeholder="Password" required autofocus>
        <button type="submit">Unlock</button>
      </div>
    </form>
    <div class="error" id="error"></div>
  </div>
  <script src="/unlock.js"></script>
</body>
</html>`;

    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  });
}