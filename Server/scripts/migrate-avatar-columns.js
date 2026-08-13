const db = require('../config/db');

(async () => {
  try {
    await db.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar_type  VARCHAR(10) DEFAULT 'initials',
        ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(7)
    `);
    console.log('[OK] avatar_type / avatar_color columns ready on users table.');
    process.exit(0);
  } catch (err) {
    console.error('X migration failed:', err.message);
    process.exit(1);
  }
})();
