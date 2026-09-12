"""
Patch: src/constants/theme.ts
Replaces the old (pre-overhaul) CATEGORIES list -- Clothes, Shoes, Female Wear,
Sneakers, Jerseys, etc -- with the current ten categories: Tops, Bottoms,
Outwear, Heels, Accessories, Bags, Footwear, Sets, Headgear, Hoodies and
jackets. Each entry now also carries a `slug` (kebab-case, no gender prefix)
so this list can double as a CategoryItem[] source for CategoryBanner.

Usage:
    python patch_theme_categories.py

Run from repo root (C:\\Users\\Administrator\\bizness), or edit TARGET below.
Creates a .bak backup before writing.
"""
import pathlib

TARGET = pathlib.Path("frontend/src/constants/theme.ts")

OLD = """export const CATEGORIES = [
  { label:'All',         icon:'\U0001F451', desc:'Full Collection'  },
  { label:'Clothes',     icon:'\U0001F457', desc:'Tops & Bottoms'   },
  { label:'Shoes',       icon:'\U0001F45F', desc:'All Footwear'     },
  { label:'Bags',        icon:'\U0001F45C', desc:'Bags & Purses'    },
  { label:'Female Wear', icon:'\U0001F483', desc:"Women's Fashion"  },
  { label:'Sneakers',    icon:'\U0001F460', desc:'Kicks & Trainers' },
  { label:'Jackets',     icon:'\U0001F9E5', desc:'Outerwear'        },
  { label:'Socks',       icon:'\U0001F9E6', desc:'Every Pair'       },
  { label:'Jerseys',     icon:'\u26BD', desc:'Team & Sport'     },
  { label:'Hoodies',     icon:'\U0001F3F7\uFE0F', desc:'Comfy Fleece'    },
] as const;"""

NEW = """export const CATEGORIES = [
  { label:'All',                 slug:'all',             icon:'\U0001F451', desc:'Full Collection'   },
  { label:'Tops',                slug:'tops',            icon:'\U0001F455', desc:'Shirts & Blouses'  },
  { label:'Bottoms',             slug:'bottoms',         icon:'\U0001F456', desc:'Pants & Skirts'    },
  { label:'Outwear',             slug:'outwear',         icon:'\U0001F9E5', desc:'Coats & Layers'    },
  { label:'Heels',                slug:'heels',           icon:'\U0001F460', desc:'Statement Heels'   },
  { label:'Accessories',         slug:'accessories',     icon:'\U0001F45C', desc:'Finishing Touches' },
  { label:'Bags',                slug:'bags',            icon:'\U0001F45C', desc:'Bags & Purses'     },
  { label:'Footwear',            slug:'footwear',        icon:'\U0001F45F', desc:'All Footwear'      },
  { label:'Sets',                slug:'sets',            icon:'\u2728', desc:'Coordinated Fits'  },
  { label:'Headgear',            slug:'headgear',        icon:'\U0001F9E2', desc:'Caps & Hats'       },
  { label:'Hoodies and jackets', slug:'hoodies-jackets', icon:'\U0001F3F7\uFE0F', desc:'Comfy Fleece'      },
] as const;"""


def main():
    if not TARGET.exists():
        print(f"\u2717 File not found: {TARGET}")
        print("  Edit TARGET at the top of this script to point at theme.ts")
        return

    raw = TARGET.read_bytes()
    text = raw.decode("utf-8-sig")
    had_bom = raw.startswith(b"\xef\xbb\xbf")
    had_crlf = "\r\n" in text
    text_lf = text.replace("\r\n", "\n")

    if OLD not in text_lf:
        print("\u2717 Pattern not found: old CATEGORIES block")
        print("  No changes made. It may already be updated, or whitespace differs.")
        return

    backup = TARGET.with_suffix(TARGET.suffix + ".bak")
    backup.write_bytes(raw)
    print(f"[OK] Backup written: {backup}")

    new_text_lf = text_lf.replace(OLD, NEW)
    out_text = new_text_lf.replace("\n", "\r\n") if had_crlf else new_text_lf
    prefix = "\ufeff" if had_bom else ""
    TARGET.write_bytes((prefix + out_text).encode("utf-8"))
    print(f"[OK] Patched: {TARGET}")
    print("[OK] CATEGORIES now lists the ten current categories, each with a slug")


if __name__ == "__main__":
    main()