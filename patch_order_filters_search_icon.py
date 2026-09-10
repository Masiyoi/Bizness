#!/usr/bin/env python3
"""
Patch: OrderFilters.tsx - search bar emoji -> /search.png (same structure
as ProductsTab.tsx's search bar).

Usage:
    python patch_order_filters_search_icon.py [path_to_bizness_repo_root]
"""
import sys
import pathlib

ROOT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")

FILENAME = "OrderFilters.tsx"

PATCHES = [
    {
        "label": "Search bar icon -> /search.png",
        "old": (
            "      <div style={{ display: 'flex', alignItems: 'center', background: T.white, "
            "border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, "
            "minWidth: 220 }}>\n"
            "        <span style={{ opacity: 0.35, fontSize: 14 }}>\U0001F50D</span>\n"
            "        <input"
        ),
        "new": (
            "      <div style={{ display: 'flex', alignItems: 'center', background: T.white, "
            "border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, "
            "minWidth: 220 }}>\n"
            "        <img src=\"/search.png\" alt=\"\" style={{ width: 14, height: 14, opacity: 0.45, "
            "flexShrink: 0 }}/>\n"
            "        <input"
        ),
    },
]


def patch_file(path: pathlib.Path) -> None:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    normalized = text.replace("\r\n", "\n")
    had_crlf = "\r\n" in text

    changed = False
    for p in PATCHES:
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
    matches = list(ROOT.rglob(FILENAME))
    if not matches:
        print(f"[\u2717] Could not find {FILENAME} under {ROOT.resolve()}")
        return
    for match in matches:
        patch_file(match)


if __name__ == "__main__":
    main()