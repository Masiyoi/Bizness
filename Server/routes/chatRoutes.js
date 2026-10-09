// Server/routes/chatRoutes.js
// POST /api/chat  { messages: [{ role: 'user' | 'assistant', text: string }] }  ->  { reply: string }
// The Gemini key stays on the server. Never expose it through a VITE_ variable.

const express = require('express');
const { SYSTEM_PROMPT } = require('../config/chatKnowledge');

const router = express.Router();

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_HISTORY = 10;      // last N messages sent to Gemini
const MAX_CHARS = 500;       // per message
const TIMEOUT_MS = 20000;

// Minimal in-memory rate limit: 20 messages per 10 minutes per IP
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;
const hits = new Map();

function isLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    if (!times.some(t => now - t < WINDOW_MS)) hits.delete(ip);
  }
}, WINDOW_MS).unref();

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const urlFor = model => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function callGemini(model, key, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(urlFor(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: ctrl.signal,
      body: JSON.stringify(payload),
    });
  } finally {
    clearTimeout(timer);
  }
}

// Retries temporary errors (overload, rate limit) with backoff, then tries GEMINI_FALLBACK_MODEL if set
async function generate(key, payload) {
  const models = [...new Set([MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(Boolean))];
  let r;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await callGemini(model, key, payload);
      if (r.ok || !RETRY_STATUS.has(r.status)) return r;
      console.warn(`[chat] ${model} returned ${r.status} (attempt ${attempt + 1}/3)`);
      await sleep(500 * 2 ** attempt);
    }
  }
  return r;
}

router.post('/', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('[chat] GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Chat is not available right now.' });
  }

  if (isLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many messages, please try again in a few minutes.' });
  }

  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const contents = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text.trim().slice(0, MAX_CHARS) }],
    }));

  // Gemini expects the conversation to start with a user turn
  while (contents.length && contents[0].role === 'model') contents.shift();

  if (!contents.length || contents[contents.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Please type a question.' });
  }

  try {
    const r = await generate(key, {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    });

    if (!r.ok) {
      console.error('[chat] Gemini error', r.status, await r.text());
      return res.status(502).json({ error: "I couldn't answer that right now." });
    }

    const data = await r.json();
    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('')
      .trim();

    if (!reply) {
      console.error('[chat] Empty Gemini reply', JSON.stringify(data?.promptFeedback || data?.candidates?.[0]?.finishReason));
      return res.status(502).json({ error: "I couldn't answer that right now." });
    }

    res.json({ reply });
  } catch (err) {
    console.error('[chat] request failed:', err.name === 'AbortError' ? 'timeout' : err);
    res.status(502).json({ error: "I couldn't answer that right now." });
  } finally {
    clearTimeout(timer);
  }
});

module.exports = router;