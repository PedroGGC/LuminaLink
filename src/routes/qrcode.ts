import { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { getLinkBySlug } from '../services/link.service.js';

export async function qrcodeRoutes(fastify: FastifyInstance) {
  fastify.get('/api/links/:shortCode/qr', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const qrDataUrl = await QRCode.toDataURL(link.shortUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    reply.header('Content-Type', 'image/png');
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    return reply.send(Buffer.from(base64Data, 'base64'));
  });
}