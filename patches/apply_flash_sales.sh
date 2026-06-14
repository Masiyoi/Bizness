#!/usr/bin/env bash
set -e

PRODUCTCARD="${PRODUCTCARD:-src/components/home/ProductCard.tsx}"
WIZARD="${WIZARD:-src/components/admin/AddProductWizard.tsx}"
HOMEPAGE="${HOMEPAGE:-src/pages/Homepage.tsx}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         Luku Prime — Flash Sales Patch               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

for FILE in "$PRODUCTCARD" "$WIZARD" "$HOMEPAGE"; do
  if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    echo "   Set the correct path via env var and re-run."
    exit 1
  fi
done
echo "✓ All target files found"
echo ""

BACKUP_DIR=".flash_sales_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$PRODUCTCARD" "$BACKUP_DIR/"
cp "$WIZARD"      "$BACKUP_DIR/"
cp "$HOMEPAGE"    "$BACKUP_DIR/"
echo "✓ Backups saved to $BACKUP_DIR/"
echo ""

echo "── Patching ProductCard.tsx ──"
python3 "$SCRIPT_DIR/patch_productcard.py" "$PRODUCTCARD"
echo ""

echo "── Patching AddProductWizard.tsx ──"
python3 "$SCRIPT_DIR/patch_wizard.py" "$WIZARD"
echo ""

echo "── Patching Homepage.tsx ──"
python3 "$SCRIPT_DIR/patch_homepage.py" "$HOMEPAGE"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  All patches applied successfully                ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Remaining manual steps:                             ║"
echo "║  1. Run DB migration (ALTER TABLE products ...)      ║"
echo "║  2. Add sale_price? + sale_ends_at? to theme.ts      ║"
echo "║  3. Register /flash-sales route above /:id           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
