import re
MEMBERS_PATH = 'Server/src/controllers/membersController.js'
PESAPAL_PATH = 'Server/src/controllers/pesapalController.js'  # <-- adjust if your file is named differently
def patch(path, old, new, label):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old not in content:
        print(f"✗ pattern not found: {label}")
        print(f"    repr snippet expected: {repr(old[:80])}...")
        return False
    with open(path + '.bak', 'w', encoding='utf-8') as f:
        f.write(content)
    content = content.replace(old, new, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[OK] {label}")
    return True
old_members = """module.exports = { registerMember, joinClub, getProfile, addPoints, tierFor, TIERS, TIER_BONUS };"""
new_members = """// Points earned per KSh 100 spent on a confirmed order — keep in sync with
// the "Every KSh 100 spent" row in EARN_WAYS in src/pages/MembersClub.tsx
const SPEND_POINTS_PER_KSH100 = 1;
// One-time bonus for a member's first confirmed order — keep in sync with
// "First order ever" in EARN_WAYS in src/pages/MembersClub.tsx
const FIRST_ORDER_BONUS = 100;
/**
 * Call this right after an order is inserted (e.g. from
 * fulfillPesapalPayment / the M-Pesa equivalent), once status = 'confirmed'.
 * No-ops silently if the user isn't a members-club member — order points
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
      await addPoints(member.id, spendPoints, `Order purchase — KSh ${orderTotal}`);
    }
    if (isFirstOrder) {
      await addPoints(member.id, FIRST_ORDER_BONUS, 'First order bonus');
    }
  } catch (err) {
    console.error('awardOrderPoints error:', err.message);
  }
}
module.exports = { registerMember, joinClub, getProfile, addPoints, awardOrderPoints, tierFor, TIERS, TIER_BONUS };"""
patch(MEMBERS_PATH, old_members, new_members, "membersController.js: add awardOrderPoints()")
old_require = """const { calculateFirstOrderDiscount } = require('./discountController');"""
new_require = """const { calculateFirstOrderDiscount } = require('./discountController');
const { awardOrderPoints } = require('./membersController');"""
patch(PESAPAL_PATH, old_require, new_require, "pesapalController.js: require membersController")
old_log = """  console.log(`✅ Pesapal order fulfilled — user ${payment.user_id} — ref ${confirmationCode}`);"""
new_log = """  // Award members-club points now that the order is confirmed and the
  // cart is cleared. No-op for non-members; never throws.
  await awardOrderPoints(payment.user_id, payment.amount);
  console.log(`✅ Pesapal order fulfilled — user ${payment.user_id} — ref ${confirmationCode}`);"""
patch(PESAPAL_PATH, old_log, new_log, "pesapalController.js: award points in fulfillPesapalPayment")
print("\nDone.")
