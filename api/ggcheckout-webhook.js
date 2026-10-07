'use strict';

// Diagnostic receiver only: does not validate payment or send Meta events.
// Vercel maps api/ggcheckout-webhook.js to /api/ggcheckout-webhook.
const MAX_BYTES = 1024 * 1024;
const SENSITIVE_KEY = /token|secret|password|passwd|authorization|cookie|api[-_]?key|private[-_]?key|signature|credential/i;

function redactPayload(payload) {
  return JSON.stringify(payload, (key, value) => {
    if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
    if (typeof value === 'string') {
      return value
        .replace(/\bBearer\s+[^\s"<>]+/gi, 'Bearer [REDACTED]')
        .replace(/([?&](?:access_token|token|secret|api_key|signature)=)[^&#\s]*/gi, '$1[REDACTED]');
    }
    return value;
  });
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

  // Only the JSON payload is logged. Never log request headers, URL or env vars.
  console.log('[ggcheckout-webhook] payload=' + redactPayload(payload));
  return reply(res, 200, { received: true });
};
