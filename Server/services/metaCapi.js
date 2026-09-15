const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = 'v21.0';

const hash = (val) =>
  val ? crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex') : undefined;

const sendMetaEvent = async ({ eventName, eventId, req, userData = {}, customData = {} }) => {
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
        fbc: req?.cookies?._fbc,
        fbp: req?.cookies?._fbp,
      },
      custom_data: customData,
    }],
  };

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      payload,
      { params: { access_token: TOKEN } }
    );
    return data;
  } catch (err) {
    console.error('Meta CAPI send failed:', err.response?.data || err.message);
  }
};

module.exports = { sendMetaEvent };