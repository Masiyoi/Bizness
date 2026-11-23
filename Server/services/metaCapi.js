const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/db');
const { sendTikTokEvent } = require('./tiktokEvents');

const PIXEL_ID = process.env.META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
// Meta matches on digits-only, country-code-first numbers (e.g. 254712345678).
const normalizePhone = (p) => {
  if (!p) return undefined;
  let d = String(p).replace(/\D/g, '');
  if (d.startsWith('0')) d = '254' + d.slice(1);
  else if (d.length === 9) d = '254' + d;
  return d || undefined;
};
const API_VERSION = 'v26.0';
// Reads a cookie from req.cookies if cookie-parser is mounted, else from the raw Cookie header.
const cookieFrom = (req, name) => {
  if (req?.cookies?.[name]) return req.cookies[name];
  const raw = req?.headers?.cookie;
  if (!raw) return undefined;
  const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  try { return m ? decodeURIComponent(m[1]) : undefined; } catch { return m ? m[1] : undefined; }
};
// Builds a Click ID (fbc) from an fbclid in the URL when no _fbc cookie is available.
// Preserve fbclid case exactly; Meta treats it as case-sensitive.
const fbcFromUrl = (url) => {
  try {
    const id = new URL(url).searchParams.get('fbclid');
    return id ? `fb.1.${Date.now()}.${id}` : undefined;
  } catch { return undefined; }
};

const hash = (val) =>
  val ? crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex') : undefined;
// City / zip / country: lowercase and strip spaces + punctuation before hashing (Meta's normalization rule).
const hashNorm = (val) => {
  const n = String(val ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return n ? hash(n) : undefined;
};

/**
 * Sends a server-side event to Meta's Conversions API.
 *
 * @param {string} eventName   e.g. 'Purchase', 'AddToCart', 'ViewContent', 'InitiateCheckout'
 * @param {string} eventId     Dedup key — must match the client-side fbq() event_id if you
 *                             ever also fire this event via the browser Pixel, or Meta will
 *                             count it twice.
 * @param {object} [req]       Express request object, when available. Supplies IP,
 *                             user-agent, and _fbc/_fbp cookies automatically. Pass this
 *                             whenever the call is triggered directly by the customer's
 *                             HTTP request (ViewContent, AddToCart, InitiateCheckout).
 *                             Omit it for webhook-triggered events (e.g. a payment provider
 *                             callback) where there is no customer request in scope — in
 *                             that case pass fbc/fbp explicitly via userData instead (see
 *                             below), captured earlier in the flow and persisted.
 * @param {object} [userData]  { email, phone, fbc, fbp }. email/phone are hashed
 *                             automatically — always pass them RAW, never pre-hashed.
 *                             phone should already be normalized (digits only, country
 *                             code, no leading +) before it reaches this function — see
 *                             formatPhone() in payheroController.js for the pattern.
 *                             fbc/fbp here take priority over req.cookies, since a
 *                             webhook-triggered call has no cookies of its own but may
 *                             have been handed fbc/fbp that were captured client-side
 *                             earlier and persisted (e.g. in shipping_meta).
 * @param {object} [customData] e.g. { currency, value, content_ids, content_type }
 */
const sendMetaEvent = async ({ eventName, eventId, req, userData = {}, customData = {} }) => {
  if (!PIXEL_ID || !TOKEN) {
    console.error('Meta CAPI not configured — missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN');
    return;
  }

  // Fill in email/phone from the users table when the caller didn't have them
  // (req.user only holds { id, role }, and webhook events have no req at all).
  const lookupId = userData.externalId ?? req?.user?.id;
  if (lookupId && (!userData.email || !userData.phone)) {
    try {
      const u = await db.query('SELECT email, phone FROM users WHERE id = $1', [lookupId]);
      if (u.rows[0]) {
        userData = {
          ...userData,
          email: userData.email || u.rows[0].email,
          phone: userData.phone || u.rows[0].phone,
        };
      }
    } catch (e) {
      console.error('Meta CAPI user lookup failed:', e.message);
    }
  }
  // Callers pass variantItems [{ product_id, color, size }]; map them to the feed's catalog ids.
  if (customData.variantItems) {
    const { variantItems, ...rest } = customData;
    const resolved = await Promise.all(
      variantItems.map((i) => resolveContentId(i.product_id, i.color, i.size))
    );
    const allExact = resolved.every((r) => r.contentType === 'product');
    customData = {
      ...rest,
      content_ids: allExact ? resolved.map((r) => r.id) : variantItems.map((i) => String(i.product_id)),
      content_type: allExact ? 'product' : 'product_group',
    };
  }
  // Mirror to TikTok Events API (same event_id for dedup). Never throws.
  sendTikTokEvent({ eventName, eventId, req, userData, customData }).catch(() => {});
  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: userData.eventSourceUrl || req?.headers?.referer || 'https://www.plugwalk.co',
      user_data: {
        em: hash(userData.email),
        ph: hash(normalizePhone(userData.phone)),
        external_id: hash(userData.externalId ?? req?.user?.id),
        fn: hash(userData.firstName),
        ln: hash(userData.lastName),
        ct: hashNorm(userData.city),
        zp: hashNorm(userData.zip),
        country: hashNorm(userData.country || 'ke'),
        client_ip_address: userData.ip || req?.ip,
        client_user_agent: userData.userAgent || req?.headers?.['user-agent'],
        // userData.fbc/fbp win over req.cookies — needed for webhook-triggered
        // events (e.g. PayHero payment callback) that have no cookies of their
        // own but were handed fbc/fbp captured earlier client-side.
        fbc: userData.fbc || cookieFrom(req, '_fbc') || req?.headers?.['x-fbc'] || req?.body?.fbc
             || fbcFromUrl(userData.eventSourceUrl || req?.headers?.referer),
        fbp: userData.fbp || cookieFrom(req, '_fbp') || req?.headers?.['x-fbp'] || req?.body?.fbp,
      },
      custom_data: customData,
    }],
    // Set META_TEST_EVENT_CODE in .env while verifying in Events Manager →
    // Test Events. Remove/unset it once confirmed working in production —
    // events sent with a test_event_code still count, but you want the real
    // Test Events tab quiet again once you've verified everything.
    ...(process.env.META_TEST_EVENT_CODE && { test_event_code: process.env.META_TEST_EVENT_CODE }),
  };

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      payload,
      { params: { access_token: TOKEN } }
    );
    console.log(`✅ Meta CAPI: ${eventName} sent (event_id=${eventId})`, data);
    if (eventName === 'Purchase' && userData.orderId && userData.adId && userData.adTouchTs) {
      queueAttribution({
        orderId: userData.orderId,
        purchaseEventId: eventId,
        purchaseEventTime: payload.data[0].event_time,
        orderValue: customData.value,
        currency: customData.currency,
        adId: userData.adId,
        touchpointTs: userData.adTouchTs,
        userData: payload.data[0].user_data,
        eventSourceUrl: payload.data[0].event_source_url,
      }).catch((e) => console.error('queueAttribution failed:', e.message));
    }
    return data;
  } catch (err) {
    console.error(`❌ Meta CAPI send failed for ${eventName} (event_id=${eventId}):`, err.response?.data || err.message);
  }
};

// Resolves the catalog item id the product feed uses for a cart/order line.
// Feed ids: "<productId>-<variantId>" for products with variants, "<productId>" otherwise.
// Falls back to the parent id with product_group if no variant matches.
const resolveContentId = async (productId, color, size) => {
  const pid = String(productId);
  try {
    const { rows } = await db.query(
      'SELECT id, color, size FROM product_variants WHERE product_id = $1',
      [productId]
    );
    if (!rows.length) return { id: pid, contentType: 'product' };
    const norm = (s) => String(s ?? '').trim().toLowerCase();
    const hit = rows.find((v) => norm(v.color) === norm(color) && norm(v.size) === norm(size));
    if (hit) return { id: pid + '-' + hit.id, contentType: 'product' };
    // Single-variant product added without a color/size: the only variant is unambiguous.
    if (rows.length === 1 && !color && !size) return { id: pid + '-' + rows[0].id, contentType: 'product' };
  } catch (e) {
    console.error('Meta content id lookup failed:', e.message);
  }
  console.warn(`Meta content id fallback: product ${pid} has variants but none match color="${color}" size="${size}" -> sending product_group`);
  return { id: pid, contentType: 'product_group' };
};
// Maps a saved shipping object to the userData fields sendMetaEvent hashes.
// Pickup / CBD / environs orders are all in Nairobi; other-county orders use the county.
const shippingToUserData = (shipping = {}, deliveryZone) => {
  const parts = String(shipping.firstName || '').trim().split(/\s+/).filter(Boolean);
  const nairobiZones = ['pickup', 'cbd', 'environs'];
  return {
    firstName: parts[0],
    lastName: shipping.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : undefined),
    city: shipping.city || (nairobiZones.includes(deliveryZone) ? 'Nairobi' : shipping.county),
    zip: shipping.postalCode || shipping.zip,
  };
};
// ── Custom Attribution Source (AppendAttribution) ─────────────────────────
// Queue one row per Purchase that came from a Meta ad click.
const queueAttribution = async ({ orderId, purchaseEventId, purchaseEventTime, orderValue, currency, adId, touchpointTs, userData, eventSourceUrl, share = 1 }) => {
  if (!orderId || !adId || !touchpointTs) return;
  await db.query(
    `INSERT INTO meta_attribution_queue
       (order_id, purchase_event_id, purchase_event_time, order_value, currency,
        ad_id, touchpoint_ts, attribution_share, user_data, event_source_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (order_id, ad_id) DO NOTHING`,
    [orderId, purchaseEventId, purchaseEventTime, orderValue, currency || 'KES',
     String(adId), touchpointTs, share, JSON.stringify(userData || {}), eventSourceUrl || null]
  );
};
// Sends due rows (>= send_after, still inside the 48h window). Call every few minutes.
const flushAttributionQueue = async () => {
  if (!PIXEL_ID || !TOKEN) return;
  await db.query(
    `UPDATE meta_attribution_queue SET status = 'expired', updated_at = now()
      WHERE status = 'pending' AND to_timestamp(purchase_event_time) + interval '47 hours' <= now()`
  );
  const { rows } = await db.query(
    `UPDATE meta_attribution_queue SET attempts = attempts + 1, updated_at = now()
      WHERE id IN (
        SELECT id FROM meta_attribution_queue
         WHERE status = 'pending' AND send_after <= now()
         ORDER BY created_at LIMIT 50 FOR UPDATE SKIP LOCKED)
      RETURNING *`
  );
  for (const r of rows) {
    const payload = {
      data: [{
        event_name: 'AppendAttribution',
        event_time: Math.floor(Date.now() / 1000),
        event_id: r.passback_event_id,
        action_source: 'website',
        event_source_url: r.event_source_url || 'https://www.plugwalk.co',
        attribution_data: {
          ad_id: String(r.ad_id),
          touchpoint_ts: Number(r.touchpoint_ts),
          attribution_share: Number(r.attribution_share),
          attribution_value: Number(r.attribution_value),
        },
        original_event_data: {
          event_name: 'Purchase',
          event_time: Number(r.purchase_event_time),
        },
        custom_data: { currency: r.currency },
        user_data: r.user_data,
      }],
      ...(process.env.META_TEST_EVENT_CODE && { test_event_code: process.env.META_TEST_EVENT_CODE }),
    };
    try {
      await axios.post(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`, payload, { params: { access_token: TOKEN } });
      await db.query(`UPDATE meta_attribution_queue SET status='sent', sent_at=now(), last_error=NULL, updated_at=now() WHERE id=$1`, [r.id]);
      console.log(`✅ Meta AppendAttribution sent (order ${r.order_id}, ad ${r.ad_id})`);
    } catch (err) {
      const msg = JSON.stringify(err.response?.data || err.message).slice(0, 500);
      await db.query(
        `UPDATE meta_attribution_queue SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
                last_error=$2, send_after = now() + interval '15 minutes', updated_at=now() WHERE id=$1`,
        [r.id, msg]
      );
      console.error(`❌ Meta AppendAttribution failed (order ${r.order_id}):`, msg);
    }
  }
};
// Flush queued AppendAttribution events every 5 minutes.
setInterval(() => {
  flushAttributionQueue().catch((e) => console.error('flushAttributionQueue failed:', e.message));
}, 5 * 60 * 1000).unref();
module.exports = { sendMetaEvent, resolveContentId, shippingToUserData, queueAttribution, flushAttributionQueue };