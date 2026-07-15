const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const ENV_PATH = path.resolve(__dirname, '../.env');

const {
  INSTAGRAM_ACCESS_TOKEN,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
} = process.env;

async function refreshToken() {
  if (!INSTAGRAM_ACCESS_TOKEN || !FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('[TokenRefresh] Missing required env vars. Need INSTAGRAM_ACCESS_TOKEN, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET.');
    process.exit(1);
  }

  try {
    const res = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type:        'fb_exchange_token',
        client_id:         FACEBOOK_APP_ID,
        client_secret:     FACEBOOK_APP_SECRET,
        fb_exchange_token: INSTAGRAM_ACCESS_TOKEN,
      },
    });

    const { access_token, expires_in } = res.data;
    if (!access_token) throw new Error('No access_token returned from Facebook');

    updateEnvFile('INSTAGRAM_ACCESS_TOKEN', access_token);

    const expiresInDays = Math.round(expires_in / 86400);
    console.log(`[TokenRefresh] ✅ Success. New token expires in ~${expiresInDays} days.`);
    console.log('[TokenRefresh] Restart your server for the new token to take effect.');
  } catch (err) {
    console.error('[TokenRefresh] ❌ Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

function updateEnvFile(key, newValue) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const regex      = new RegExp(`^${key}=.*$`, 'm');
  const newLine    = `${key}=${newValue}`;
  const updated    = regex.test(envContent)
    ? envContent.replace(regex, newLine)
    : `${envContent}\n${newLine}\n`;

  fs.writeFileSync(ENV_PATH, updated, 'utf8');
  console.log(`[TokenRefresh] .env updated: ${key}`);
}

refreshToken();
