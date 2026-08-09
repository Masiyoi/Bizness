// src/controllers/membersController.js
//
// Assumes a shared pg Pool exported from ../db, e.g.:
//   const { Pool } = require('pg');
//   module.exports = new Pool({ connectionString: process.env.DATABASE_URL });
// Adjust the import below to match your project's actual db module.
const pool = require('../config/db');
const crypto = require('crypto');
// Tier thresholds â€” keep these in sync with TIERS in src/pages/MembersClub.tsx
const TIERS = [
  { name: 'Bronze',  min: 0,    max: 499 },
  { name: 'Gold',    min: 500,  max: 1999 },
  { name: 'Diamond', min: 2000, max: Infinity },
];
// One-time bonus points paid out the moment a member crosses into a new tier
const TIER_BONUS = {
  Gold:    50,
  Diamond: 150,
};
const SIGNUP_BONUS = 150; // awarded once, when the account/member record is created
const JOIN_BONUS    = 20;  // awarded once, when the user explicitly joins the club
function tierFor(points) {
  return TIERS.find(t => points >= t.min && points <= t.max) ?? TIERS[0];
}
/**
 * Adds points to a member's balance and logs the activity. If the new
 * balance crosses into a higher tier, the tier-completion bonus for that
 * tier is automatically credited and logged as a second activity row.
 *
 * Call this anywhere points get earned â€” order completion, review
 * submission, referral confirmation, the join flow, etc.
 *
 * Returns { tierChanged, tierBonusAwarded }.
 */
async function addPoints(memberId, points, description) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [before] } = await client.query(
      'SELECT points FROM members WHERE id = $1 FOR UPDATE',
      [memberId]
    );
    if (!before) throw new Error('Member not found');
    const beforeTier  = tierFor(before.points);
    const afterPoints = before.points + points;
    const afterTier   = tierFor(afterPoints);
    await client.query(
      'UPDATE members SET points = $1, tier = $2 WHERE id = $3',
      [afterPoints, afterTier.name, memberId]
    );
    await client.query(
      'INSERT INTO member_activities (member_id, description, points) VALUES ($1, $2, $3)',
      [memberId, description, points]
    );
    let tierBonusAwarded = null;
    if (afterTier.name !== beforeTier.name && TIER_BONUS[afterTier.name]) {
      const bonus = TIER_BONUS[afterTier.name];
      const finalPoints = afterPoints + bonus;
      await client.query('UPDATE members SET points = $1 WHERE id = $2', [finalPoints, memberId]);
      await client.query(
        'INSERT INTO member_activities (member_id, description, points) VALUES ($1, $2, $3)',
        [memberId, `Reached ${afterTier.name} tier â€” bonus reward`, bonus]
      );
      tierBonusAwarded = { tier: afterTier.name, bonus };
    }
    await client.query('COMMIT');
    return { tierChanged: afterTier.name !== beforeTier.name, tierBonusAwarded };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
/**
 * Call this from your existing user-registration flow, right after a new
 * account is created. It creates the member record and pays the one-time
 * signup bonus. Idempotent â€” safe to call even if a member row somehow
 * already exists (e.g. re-registration edge cases).
 */
async function registerMember(userId) {
  const { rows: [existing] } = await pool.query(
    'SELECT id FROM members WHERE user_id = $1',
    [userId]
  );
  if (existing) return existing.id;
  const { rows: [member] } = await pool.query(
    'INSERT INTO members (user_id, points, tier, club_joined) VALUES ($1, 0, $2, false) RETURNING id',
    [userId, TIERS[0].name]
  );
  await addPoints(member.id, SIGNUP_BONUS, 'Signed up â€” welcome bonus');
  return member.id;
}
// POST /api/members/join
// A separate, explicit action from signup â€” pays its own bonus and is
// safe to call whether or not registerMember already ran for this user.
async function joinClub(req, res) {
  const userId = req.user.id; // set by your auth middleware
  try {
    let { rows: [member] } = await pool.query(
      'SELECT id, club_joined FROM members WHERE user_id = $1',
      [userId]
    );
    // Safety net in case registerMember wasn't wired into the signup flow yet â€”
    // still creates the record, but does NOT retroactively pay the signup bonus
    // here, so hook registerMember into registration to avoid missing it.
    if (!member) {
      const { rows: [created] } = await pool.query(
        'INSERT INTO members (user_id, points, tier, club_joined) VALUES ($1, 0, $2, false) RETURNING id, club_joined',
        [userId, TIERS[0].name]
      );
      member = created;
    }
    if (member.club_joined) {
      return res.status(409).json({ error: 'Already joined the club' });
    }
    await pool.query('UPDATE members SET club_joined = true WHERE id = $1', [member.id]);
    await addPoints(member.id, JOIN_BONUS, 'Joined the Club');
    res.status(201).json({ joined: true });
  } catch (err) {
    console.error('joinClub error:', err);
    res.status(500).json({ error: 'Could not join Members Club' });
  }
}
// GET /api/members/profile
async function getProfile(req, res) {
  const userId = req.user.id;
  try {
    const { rows: [member] } = await pool.query(
      `SELECT m.id, m.points, m.tier, m.club_joined, m.joined_at, u.referral_code FROM members m JOIN users u ON u.id = m.user_id WHERE m.user_id = $1`,
      [userId]
    );
    if (!member) return res.status(404).json({ error: 'Not a member' });
    // Lifetime total ever earned â€” differs from member.points once you add
    // a redemption/spend feature, since points can drop but this won't.
    const { rows: [{ total_earned }] } = await pool.query(
      'SELECT COALESCE(SUM(points), 0)::int AS total_earned FROM member_activities WHERE member_id = $1 AND points > 0',
      [member.id]
    );
    const { rows: activities } = await pool.query(
      'SELECT id, description, points, created_at FROM member_activities WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20',
      [member.id]
    );
    res.json({
      points: member.points,
      tier: member.tier,
      club_joined: member.club_joined,
      joined_at: member.joined_at,
      referral_code: member.referral_code,
      total_points_earned: total_earned,
      activities,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Could not load profile' });
  }
}
// Generates a short, URL-safe referral code (fallback for accounts created
// before referral codes were assigned at signup/Google-auth time).
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
}
// GET /api/members/referral-link
// Returns the member's referral code + a full shareable signup URL,
// generating and persisting a code on first request if the user
// somehow doesn't have one yet (e.g. pre-existing accounts).
async function getReferralLink(req, res) {
  const userId = req.user.id;
  try {
    const { rows: [user] } = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    let code = user.referral_code;
    if (!code) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateReferralCode();
        try {
          await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [candidate, userId]);
          code = candidate;
          break;
        } catch (err) {
          if (err.code === '23505') continue; // collision â€” retry with a new code
          throw err;
        }
      }
      if (!code) throw new Error('Could not generate a unique referral code');
    }
    const baseUrl = process.env.FRONTEND_URL || 'https://lukuprime.shop';
    res.json({
      referral_code: code,
      referral_url: `${baseUrl}/#/register?ref=${code}`,
    });
  } catch (err) {
    console.error('getReferralLink error:', err);
    res.status(500).json({ error: 'Could not load referral link' });
  }
}
// Points earned per KSh 100 spent on a confirmed order â€” keep in sync with
// the "Every KSh 100 spent" row in EARN_WAYS in src/pages/MembersClub.tsx
const SPEND_POINTS_PER_KSH100 = 1;
// One-time bonus for a member's first confirmed order â€” keep in sync with
// "First order ever" in EARN_WAYS in src/pages/MembersClub.tsx
const FIRST_ORDER_BONUS = 100;
// One-time bonus paid to the REFERRER when their referred friend's first
// order is confirmed â€” keep in sync with "Refer a friend" in EARN_WAYS
// in src/pages/MembersClub.tsx
const REFERRAL_BONUS = 150;
/**
 * Pays the referrer once, the first time their referred friend's order is
 * confirmed. No-ops if there's no referral, it was already rewarded, or
 * the referrer isn't a club member. Never throws.
 */
async function awardReferralBonus(referredUserId) {
  try {
    const { rows: [referredUser] } = await pool.query(
      'SELECT referred_by, referral_rewarded_at FROM users WHERE id = $1',
      [referredUserId]
    );
    if (!referredUser || !referredUser.referred_by || referredUser.referral_rewarded_at) return;
    const { rows: [referrerMember] } = await pool.query(
      'SELECT id, club_joined FROM members WHERE user_id = $1',
      [referredUser.referred_by]
    );
    if (!referrerMember || !referrerMember.club_joined) return;
    await addPoints(referrerMember.id, REFERRAL_BONUS, 'Referred a friend â€” bonus reward');
    await pool.query('UPDATE users SET referral_rewarded_at = NOW() WHERE id = $1', [referredUserId]);
  } catch (err) {
    console.error('awardReferralBonus error:', err.message);
  }
}
/**
 * Call this right after an order is inserted (e.g. from
 * fulfillPesapalPayment / the M-Pesa equivalent), once status = 'confirmed'.
 * No-ops silently if the user isn't a members-club member â€” order points
 * are a club perk, not a blanket reward. Never throws: a points failure
 * should not roll back or block order fulfillment.
 */
async function awardOrderPoints(userId, orderTotal) {
  try {
    const { rows: [member] } = await pool.query(
      'SELECT id, club_joined FROM members WHERE user_id = $1',
      [userId]
    );
    if (!member || !member.club_joined) return;
    const { rows: [{ count }] } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1 AND status = 'confirmed'",
      [userId]
    );
    const isFirstOrder = Number(count) === 1;
    const spendPoints = Math.floor(Number(orderTotal) / 100) * SPEND_POINTS_PER_KSH100;
    if (spendPoints > 0) {
      await addPoints(member.id, spendPoints, `Order purchase â€” KSh ${orderTotal}`);
    }
    if (isFirstOrder) {
      await addPoints(member.id, FIRST_ORDER_BONUS, 'First order bonus');
      await awardReferralBonus(userId);
    }
  } catch (err) {
    console.error('awardOrderPoints error:', err.message);
  }
}
// GET /api/members/admin/total-points-rewarded
// Admin-only stat â€” total points ever paid out across all members.
async function getTotalPointsRewarded(req, res) {
  try {
    const { rows: [{ total_rewarded }] } = await pool.query(
      'SELECT COALESCE(SUM(points), 0)::int AS total_rewarded FROM member_activities WHERE points > 0'
    );
    res.json({ total_points_rewarded: total_rewarded });
  } catch (err) {
    console.error('getTotalPointsRewarded error:', err);
    res.status(500).json({ error: 'Could not load total points rewarded' });
  }
}
module.exports = { registerMember, joinClub, getProfile, addPoints, awardOrderPoints, awardReferralBonus, getReferralLink, tierFor, TIERS, TIER_BONUS, getTotalPointsRewarded };
