import shutil
from pathlib import Path

TARGET = Path("frontend/src/App.tsx")

def read_text(p: Path) -> str:
    raw = p.read_bytes()
    return raw.decode("utf-8").replace("\r\n", "\n")

def write_text(p: Path, text: str, had_crlf: bool):
    if had_crlf:
        text = text.replace("\n", "\r\n")
    p.write_bytes(text.encode("utf-8"))

def apply_patch(path: Path, replacements):
    if not path.exists():
        print(f"[SKIP] {path} not found")
        return
    raw = path.read_bytes()
    had_crlf = b"\r\n" in raw
    text = read_text(path)

    backup = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup)
    print(f"[BACKUP] {backup}")

    changed = 0
    for label, old, new in replacements:
        count = text.count(old)
        if count == 0:
            print(f"[X] pattern not found: {label}")
        elif count > 1:
            print(f"[X] pattern not unique ({count}x), skipped: {label}")
        else:
            text = text.replace(old, new)
            print(f"[OK] {label}")
            changed += 1

    if changed:
        write_text(path, text, had_crlf)
        print(f"[WRITTEN] {path} ({changed}/{len(replacements)} patches applied)")
    else:
        print(f"[NO CHANGES] {path}")

replacements = [
    (
        "import SalespersonDashboard alongside Affiliate",
        "import Affiliate       from './pages/profile/Affiliate';",
        "import Affiliate       from './pages/profile/Affiliate';\nimport SalespersonDashboard from './pages/profile/SalespersonDashboard';",
    ),
    (
        "add nested route for affiliate/dashboard",
        '          <Route path="affiliate"       element={<Affiliate />} />',
        '          <Route path="affiliate"       element={<Affiliate />} />\n          <Route path="affiliate/dashboard" element={<SalespersonDashboard />} />',
    ),
]

apply_patch(TARGET, replacements)