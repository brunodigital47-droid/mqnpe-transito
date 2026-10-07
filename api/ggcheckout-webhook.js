'use strict';

const { createHash, timingSafeEqual } = require('node:crypto');
const { isIP } = require('node:net');

// Vercel maps api/ggcheckout-webhook.js to /api/ggcheckout-webhook.
const MAX_BYTES = 1024 * 1024;
const META_URL = 'https://graph.facebook.com/v26.0/1302813676254181/events';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function hash(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function authorized(req) {
  // Optional shared secret supported by GGCheckout's documented webhook headers.
  const secret = process.env.GGCHECKOUT_WEBHOOK_SECRET;
  if (!secret) return true;
  const supplied = req.headers['x-secret'] || text(req.headers.authorization).replace(/^Bearer\s+/i, '');
  return typeof supplied === 'string' && timingSafeEqual(Buffer.from(hash(supplied)), Buffer.from(hash(secret)));
}

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Method Not Allowed' });
  }
  if (!authorized(req)) return reply(res, 401, { error: 'Unauthorized' });
  const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json' && !/^application\/[\w.+-]+\+json$/.test(contentType)) {
    return reply(res, 415, { error: 'Content-Type must be application/json' });
  }

  let payload;
  try {
    // Vercel supplies parsed req.body for JSON; no schema assumptions are made.
    if (req.body !== undefined && !Buffer.isBuffer(req.body)) {
      payload = req.body;
      if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_BYTES) {
        return reply(res, 413, { error: 'Payload too large' });
      }
    } else {
      let raw;
      if (Buffer.isBuffer(req.body)) raw = req.body;
      else {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += bytes.length;
          if (size > MAX_BYTES) return reply(res, 413, { error: 'Payload too large' });
          chunks.push(bytes);
        }
        raw = Buffer.concat(chunks);
      }
      if (raw.length > MAX_BYTES) return reply(res, 413, { error: 'Payload too large' });
      payload = JSON.parse(raw.toString('utf8'));
    }
  } catch (_) {
    // Do not log parse errors: they can contain fragments of confidential data.
    return reply(res, 400, { error: 'Invalid JSON' });
  }

  if (!object(payload) || typeof payload.event !== 'string' || !object(payload.payment)) {
    return reply(res, 400, { error: 'Invalid webhook payload' });
  }
  if (payload.event !== 'pix.paid' || payload.payment.status !== 'paid') {
    return reply(res, 200, { received: true, ignored: true });
  }

  const { payment } = payload;
  if (!text(payment.id) || typeof payment.amount !== 'number' || !Number.isFinite(payment.amount) || payment.amount < 0) {
    return reply(res, 400, { error: 'Invalid payment id or amount' });
  }
  const customer = object(payload.customer) ? payload.customer : {};
  const userData = {};
  const email = text(customer.email).toLowerCase();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) userData.em = [hash(email)];
  // GG documents an international phone including country code. Do not guess a country.
  const phone = text(customer.phone).replace(/\D/g, '').replace(/^0+/, '');
  if (/^[1-9]\d{6,14}$/.test(phone)) userData.ph = [hash(phone)];
  const ip = text(customer.ip);
  if (isIP(ip)) userData.client_ip_address = ip;
  if (!userData.em && !userData.ph) {
    return reply(res, 400, { error: 'Valid customer email or international phone required' });
  }

  const token = process.env.META_CAPI_TOKEN;
  if (!token || !token.trim()) {
    console.error('[ggcheckout-webhook] meta_token_missing');
    return reply(res, 503, { error: 'Conversions service not configured' });
  }
  // pix.paid's documented example uses decimal currency amounts (97.00).
  // Do not apply the cents conversion from the separate payment.paid API schema.
  const customData = { currency: 'BRL', value: payment.amount, order_id: payment.id };
  const product = object(payload.product) ? payload.product : {};
  if (text(product.id)) {
    customData.content_ids = [product.id];
    customData.content_type = 'product';
  }
  if (text(product.title)) customData.content_name = product.title;
  if (text(product.type)) customData.product_type = product.type;
  for (const key of UTM_KEYS) {
    if (text(payload[key])) customData[key] = payload[key];
  }
  const parsedTime = typeof payload.createdAt === 'string' ? Date.parse(payload.createdAt) : NaN;
  const event = {
    event_name: 'Purchase',
    event_time: Number.isFinite(parsedTime) ? Math.floor(parsedTime / 1000) : Math.floor(Date.now() / 1000),
    event_id: 'ggcheckout_' + payment.id,
    action_source: 'website',
    event_source_url: 'https://www.defesademulta.online/',
    user_data: userData,
    custom_data: customData
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(META_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ data: [event] }),
      signal: controller.signal,
      redirect: 'error'
    });
    const result = await response.json();
    if (!response.ok || result?.error || result?.events_received !== 1) {
      // Do not log Meta messages, payloads, identifiers or exception objects: they may contain PII.
      console.error('[ggcheckout-webhook] meta_rejected', {
        status: response.status,
        code: Number.isInteger(result?.error?.code) ? result.error.code : null,
        subcode: Number.isInteger(result?.error?.error_subcode) ? result.error.error_subcode : null
      });
      return reply(res, 502, { error: 'Conversions service rejected event' });
    }
    console.log('[ggcheckout-webhook] purchase_accepted');
    return reply(res, 200, { received: true });
  } catch (_) {
    console.error('[ggcheckout-webhook] meta_request_failed');
    return reply(res, controller.signal.aborted ? 504 : 502, { error: 'Conversions service unavailable' });
  } finally {
    clearTimeout(timeout);
  }
};
