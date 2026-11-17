"""
Patch frontend/index.html so the 2-second minimum splash loader is skipped
on /meta-checkout (Meta's checkout validator must see real content fast).

Run from the repo root:  python patch_index_loader.py
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(r"C:\Users\Administrator\bizness")

# index.html lives in frontend/ (Vite). Fall back to a search if it moved.
target = ROOT / "frontend" / "index.html"
if not target.exists():
    hits = [p for p in ROOT.rglob("index.html")
            if "node_modules" not in p.parts and "dist" not in p.parts]
    if not hits:
        print("[X] index.html not found under", ROOT)
        sys.exit(1)
    target = hits[0]

raw = target.read_bytes()
crlf = b"\r\n" in raw
text = raw.replace(b"\r\n", b"\n").decode("utf-8")

OLD = "var MIN_DISPLAY_MS = 2000;"
NEW = (
    "// Skip the forced splash on Meta checkout links so crawlers/validators\n"
    "        // see real content immediately.\n"
    "        var MIN_DISPLAY_MS = /meta-checkout/.test(window.location.pathname) ? 0 : 2000;"
)

if NEW in text:
    print("[--] Already patched:", target)
    sys.exit(0)

if text.count(OLD) != 1:
    print(f"[X] pattern not found exactly once (found {text.count(OLD)}): {OLD}")
    sys.exit(1)

shutil.copyfile(target, target.with_suffix(".html.bak"))
text = text.replace(OLD, NEW)

out = text.replace("\n", "\r\n") if crlf else text
target.write_bytes(out.encode("utf-8"))

print("[OK] Patched", target)
print("     Backup:", target.with_suffix(".html.bak"))
print()
print("What changed:")
print("  - MIN_DISPLAY_MS is now 0 on /meta-checkout and still 2000 everywhere else.")
print("  - Line endings preserved (%s)." % ("CRLF" if crlf else "LF"))