import re
import shutil
import os

def patch_file(path, patches, label):
    if not os.path.exists(path):
        print(f"X pattern not found: {label} - file does not exist at {path}")
        return
    with open(path, "rb") as f:
        raw = f.read()
    uses_crlf = b"\r\n" in raw
    content = raw.decode("utf-8").replace("\r\n", "\n")
    shutil.copy(path, path + ".bak2")
    print(f"[OK] Backup created at {path}.bak2")
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

def remove_file(path, label):
    if os.path.exists(path):
        os.remove(path)
        print(f"[OK] Removed unused {label} at {path}")
    else:
        print(f"! {label} already absent at {path} (nothing to remove)")

# ─────────────────────────────────────────────────────────────────────────
# 1. Remove the duplicate route/middleware files from the last pass —
#    your real usersRoutes.js + auth.js are the ones actually mounted.
# ─────────────────────────────────────────────────────────────────────────
remove_file("routes/userRoutes.js", "routes/userRoutes.js")
remove_file("middleware/requireAuth.js", "middleware/requireAuth.js")

# ─────────────────────────────────────────────────────────────────────────
# 2. Fold the avatar routes into your existing usersRoutes.js, using your
#    existing auth middleware — no server.js changes needed since
#    /api/users is already mounted.
# ─────────────────────────────────────────────────────────────────────────
patch_file(
    "routes/usersRoutes.js",
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

print("\n[OK] Done.")