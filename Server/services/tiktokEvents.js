// TikTok Events API (server-side). Called from sendMetaEvent so every Meta event is mirrored.
const crypto = require('crypto');
const ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const hashEmail = (e) => (e ? sha256(String(e).trim().toLowerCase()) : undefined);
// E.164 with leading +, then hash (TikTok's rule)
const hashPhone = (p) => {
  if (!p) return undefined;
  let d = String(p).replace(/\D/g, '');
  if (!d) return undefined;
  if (d.startsWith('0')) d = '254' + d.slice(1);
  else if (d.length === 9) d = '254' + d;
  return sha256('+' + d);
};
const sendTikTokEvent = async ({ eventName, eventId, req, userData = {}, customData = {} }) => {
  try {
    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const token = process.env.TIKTOK_ACCESS_TOKEN;
    if (!pixelId || !token) return;
    const ids = Array.isArray(customData.content_ids) ? customData.content_ids : [];
    const extId = userData.externalId ?? req?.user?.id;
    const body = {
      event_source: 'web',
      event_source_id: pixelId,
      data: [{
        event: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user: {
          email: hashEmail(userData.email),
          phone: hashPhone(userData.phone),
          external_id: extId ? sha256(extId) : undefined,
          ip: userData.ip || req?.ip,
          user_agent: userData.userAgent || req?.headers?.['user-agent'],
          ttclid: userData.ttclid || req?.cookies?.ttclid,
          ttp: userData.ttp || req?.cookies?._ttp,
        },
        properties: {
          currency: customData.currency || 'KES',
          value: customData.value,
          content_type: customData.content_type === 'product_group' ? 'product_group' : 'product',
          contents: ids.map((id) => ({ content_id: String(id), content_name: customData.content_name })),
        },
        page: {
          url: userData.eventSourceUrl || req?.headers?.referer || 'https://www.plugwalk.co',
        },
      }],
    };
    if (process.env.TIKTOK_TEST_EVENT_CODE) body.test_event_code = process.env.TIKTOK_TEST_EVENT_CODE;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json().catch(() => ({}));
    if (json.code !== 0) console.warn(`TikTok CAPI rejected ${eventName} (event_id=${eventId}):`, json.code, json.message);
    else console.log(`TikTok CAPI: ${eventName} sent (event_id=${eventId})`);
  } catch (err) {
    console.warn('TikTok CAPI send failed:', err.message);
  }
};
module.exports = { sendTikTokEvent };