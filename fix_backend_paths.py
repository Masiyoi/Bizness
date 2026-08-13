import re
import shutil
import os

def detect_backend_root():
    if os.path.isfile("Server/config/db.js"):
        return "Server"
    if os.path.isfile("config/db.js"):
        return "."
    print("! Could not auto-detect backend root (no Server/config/db.js or config/db.js found).")
    print("  Run this from your repo root (the folder containing 'Server' and 'frontend').")
    raise SystemExit(1)

def move_file(src, dst, label):
    if not os.path.exists(src):
        print(f"! {label}: nothing at {src} to move (already moved or never created there)")
        return
    if os.path.exists(dst):
        print(f"! {label}: {dst} already exists — leaving {src} in place, check manually")
        return
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    shutil.move(src, dst)
    print(f"[OK] Moved {label}: {src} -> {dst}")

def remove_if_empty(path):
    if os.path.isdir(path) and not os.listdir(path):
        os.rmdir(path)
        print(f"[OK] Removed now-empty stray folder {path}")

def remove_file(path, label):
    if os.path.exists(path):
        os.remove(path)
        print(f"[OK] Removed stray {label} at {path}")

def patch_file(path, patches, label):
    if not os.path.exists(path):
        print(f"X pattern not found: {label} - file does not exist at {path}")
        return
    with open(path, "rb") as f:
        raw = f.read()
    uses_crlf = b"\r\n" in raw
    content = raw.decode("utf-8").replace("\r\n", "\n")
    shutil.copy(path, path + ".bak3")
    print(f"[OK] Backup created at {path}.bak3")
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

backend = detect_backend_root()
print(f"[OK] Detected backend root: {backend}/")

# ─────────────────────────────────────────────────────────────────────────
# 1. Move the two misplaced files into the real backend root
# ─────────────────────────────────────────────────────────────────────────
move_file("controllers/avatarController.js", f"{backend}/controllers/avatarController.js", "avatarController.js")
move_file("scripts/migrate-avatar-columns.js", f"{backend}/scripts/migrate-avatar-columns.js", "migration script")

# ─────────────────────────────────────────────────────────────────────────
# 2. Clean up any other stray top-level dirs/files from the earlier passes
# ─────────────────────────────────────────────────────────────────────────
remove_file("routes/userRoutes.js", "routes/userRoutes.js")
remove_file("middleware/requireAuth.js", "middleware/requireAuth.js")
for stray in ["controllers", "scripts", "routes", "middleware"]:
    remove_if_empty(stray)

# ─────────────────────────────────────────────────────────────────────────
# 3. Patch the REAL usersRoutes.js (inside Server/) with the avatar routes
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    f"{backend}/routes/usersRoutes.js",
    [
        (
            r"const auth    = require\('\.\./middleware/auth'\);\nconst usersController = require\('\.\./controllers/usersController'\);",
            "const auth    = require('../middleware/auth');\nconst multer  = require('multer');\nconst usersController  = require('../controllers/usersController');\nconst avatarController = require('../controllers/avatarController');\n\nconst avatarUpload = multer({\n  storage: multer.memoryStorage(),\n  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB\n  fileFilter: (req, file, cb) => {\n    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));\n    cb(null, true);\n  },\n});",
            "imports — add multer + avatarController"
        ),
        (
            r"router\.post\('/me/change-password', auth, usersController\.changePassword\);",
            "router.post('/me/change-password', auth, usersController.changePassword);\n\n// Profile avatar — upload an image (Cloudinary) or set a solid color\nrouter.put('/avatar/upload', auth, avatarUpload.single('avatar'), avatarController.uploadAvatarImage);\nrouter.put('/avatar/color',  auth, avatarController.setAvatarColor);\nrouter.delete('/avatar',     auth, avatarController.resetAvatar);",
            "add avatar routes after change-password"
        ),
    ],
    "usersRoutes.js"
)

print(f"\n[OK] Done. Run the migration with: node {backend}/scripts/migrate-avatar-columns.js")