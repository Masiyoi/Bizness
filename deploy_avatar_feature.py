import re
import shutil
import os

def write_file(path, content, label):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    if os.path.exists(path):
        print(f"! {label}: already exists at {path} — skipping (delete it first if you want it regenerated)")
        return
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print(f"[OK] Created {label} at {path}")

def patch_file(path, patches, label):
    if not os.path.exists(path):
        print(f"X pattern not found: {label} — file does not exist at {path}")
        return
    with open(path, "rb") as f:
        raw = f.read()
    uses_crlf = b"\r\n" in raw
    content = raw.decode("utf-8").replace("\r\n", "\n")
    shutil.copy(path, path + ".bak")
    print(f"[OK] Backup created at {path}.bak")
    for pattern, replacement, sub_label in patches:
        if re.search(pattern, content):
            content = re.sub(pattern, lambda m: replacement, content, count=1)
            print(f"[OK] Patched {label}: {sub_label}")
        else:
            print(f"X pattern not found in {label}: {sub_label}")
    if uses_crlf:
        content = content.replace("\n", "\r\n")
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(content)

# ─────────────────────────────────────────────────────────────────────────
# 1. DB migration script
# ─────────────────────────────────────────────────────────────────────────
write_file(
    "scripts/migrate-avatar-columns.js",
    """const db = require('../config/db');

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
""",
    "migration script"
)

# ─────────────────────────────────────────────────────────────────────────
# 2. Auth middleware (self-contained — swap for your existing one if you have it)
# ─────────────────────────────────────────────────────────────────────────
write_file(
    "middleware/requireAuth.js",
    """const jwt = require('jsonwebtoken');

// NOTE: mirrors the token shape from authController.generateToken()
// (jwt.sign({ id: userId, role }, ...), cookie name "token"). If you already
// have an existing auth middleware used by cart/orders/wishlist routes, use
// that instead here so avatar auth stays consistent with the rest of the
// app (e.g. lockout/session checks) — this one only knows about the JWT.
module.exports = function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ msg: 'Not authenticated.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid or expired session.' });
  }
};
""",
    "requireAuth middleware"
)

# ─────────────────────────────────────────────────────────────────────────
# 3. Avatar controller
# ─────────────────────────────────────────────────────────────────────────
write_file(
    "controllers/avatarController.js",
    """const db          = require('../config/db');
const cloudinary  = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const uploadAvatarToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bizna_avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const RETURN_COLS = `id, full_name, email, role, is_verified, profile_picture, avatar_type, avatar_color`;

// PUT /api/users/avatar/upload  (multipart, field name "avatar")
exports.uploadAvatarImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No image file provided.' });

    const result = await uploadAvatarToCloudinary(req.file.buffer);

    const { rows } = await db.query(
      `UPDATE users
       SET profile_picture = $1, avatar_type = 'image', avatar_color = NULL, updated_at = NOW()
       WHERE id = $2
       RETURNING ${RETURN_COLS}`,
      [result.secure_url, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('uploadAvatarImage error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// PUT /api/users/avatar/color   body: { color: '#RRGGBB' }
exports.setAvatarColor = async (req, res) => {
  try {
    const { color } = req.body;
    if (!color || !HEX_COLOR_RE.test(color))
      return res.status(400).json({ msg: 'Valid hex color required, e.g. #111111.' });

    const { rows } = await db.query(
      `UPDATE users
       SET avatar_color = $1, avatar_type = 'color', updated_at = NOW()
       WHERE id = $2
       RETURNING ${RETURN_COLS}`,
      [color, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('setAvatarColor error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// DELETE /api/users/avatar — reset to initials.
// NOTE: this also clears profile_picture, so for Google-signup users it
// wipes their original Google photo too, not just an uploaded one. Fine as
// a deliberate "reset" action, just flagging the tradeoff.
exports.resetAvatar = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users
       SET avatar_type = 'initials', avatar_color = NULL, profile_picture = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING ${RETURN_COLS}`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ msg: 'User not found.' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('resetAvatar error:', err.message);
    res.status(500).json({ msg: 'Server error.' });
  }
};
""",
    "avatarController.js"
)

# ─────────────────────────────────────────────────────────────────────────
# 4. Routes
# ─────────────────────────────────────────────────────────────────────────
write_file(
    "routes/userRoutes.js",
    """const express      = require('express');
const router       = express.Router();
const multer       = require('multer');
const requireAuth  = require('../middleware/requireAuth');
const avatarCtrl   = require('../controllers/avatarController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

router.put('/avatar/upload', requireAuth, upload.single('avatar'), avatarCtrl.uploadAvatarImage);
router.put('/avatar/color',  requireAuth, avatarCtrl.setAvatarColor);
router.delete('/avatar',     requireAuth, avatarCtrl.resetAvatar);

module.exports = router;
""",
    "userRoutes.js"
)

# ─────────────────────────────────────────────────────────────────────────
# 5. Frontend: AvatarDisplay (pure) + AvatarPicker (editable)
# ─────────────────────────────────────────────────────────────────────────
write_file(
    "frontend/src/components/common/AvatarDisplay.tsx",
    """// src/components/common/AvatarDisplay.tsx
import type { User } from '../../constants/theme';
import { getInitials } from '../../constants/theme';

interface AvatarDisplayProps {
  user: User | null;
  size?: number;
  style?: React.CSSProperties;
}

export default function AvatarDisplay({ user, size = 32, style }: AvatarDisplayProps) {
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
    fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: '1px',
    fontSize: Math.max(10, size * 0.34),
    color: '#fff',
    background: '#0A0A0A',
    ...style,
  };

  if (!user) return <div style={base}>?</div>;

  if (user.avatar_type === 'image' && user.profile_picture) {
    return (
      <div style={{ ...base, background: '#eee' }}>
        <img
          src={user.profile_picture}
          alt={user.full_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  if (user.avatar_type === 'color' && user.avatar_color) {
    return <div style={{ ...base, background: user.avatar_color }}>{getInitials(user.full_name)}</div>;
  }

  return <div style={base}>{getInitials(user.full_name)}</div>;
}
""",
    "AvatarDisplay.tsx"
)

write_file(
    "frontend/src/components/common/AvatarPicker.tsx",
    """// src/components/common/AvatarPicker.tsx
import { useRef, useState } from 'react';
import axios from 'axios';
import type { User } from '../../constants/theme';
import { AVATAR_COLORS } from '../../constants/theme';
import AvatarDisplay from './AvatarDisplay';

interface AvatarPickerProps {
  user: User;
  size?: number;
  onUpdate: (user: User) => void;
}

// Persists the change, updates localStorage (so Navbar / other tabs pick it
// up), and fires a same-tab custom event since the native 'storage' event
// only fires in OTHER tabs.
function persistUser(updated: User, onUpdate: (u: User) => void) {
  const stored = localStorage.getItem('user');
  const merged = stored ? { ...JSON.parse(stored), ...updated } : updated;
  localStorage.setItem('user', JSON.stringify(merged));
  window.dispatchEvent(new Event('user-updated'));
  onUpdate(merged);
}

export default function AvatarPicker({ user, size = 64, onUpdate }: AvatarPickerProps) {
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)      { setError('Image must be under 5MB.');     return; }

    setBusy(true); setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await axios.put('/api/users/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleColorPick = async (color: string) => {
    setBusy(true); setError('');
    try {
      const { data } = await axios.put('/api/users/avatar/color', { color });
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Could not save color. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await axios.delete('/api/users/avatar');
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Could not reset avatar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change profile picture"
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative', borderRadius: '50%' }}
      >
        <AvatarDisplay user={user} size={size} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: Math.max(18, size * 0.3), height: Math.max(18, size * 0.3),
          borderRadius: '50%', background: '#0A0A0A', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </div>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 200,
            background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12,
            padding: 14, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#111', marginBottom: 10 }}>
              Profile Picture
            </p>

            <button
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, color: '#111', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 12 }}
            >
              Upload from device…
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} style={{ display: 'none' }} />

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
              Or pick a color
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  disabled={busy}
                  onClick={() => handleColorPick(c)}
                  title={c}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c, cursor: busy ? 'not-allowed' : 'pointer',
                    border: user.avatar_type === 'color' && user.avatar_color === c ? '2px solid #111' : '2px solid transparent',
                    outline: '1px solid rgba(0,0,0,0.08)', outlineOffset: 1,
                  }}
                />
              ))}
            </div>

            {user.avatar_type !== 'initials' && (
              <button
                disabled={busy}
                onClick={handleReset}
                style={{ width: '100%', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: 11.5, fontWeight: 500, color: '#dc2626', background: 'none', border: 'none', padding: '4px 2px', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                Remove & use initials
              </button>
            )}

            {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10.5, color: '#dc2626', marginTop: 8 }}>{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
""",
    "AvatarPicker.tsx"
)

# ─────────────────────────────────────────────────────────────────────────
# 6. Patch theme.ts — add avatar fields to User interface
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    "frontend/src/constants/theme.ts",
    [
        (
            r"export interface User \{\n  id:          number;\n  full_name:   string;\n  email:       string;\n  role:        string;\n  is_verified: boolean;\n\}",
            "export interface User {\n  id:          number;\n  full_name:   string;\n  email:       string;\n  role:        string;\n  is_verified: boolean;\n  profile_picture?: string | null;\n  avatar_type?:     'initials' | 'image' | 'color';\n  avatar_color?:    string | null;\n}",
            "User interface — add avatar fields"
        ),
    ],
    "theme.ts"
)

# ─────────────────────────────────────────────────────────────────────────
# 7. Patch Dashboard.tsx — add AvatarPicker at top, thread setUser through context
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    "frontend/src/pages/profile/Dashboard.tsx",
    [
        (
            r"import type \{ User \} from '\.\./\.\./constants/theme';\n\ninterface OutletCtx \{ user: User; \}",
            "import type { User } from '../../constants/theme';\nimport AvatarPicker from '../../components/common/AvatarPicker';\n\ninterface OutletCtx { user: User; setUser: (u: User) => void; }",
            "imports + OutletCtx — add setUser"
        ),
        (
            r"  const \{ user \} = useOutletContext<OutletCtx>\(\);",
            "  const { user, setUser } = useOutletContext<OutletCtx>();",
            "destructure setUser from context"
        ),
        (
            r"    <div>\n      <p className=\"pf-eyebrow\">Welcome back</p>",
            "    <div>\n      <div style={{ marginBottom: 20 }}>\n        <AvatarPicker user={user} size={64} onUpdate={setUser} />\n      </div>\n      <p className=\"pf-eyebrow\">Welcome back</p>",
            "render AvatarPicker above the eyebrow"
        ),
    ],
    "Dashboard.tsx"
)

# ─────────────────────────────────────────────────────────────────────────
# 8. Patch ProfileLayout.tsx — sidebar avatar becomes editable
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    "frontend/src/pages/profile/ProfileLayout.tsx",
    [
        (
            r"import \{ getInitials, readUser \} from '\.\./\.\./constants/theme';\nimport type \{ User \} from '\.\./\.\./constants/theme';",
            "import { readUser } from '../../constants/theme';\nimport type { User } from '../../constants/theme';\nimport AvatarPicker from '../../components/common/AvatarPicker';",
            "imports — drop getInitials, add AvatarPicker"
        ),
        (
            r"            <div className=\"pf-avatar\">\{getInitials\(user\.full_name\)\}</div>",
            "            <AvatarPicker user={user} size={44} onUpdate={setUser} />",
            "sidebar pf-avatar → AvatarPicker"
        ),
    ],
    "ProfileLayout.tsx"
)

# ─────────────────────────────────────────────────────────────────────────
# 9. Patch Navbar.tsx — display-only avatar (image/color/initials), keeps
#    the existing dropdown click behavior untouched; also listen for the
#    same-tab 'user-updated' event so it refreshes without a focus/reload.
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    "frontend/src/components/common/Navbar.tsx",
    [
        (
            r"  // Also poll on window focus \(same-tab logins don't fire storage events\)\n  useEffect\(\(\) => \{\n    const onFocus = \(\) => setUser\(readUser\(\)\);\n    window\.addEventListener\('focus', onFocus\);\n    return \(\) => window\.removeEventListener\('focus', onFocus\);\n  \}, \[\]\);",
            "  // Also poll on window focus (same-tab logins don't fire storage events)\n  useEffect(() => {\n    const onFocus = () => setUser(readUser());\n    window.addEventListener('focus', onFocus);\n    return () => window.removeEventListener('focus', onFocus);\n  }, []);\n\n  // Same-tab avatar updates (from AvatarPicker) — 'storage' only fires cross-tab\n  useEffect(() => {\n    const onUserUpdated = () => setUser(readUser());\n    window.addEventListener('user-updated', onUserUpdated);\n    return () => window.removeEventListener('user-updated', onUserUpdated);\n  }, []);",
            "add user-updated listener"
        ),
        (
            r"                    background: user\.role === 'admin' \? 'linear-gradient\(135deg,#7C3AED,#A855F7\)' : \(isTransparent \? 'rgba\(255,255,255,0\.2\)' : '#111'\),\n                    color: '#fff',\n                    fontFamily: \"'Jost', sans-serif\", fontSize: 11, fontWeight: 500, letterSpacing: '1px',\n                    border: showMenu\n                      \? \(isTransparent \? '2px solid rgba\(255,255,255,0\.8\)' : '2px solid #555'\)\n                      : \(isTransparent \? '2px solid rgba\(255,255,255,0\.35\)' : '2px solid transparent'\),\n                    transition: 'background 0\.3s, border-color 0\.3s',\n                  \}\}\n                >\n                  \{getInitials\(user\.full_name\)\}\n                </div>",
            "                    background: user.role === 'admin'\n                      ? 'linear-gradient(135deg,#7C3AED,#A855F7)'\n                      : user.avatar_type === 'image' && user.profile_picture\n                        ? '#eee'\n                        : user.avatar_type === 'color' && user.avatar_color\n                          ? user.avatar_color\n                          : (isTransparent ? 'rgba(255,255,255,0.2)' : '#111'),\n                    color: '#fff', overflow: 'hidden',\n                    fontFamily: \"'Jost', sans-serif\", fontSize: 11, fontWeight: 500, letterSpacing: '1px',\n                    border: showMenu\n                      ? (isTransparent ? '2px solid rgba(255,255,255,0.8)' : '2px solid #555')\n                      : (isTransparent ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent'),\n                    transition: 'background 0.3s, border-color 0.3s',\n                  }}\n                >\n                  {user.role !== 'admin' && user.avatar_type === 'image' && user.profile_picture\n                    ? <img src={user.profile_picture} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />\n                    : getInitials(user.full_name)}\n                </div>",
            "avatar circle — show image/color/initials"
        ),
    ],
    "Navbar.tsx"
)

print("\n[OK] Done.")