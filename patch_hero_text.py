import pathlib
def find_file(root, filename):
    matches = list(pathlib.Path(root).rglob(filename))
    if not matches:
        print(f"[FAIL] Could not find {filename} under {root}")
        return None
    if len(matches) > 1:
        print(f"[WARN] Multiple matches for {filename}, using first: {matches[0]}")
    return matches[0]
def patch_file(path, replacements):
    if path is None:
        return
    raw = path.read_bytes()
    text = raw.replace(b'\r\n', b'\n').decode('utf-8')
    backup = path.with_suffix(path.suffix + '.bak')
    backup.write_bytes(raw)
    changed = 0
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new, 1)
            changed += 1
            print(f"[OK] Applied patch in {path.name} ({changed}/{len(replacements)})")
        else:
            print(f"[FAIL] Pattern not found in {path.name}: {old[:60]!r}...")
    if changed:
        out = text.replace('\n', '\r\n').encode('utf-8')
        path.write_bytes(out)
        print(f"[OK] Wrote {path} ({changed} patch(es) applied, backup at {backup.name})")
    else:
        print(f"[SKIP] No changes applied to {path}, backup left untouched")
homepage_path = find_file('frontend', 'Homepage.tsx')
homepage_replacements = [
(
'''          <h2 className="lp-hero-panel-title">Most<br/>Wanted</h2>''',
'''          <h2 className="lp-hero-panel-title">Plug Walk<br/>Essentials</h2>'''
),
]
patch_file(homepage_path, homepage_replacements)
