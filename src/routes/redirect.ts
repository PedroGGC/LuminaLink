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

    const now = new Date();
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
    const ipAddress = (request.ip || request.headers['x-forwarded-for'] as string | undefined) || undefined;
    const { device, os } = parseDevice(userAgent);

    const geo = await lookupGeo(ipAddress || '');

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
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Protegido</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    h1 { color: #333; margin-bottom: 20px; }
    input { padding: 12px; border: 1px solid #ddd; border-radius: 6px; width: 200px; margin-bottom: 10px; }
    button { padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #5568d3; }
    .error { color: red; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Este link é protegido por senha</h1>
    <form id="unlockForm" data-short-code="${shortCode}">
      <input type="password" id="password" placeholder="Digite a senha" required>
      <br>
      <button type="submit">Desbloquear</button>
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