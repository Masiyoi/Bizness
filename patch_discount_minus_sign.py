#!/usr/bin/env python3
"""
Patch: AdminDiscounts.tsx - "Total Discount Given" minus sign renders
slanted because it inherits the Cormorant Garamond serif font. Wraps just
the "-" in a Jost (sans-serif) span so it renders flat, while the KSh
amount stays in the serif display font.

Must run AFTER patch_discounts_members.py (which added the green color +
minus sign this patch builds on).

Usage:
    python patch_discount_minus_sign.py [path_to_bizness_repo_root]
"""
import sys
import pathlib

ROOT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")

FILENAME = "AdminDiscounts.tsx"

PATCHES = [
    {
        "label": "Flatten minus sign in Total Discount Given stat",
        "old": (
            '          <p style={{ fontFamily: "\'Cormorant Garamond\',serif", '
            'fontWeight: 700, fontSize: 28, color: \'#1F8A3D\' }}>\n'
            "            {loading ? '\u2014' : `-KSh ${(data?.totalDiscountAmount ?? 0).toLocaleString()}`}\n"
            "          </p>"
        ),
        "new": (
            '          <p style={{ fontFamily: "\'Cormorant Garamond\',serif", '
            'fontWeight: 700, fontSize: 28, color: \'#1F8A3D\' }}>\n'
            "            {loading ? '\u2014' : (\n"
            "              <>\n"
            "                <span style={{ fontFamily: 'Jost,sans-serif' }}>-</span>\n"
            "                {`KSh ${(data?.totalDiscountAmount ?? 0).toLocaleString()}`}\n"
            "              </>\n"
            "            )}\n"
            "          </p>"
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