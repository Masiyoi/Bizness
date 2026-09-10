#!/usr/bin/env python3
"""
Patch:
  1. ProductsTab.tsx  - search bar emoji (fa) -> /search.png
  2. CustomersTab.tsx - search bar emoji -> /search.png (restructured into an
                         icon+input wrapper, matching Products' layout)
                       - "Pending" filter pill emoji -> /pending.png

Assumes the export names CustomersTab / OrdersTab / ProductsTab map onto
files named CustomersTab.tsx / OrdersTab.tsx / ProductsTab.tsx (same
convention as AffiliateManagement.tsx). If your actual filenames differ,
this script will just report "not found" for that entry - rename the
FILENAME values below to match and re-run.

Usage:
    python patch_admin_search_pending_icons.py [path_to_bizness_repo_root]
"""
import sys
import pathlib

ROOT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")

FILE_PATCHES = {
    "ProductsTab.tsx": [
        {
            "label": "Search bar icon -> /search.png",
            "old": (
                "        <div style={{ display: 'flex', alignItems: 'center', background: T.white, "
                "border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, "
                "minWidth: 200 }}>\n"
                "          <span style={{ opacity: 0.35, fontSize: 14 }}>\U0001F50D</span>\n"
                "          <input"
            ),
            "new": (
                "        <div style={{ display: 'flex', alignItems: 'center', background: T.white, "
                "border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, "
                "minWidth: 200 }}>\n"
                "          <img src=\"/search.png\" alt=\"\" style={{ width: 14, height: 14, opacity: 0.45, "
                "flexShrink: 0 }}/>\n"
                "          <input"
            ),
        },
    ],
    "CustomersTab.tsx": [
        {
            "label": "Search bar -> icon+input wrapper using /search.png",
            "old": (
                "      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>\n"
                "        <input\n"
                "          value={search}\n"
                "          onChange={e => setSearch(e.target.value)}\n"
                "          placeholder=\"\U0001F50D  Search by name, email or phone\u2026\"\n"
                "          style={{ flex: 1, minWidth: 200, fontFamily: 'Jost,sans-serif', fontSize: 13, "
                "color: T.black, background: T.white, border: `1.5px solid ${T.grey3}`, borderRadius: 9, "
                "padding: '9px 13px', outline: 'none' }}\n"
                "        />\n"
            ),
            "new": (
                "      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>\n"
                "        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 200, "
                "background: T.white, border: `1.5px solid ${T.grey3}`, borderRadius: 9, padding: '0 13px', "
                "gap: 9 }}>\n"
                "          <img src=\"/search.png\" alt=\"\" style={{ width: 14, height: 14, opacity: 0.45, "
                "flexShrink: 0 }}/>\n"
                "          <input\n"
                "            value={search}\n"
                "            onChange={e => setSearch(e.target.value)}\n"
                "            placeholder=\"Search by name, email or phone\u2026\"\n"
                "            style={{ flex: 1, fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, "
                "background: 'transparent', border: 'none', padding: '9px 0', outline: 'none' }}\n"
                "          />\n"
                "        </div>\n"
            ),
        },
        {
            "label": "'Pending' filter pill -> /pending.png",
            "old": (
                "            {f === 'unverified' ? '\u23F3 Pending' : f === 'verified' ? '\u2713 Verified' : 'All'}"
            ),
            "new": (
                "            {f === 'unverified' ? (\n"
                "              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>\n"
                "                <img src=\"/pending.png\" alt=\"\" style={{ width: 12, height: 12 }}/> Pending\n"
                "              </span>\n"
                "            ) : f === 'verified' ? '\u2713 Verified' : 'All'}"
            ),
        },
    ],
}


def patch_file(path: pathlib.Path, patches: list[dict]) -> None:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    normalized = text.replace("\r\n", "\n")
    had_crlf = "\r\n" in text

    changed = False
    for p in patches:
        old, new, label = p["old"], p["new"], p["label"]
        count = normalized.count(old)
        if count == 0:
            print(f"[\u2717] {path.name}: pattern not found for: {label}")
            continue
        if count > 1:
            print(f"[\u2717] {path.name}: pattern matched {count} times (expected 1) for: {label}")
            continue
        normalized = normalized.replace(old, new)
        changed = True
        print(f"[OK] {path.name}: {label}")

    if not changed:
        return

    backup = path.with_suffix(path.suffix + ".bak")
    backup.write_bytes(raw)

    out = normalized.replace("\n", "\r\n") if had_crlf else normalized
    path.write_bytes(out.encode("utf-8"))


def main():
    for filename, patches in FILE_PATCHES.items():
        matches = list(ROOT.rglob(filename))
        if not matches:
            print(f"[\u2717] Could not find {filename} under {ROOT.resolve()}")
            continue
        for match in matches:
            patch_file(match, patches)


if __name__ == "__main__":
    main()