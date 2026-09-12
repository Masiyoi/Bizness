"""
Patch: src/pages/Homepage.tsx

Fixes the one line the earlier patches never reached: the Navbar's
`categories` prop still references `bannerCategories`, which was never
defined -- and it can't be fixed by pointing at the old `categories` array
either, since patch_homepage_category_tree.py already replaced that array
with `navCategoryNames`. This patch points the Navbar prop at that instead.

Usage:
    python patch_homepage_navbar_categories.py

Run from repo root (C:\\Users\\Administrator\\bizness), or edit TARGET below.
Creates a .bak backup before writing.
"""
import pathlib

TARGET = pathlib.Path("frontend/src/pages/Homepage.tsx")

OLD = """        categories={bannerCategories.filter(c => c.slug !== 'all').map(c => c.name)}"""
NEW = """        categories={navCategoryNames}"""


def main():
    if not TARGET.exists():
        print(f"\u2717 File not found: {TARGET}")
        print("  Edit TARGET at the top of this script to point at Homepage.tsx")
        return

    raw = TARGET.read_bytes()
    had_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    had_crlf = "\r\n" in text
    text_lf = text.replace("\r\n", "\n")

    if OLD not in text_lf:
        print("\u2717 Pattern not found: bannerCategories line")
        print("  No changes made. It may already be fixed, or whitespace differs.")
        return

    backup = TARGET.with_suffix(TARGET.suffix + ".bak2")
    backup.write_bytes(raw)
    print(f"[OK] Backup written: {backup}")

    new_text_lf = text_lf.replace(OLD, NEW)
    out_text = new_text_lf.replace("\n", "\r\n") if had_crlf else new_text_lf
    prefix = "\ufeff" if had_bom else ""
    TARGET.write_bytes((prefix + out_text).encode("utf-8"))
    print(f"[OK] Patched: {TARGET}")
    print("[OK] Navbar categories prop now uses navCategoryNames")


if __name__ == "__main__":
    main()