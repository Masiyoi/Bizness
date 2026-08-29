// Server/utils/generateCouponCode.js
const pool = require('../config/db'); // however you access Postgres

function slugifyName(name) {
  return name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'LUKU';
}

async function generateUniqueCouponCode(fullName) {
  const base = slugifyName(fullName);
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.floor(100 + Math.random() * 900); // 3-digit
    const code = `${base}${suffix}`; // e.g. IZOH482
    const { rows } = await pool.query(
      'SELECT 1 FROM salespersons WHERE coupon_code = $1',
      [code]
    );
    if (rows.length === 0) return code;
  }
  throw new Error('Could not generate a unique coupon code, try again');
}

module.exports = { generateUniqueCouponCode };