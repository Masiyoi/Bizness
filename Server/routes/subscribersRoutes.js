const express = require('express');
const router = express.Router();
const db = require('../config/db'); // adjust to your db import

// POST /api/subscribers
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ msg: 'Please enter a valid email address.' });
  }

  try {
    // Check if already subscribed
    const existing = await db.query(
      'SELECT id FROM subscribers WHERE email = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ msg: 'You are already subscribed!' });
    }

    await db.query(
      'INSERT INTO subscribers (email, subscribed_at) VALUES ($1, NOW())',
      [email]
    );

    res.status(201).json({ msg: 'Welcome to the Luku Prime exclusive club! 🎉' });
  } catch (err) {
    console.error('Subscriber error:', err);
    res.status(500).json({ msg: 'Something went wrong. Please try again.' });
  }
});

// GET /api/subscribers — admin only, to view all subscribers
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch subscribers.' });
  }
});

module.exports = router;