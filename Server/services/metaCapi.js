const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

const hash = (val) =>
  val ? crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex') : undefined;

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

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: req?.headers?.referer || 'https://lukuprime.shop',
      user_data: {
        em: hash(userData.email),
        ph: hash(userData.phone),
        client_ip_address: req?.ip,
        client_user_agent: req?.headers?.['user-agent'],
        // userData.fbc/fbp win over req.cookies — needed for webhook-triggered
        // events (e.g. PayHero payment callback) that have no cookies of their
        // own but were handed fbc/fbp captured earlier client-side.
        fbc: userData.fbc || req?.cookies?._fbc,
        fbp: userData.fbp || req?.cookies?._fbp,
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
    return data;
  } catch (err) {
    console.error(`❌ Meta CAPI send failed for ${eventName} (event_id=${eventId}):`, err.response?.data || err.message);
  }
};

module.exports = { sendMetaEvent };