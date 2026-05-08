// server/routes/instagram.js
// ─────────────────────────────────────────────────────────────────────────────
// Serves your brand's own posts + tagged/mentioned posts from Instagram
// Graph API.  Results are cached in-memory (or in your DB) so we don't
// hammer the API on every page load.
//
// ENV vars required (add to your .env):
//   IG_USER_ID          – your numeric Instagram Business/Creator user ID
//   IG_ACCESS_TOKEN     – long-lived User Access Token (never expires if
//                         refreshed; see /refresh-token route below)
//   IG_GRAPH_VERSION    – e.g. "v21.0"  (default: v21.0)
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// ── Config ───────────────────────────────────────────────────────────────────
const BASE = 'https://graph.instagram.com';
const VERSION   = process.env.IG_GRAPH_VERSION || 'v21.0';
const USER_ID   = process.env.IG_USER_ID;
const TOKEN     = process.env.IG_ACCESS_TOKEN;
const GRAPH     = `${BASE}/${VERSION}`;

// ── Simple in-memory cache (swap for Redis/DB if preferred) ──────────────────
const cache = {
  data:      null,
  expiresAt: 0,
  TTL_MS:    15 * 60 * 1000,   // 15 minutes
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch your own brand posts from /{ig-user-id}/media */
async function fetchOwnPosts(limit = 12) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url    = `${GRAPH}/${USER_ID}/media`;

  const { data } = await axios.get(url, {
    params: { fields, limit, access_token: TOKEN },
  });

  return (data.data || []).map(normalise);
}

/**
 * Fetch posts where your account was @mentioned.
 * Requires `instagram_manage_mentions` permission on your Meta App.
 * Returns up to `limit` most recent mentions.
 */
async function fetchMentions(limit = 12) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url    = `${GRAPH}/${USER_ID}/tags`;   // IG media where this account is tagged

  try {
    const { data } = await axios.get(url, {
      params: { fields, limit, access_token: TOKEN },
    });
    return (data.data || []).map(normalise);
  } catch (err) {
    // If the permission isn't granted yet, return empty array gracefully
    console.warn('[Instagram] mentions fetch failed (check instagram_manage_mentions permission):', err?.response?.data?.error?.message);
    return [];
  }
}

/**
 * Normalise a raw Graph API media object into the shape
 * expected by the InstagramStrip component.
 */
function normalise(item) {
  return {
    id:       item.id,
    imageUrl: item.media_type === 'VIDEO'
                ? (item.thumbnail_url || '')   // video thumbnail
                : (item.media_url || ''),
    videoUrl: item.media_type === 'VIDEO' ? item.media_url : undefined,
    href:     item.permalink,
    caption:  item.caption || '',
    timestamp: item.timestamp,
    source:   'instagram',
  };
}

// ── GET /api/instagram/posts ──────────────────────────────────────────────────
// Returns merged brand + tagged posts, deduplicated and sorted by date.
// Query params:
//   ?limit=20      total posts to return (default 20)
//   ?ownOnly=true  skip mention/tagged posts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/posts', async (req, res) => {
  if (!USER_ID || !TOKEN) {
    return res.status(500).json({ error: 'Instagram credentials not configured. Set IG_USER_ID and IG_ACCESS_TOKEN in .env' });
  }

  // Serve from cache if still fresh
  if (cache.data && Date.now() < cache.expiresAt) {
    return res.json(cache.data);
  }

  const limit   = Math.min(parseInt(req.query.limit) || 20, 50);
  const ownOnly = req.query.ownOnly === 'true';

  try {
    const [own, tagged] = await Promise.all([
      fetchOwnPosts(limit),
      ownOnly ? Promise.resolve([]) : fetchMentions(limit),
    ]);

    // Merge + deduplicate by id
    const seen    = new Set();
    const merged  = [...own, ...tagged].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort newest first and cap at limit
    const sorted = merged
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // Update cache
    cache.data      = sorted;
    cache.expiresAt = Date.now() + cache.TTL_MS;

    return res.json(sorted);
  } catch (err) {
    const igError = err?.response?.data?.error;
    console.error('[Instagram] API error:', igError || err.message);
    return res.status(502).json({ error: 'Failed to fetch Instagram posts', detail: igError });
  }
});

// ── GET /api/instagram/refresh-token ─────────────────────────────────────────
// Call this route (or a cron job) every ~50 days to refresh the long-lived
// token before it expires (they last 60 days).
// Only call from your server/admin — never expose to the public.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/refresh-token', async (req, res) => {
  try {
    const { data } = await axios.get(`${GRAPH}/refresh_access_token`, {
      params: {
        grant_type:   'ig_refresh_token',
        access_token: TOKEN,
      },
    });

    // Log the new token so you can save it to .env
    console.log('[Instagram] Refreshed token (save this to IG_ACCESS_TOKEN in .env):', data.access_token);
    console.log('[Instagram] Expires in:', data.expires_in, 'seconds (~', Math.floor(data.expires_in / 86400), 'days)');

    // In production you'd persist data.access_token to your DB or secrets manager
    return res.json({
      message:    'Token refreshed. Update IG_ACCESS_TOKEN in your .env or secrets manager.',
      new_token:  data.access_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Token refresh failed', detail: err?.response?.data });
  }
});

module.exports = router;