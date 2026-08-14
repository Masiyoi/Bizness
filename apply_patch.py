import pathlib, re
# ── 1. Rename the animation file to something URL-safe ──────────────────────
anim_dir = pathlib.Path("frontend/public/animations")
old_name = anim_dir / "SALE ANIMATION (2).json"
new_name = anim_dir / "sale_animation.json"
if new_name.exists():
    print(f"{new_name} already exists — skipping rename")
elif old_name.exists():
    old_name.rename(new_name)
    print(f"Renamed: {old_name.name} -> {new_name.name}")
else:
    print(f"WARNING: {old_name} not found — checking what's actually in the folder:")
    for f in anim_dir.iterdir():
        print(" -", f.name)
    raise SystemExit("Aborting — fix the filename above and rerun")
# ── 2. Edit FlashSaleStrip.tsx ────────────────────────────────────────────────
strip_path = pathlib.Path("frontend/src/components/home/FlashSaleStrip.tsx")
if not strip_path.exists():
    # fallback search in case the folder differs
    matches = list(pathlib.Path("frontend/src").rglob("FlashSaleStrip.tsx"))
    assert matches, "Could not find FlashSaleStrip.tsx anywhere under frontend/src"
    strip_path = matches[0]
    print(f"Found FlashSaleStrip.tsx at: {strip_path}")
src = strip_path.read_text(encoding="utf-8")
if "DotLottieReact" in src:
    print("DotLottieReact already imported in FlashSaleStrip.tsx — skipping import add")
else:
    import_anchor = "import type { Product } from '../../constants/theme';"
    assert import_anchor in src, "Could not find the Product type import line to anchor the new import"
    src = src.replace(
        import_anchor,
        import_anchor + "\nimport { DotLottieReact } from '@lottiefiles/dotlottie-react';",
        1
    )
    print("Added DotLottieReact import")
# Replace the fire emoji span with the lottie animation
emoji_pattern = re.compile(r"<span style=\{\{\s*fontSize:\s*22\s*\}\}>🔥</span>")
m = emoji_pattern.search(src)
if not m:
    print("Could not find the fire-emoji span. Showing context around 'Limited Time' instead:")
    idx = src.find("Limited Time")
    print(src[max(0, idx-300): idx+100] if idx != -1 else "'Limited Time' not found either")
    raise SystemExit("Aborting — paste the printed context back so the anchor can be fixed")
replacement = (
    '<DotLottieReact\n'
    '            src="/animations/sale_animation.json"\n'
    '            loop\n'
    '            autoplay\n'
    '            style={{ width: 32, height: 32, flexShrink: 0 }}\n'
    '          />'
)
src = emoji_pattern.sub(replacement, src, count=1)
strip_path.write_text(src, encoding="utf-8")
print("FlashSaleStrip.tsx updated — fire emoji replaced with Lottie animation")
