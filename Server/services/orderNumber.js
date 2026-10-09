// Server/services/orderNumber.js
// Public order numbers: PW-XXXXX, derived from the orders_order_number_seq value
// via sqids. Reversible and collision-free, but obfuscation, not security.
const SqidsPkg = require('sqids');
const Sqids = SqidsPkg.default || SqidsPkg.Sqids || SqidsPkg;

// DO NOT change ALPHABET or MIN_LENGTH once orders exist in this format:
// validating/decoding existing numbers would break. 32 unique chars, no 0/O/1/I.
// Optionally override via ORDER_SQIDS_ALPHABET in .env.
const ALPHABET   = process.env.ORDER_SQIDS_ALPHABET || '7KQ4XH9WCNZ2MA6TJ8YBF5ESDG3RLUPV';
const MIN_LENGTH = 5;
const PREFIX     = 'PW-';

const sqids = new Sqids({ alphabet: ALPHABET, minLength: MIN_LENGTH });

// 142 -> "PW-XXXXX"
const formatOrderNumber = (seq) => PREFIX + sqids.encode([Number(seq)]);

// "PW-XXXXX" -> 142, or null if it isn't a number we could have issued
const decodeOrderNumber = (orderNumber) => {
  const code = String(orderNumber || '').trim().toUpperCase().replace(/^PW-/, '');
  if (!code) return null;
  const [seq] = sqids.decode(code);
  if (seq === undefined) return null;
  // sqids will decode some non-canonical strings, so re-encode to be sure
  return sqids.encode([seq]) === code ? seq : null;
};

// Cleans user input (case, spaces) for lookups against orders.order_number.
// Old-format numbers (ON-000123) are passed through unchanged.
const normaliseOrderNumber = (input) => {
  const s = String(input || '').trim().toUpperCase();
  if (/^ON-\d+$/.test(s)) return s;
  const seq = decodeOrderNumber(s);
  return seq == null ? null : formatOrderNumber(seq);
};

// Pulls the next sequence value and formats it. Replaces the old 'ON-' logic.
const generateOrderNumber = async () => {
  const db = require('../config/db'); // required lazily so the helpers above work without a DB
  const { rows } = await db.query(`SELECT nextval('orders_order_number_seq') AS n`);
  return formatOrderNumber(rows[0].n);
};

module.exports = { formatOrderNumber, decodeOrderNumber, normaliseOrderNumber, generateOrderNumber };
