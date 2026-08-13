import re
import shutil
import os
path = "frontend/src/pages/profile/profileStyles.ts"
backup = path + ".bak"
if not os.path.exists(path):
    print(f"X pattern not found: file does not exist at {path}")
    print("  Run this script from your repo root (the folder containing frontend/).")
    raise SystemExit(1)
with open(path, "rb") as f:
    raw = f.read()
uses_crlf = b"\r\n" in raw
content = raw.decode("utf-8").replace("\r\n", "\n")
shutil.copy(path, backup)
print(f"[OK] Backup created at {backup}")
patches = [
    (
        r"\.pf-nav-link \{\n    display: flex; align-items: center; gap: 10px;\n    font-family: var\(--pf-f-sans\); font-size: 12px; font-weight: 500; letter-spacing: 1px;\n    color: var\(--pf-mid\); text-transform: uppercase;",
        ".pf-nav-link {\n    display: flex; align-items: center; gap: 10px;\n    font-family: var(--pf-f-sans); font-size: 12px; font-weight: 700; letter-spacing: 1px;\n    color: var(--pf-ink); text-transform: uppercase;",
        "desktop sidebar .pf-nav-link"
    ),
    (
        r"\.pf-tab \{\n    flex-shrink: 0; font-family: var\(--pf-f-sans\); font-size: 10\.5px; font-weight: 600;\n    letter-spacing: 1\.5px; text-transform: uppercase; color: var\(--pf-mid\);",
        ".pf-tab {\n    flex-shrink: 0; font-family: var(--pf-f-sans); font-size: 10.5px; font-weight: 700;\n    letter-spacing: 1.5px; text-transform: uppercase; color: var(--pf-ink);",
        "mobile .pf-tab"
    ),
]
for pattern, replacement, label in patches:
    if re.search(pattern, content):
        content = re.sub(pattern, lambda m: replacement, content, count=1)
        print(f"[OK] Patched: {label}")
    else:
        print(f"X pattern not found: {label}")
if uses_crlf:
    content = content.replace("\n", "\r\n")
with open(path, "w", encoding="utf-8", newline="") as f:
    f.write(content)
print("[OK] profileStyles.ts updated")
