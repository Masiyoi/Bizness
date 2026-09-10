#!/usr/bin/env python3
"""
Patch: affiliateController.js - updateSalesperson references a non-existent
"updated_at" column on the salespersons table (DB only has created_at),
causing every PATCH /salespersons/:id call (status change, commission edit,
and now the Remove/soft-delete button) to fail with:
    error: column "updated_at" does not exist

Fix: drop "updated_at = now()," from the UPDATE query and RETURNING clause.

Usage:
    python patch_affiliate_updated_at.py [path_to_bizness_repo_root]
"""
import sys
import pathlib

ROOT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")

FILENAME = "affiliateController.js"

PATCHES = [
    {
        "label": "Remove 'updated_at = now()' from UPDATE SET clause",
        "old": (
            "    const query = `\n"
            "      UPDATE salespersons \n"
            "      SET ${updates.join(', ')}, updated_at = now()\n"
            "      WHERE id = $${paramCount}\n"
            "      RETURNING id, coupon_code, commission_pct, status, updated_at\n"
            "    `;"
        ),
        "new": (
            "    const query = `\n"
            "      UPDATE salespersons \n"
            "      SET ${updates.join(', ')}\n"
            "      WHERE id = $${paramCount}\n"
            "      RETURNING id, coupon_code, commission_pct, status\n"
            "    `;"
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