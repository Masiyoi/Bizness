#!/usr/bin/env python3
"""
Navbar.tsx (mobile):
  1. Language picker moves INTO the hamburger menu (hidden while menu is closed)
  2. Brand logo grows to 32px (matches the avatar circle)
  3. Brand name sits in the middle column, right next to the hamburger
Usage (from the frontend folder):  python patch_navbar_lang_brand.py
Safe to re-run: already-applied edits are reported as [SKIP].
"""
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("src")
TARGET = ("components", "common", "Navbar.tsx")

LANG_BLOCK = r'''{/* ── Language — only visible inside the mobile menu ── */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#111', marginRight: 4 }}>Language</span>
            {LANGS.map(l => (
              <button key={l.code} title={l.label} onClick={() => applyLang(l.gtCode, l.code)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: lang === l.code ? 700 : 500, letterSpacing: '1px', padding: '6px 10px', borderRadius: 999, cursor: 'pointer', background: lang === l.code ? '#111' : 'rgba(255,255,255,0.6)', color: lang === l.code ? '#fff' : '#111', border: lang === l.code ? '1px solid #111' : '1px solid rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{l.flag}</span>{l.code}
              </button>
            ))}
          </div>

          '''

EDITS = [
    (
        "menu: add Language chips inside the hamburger menu",
        r'''{/* ── Categories label ── */}''',
        LANG_BLOCK + r'''{/* ── Categories label ── */}''',
    ),
    (
        "CSS: brand sits next to the hamburger",
        r'''.navbar-brand-center { gap: 6px !important; }''',
        r'''.navbar-brand-center { gap: 6px !important; justify-self: start !important; padding-left: 6px !important; min-width: 0 !important; }''',
    ),
    (
        "CSS: logo 32px = avatar size",
        r'''.navbar-brand-center img { width: 28px !important; height: 28px !important; }''',
        r'''.navbar-brand-center img { width: 32px !important; height: 32px !important; flex-shrink: 0 !important; }''',
    ),
    (
        "CSS: header grid = hamburger | brand | right cluster",
        r'''grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) !important;''',
        r'''grid-template-columns: auto minmax(0, 1fr) auto !important;''',
    ),
]


def find(parts):
    for p in ROOT.rglob(parts[-1]):
        if p.parts[-len(parts):] == parts:
            return p
    return None


def remove_mobile_lang_and_brand(text):
    """Delete the always-visible mobile lang picker + hidden left-column brand."""
    start_marker = "{/* Mobile lang picker — after hamburger */}"
    s = text.find(start_marker)
    if s == -1:
        return text, False
    b = text.find('className="navbar-brand-mobile"', s)
    if b == -1:
        return text, False
    span_end = text.find("</span>", b)
    div_end = text.find("</div>", span_end)
    if span_end == -1 or div_end == -1:
        return text, False
    e = div_end + len("</div>")
    return text[:s] + text[e:], True


path = find(TARGET)
if not path:
    sys.exit(f"✗ {'/'.join(TARGET)} not found under {ROOT}")

raw = path.read_bytes()
crlf = b"\r\n" in raw
text = raw.decode("utf-8").replace("\r\n", "\n")
changed = 0

for label, old, new in EDITS:
    if new in text:
        print(f"  [SKIP] already applied: {label}")
    elif text.count(old) == 1:
        text = text.replace(old, new)
        changed += 1
        print(f"  [OK] {label}")
    elif text.count(old) > 1:
        print(f"  ✗ ambiguous ({text.count(old)} matches): {label}")
    else:
        print(f"  ✗ pattern not found: {label}")

text, removed = remove_mobile_lang_and_brand(text)
if removed:
    changed += 1
    print("  [OK] removed always-visible mobile lang picker + hidden left brand block")
else:
    print("  [SKIP] mobile lang picker / left brand block already removed (or markers not found)")

if changed:
    path.with_suffix(path.suffix + ".bak3").write_bytes(raw)
    out = text.replace("\n", "\r\n") if crlf else text
    path.write_bytes(out.encode("utf-8"))

print(f"\n{path}: {changed} change(s) applied")
print("\nWHAT CHANGED")
print(" - Mobile header no longer shows the flag; languages now appear as chips at the top of the hamburger menu.")
print(" - Logo is 32px on mobile (same as the avatar circle).")
print(" - 'Plug Walk' title sits in the middle column, immediately after the hamburger.")
print(" - Desktop header is untouched (its language dropdown stays).")