#!/usr/bin/env python3
import sys, re

path = sys.argv[1] if len(sys.argv) > 1 else "src/components/home/ProductCard.tsx"

with open(path, "r") as f:
    src = f.read()

# ── Patch A: Add S.saleBadge after S.lowStock ────────────────────────────────
OLD_A = """  lowStock: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    color: '#888',
    marginLeft: 8,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
};"""

NEW_A = """  lowStock: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    color: '#888',
    marginLeft: 8,
    letterSpacing: '0.5px',
  } as React.CSSProperties,

  saleBadge: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    background: '#C0392B',
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    padding: '5px 10px',
    zIndex: 2,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
};"""

assert OLD_A in src, "PATCH A: target string not found"
src = src.replace(OLD_A, NEW_A, 1)
print("✓ Patch A applied: S.saleBadge added")

# ── Patch B: Sale badge replaces New badge ───────────────────────────────────
OLD_B = """          {/* New badge */}
          {(product as any).created_at && Date.now() - new Date((product as any).created_at).getTime() < 7*24*60*60*1000 && (
            <div style={S.badge('#000', '#fff')}>New</div>
          )}"""

NEW_B = """          {/* Sale badge — takes priority over New badge */}
          {product.sale_price && product.sale_price < Number(product.price) ? (
            <div style={S.saleBadge}>
              ⚡ {Math.round((1 - product.sale_price / Number(product.price)) * 100)}% OFF
            </div>
          ) : (
            (product as any).created_at && Date.now() - new Date((product as any).created_at).getTime() < 7*24*60*60*1000 && (
              <div style={S.badge('#000', '#fff')}>New</div>
            )
          )}"""

assert OLD_B in src, "PATCH B: target string not found"
src = src.replace(OLD_B, NEW_B, 1)
print("✓ Patch B applied: sale badge in image area")

# ── Patch C: Slashed price display ───────────────────────────────────────────
OLD_C = """            <div style={{ display:'flex', alignItems:'baseline' }}>
              <span style={S.price}>KSh {Number(product.price).toLocaleString()}</span>
              {stock > 0 && stock <= 5 && (
                <span style={S.lowStock}>{stock} left</span>
              )}
            </div>"""

NEW_C = """            {product.sale_price && product.sale_price < Number(product.price) ? (
              <div style={{ display:'flex', alignItems:'baseline', gap: 6, flexWrap:'wrap' }}>
                <span style={{ ...S.price, color:'#C0392B', fontWeight:600 }}>
                  KSh {Number(product.sale_price).toLocaleString()}
                </span>
                <span style={{ ...S.price, fontSize:11, fontWeight:400, color:'#888', textDecoration:'line-through' }}>
                  {Number(product.price).toLocaleString()}
                </span>
                {stock > 0 && stock <= 5 && (
                  <span style={S.lowStock}>{stock} left</span>
                )}
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'baseline' }}>
                <span style={S.price}>KSh {Number(product.price).toLocaleString()}</span>
                {stock > 0 && stock <= 5 && (
                  <span style={S.lowStock}>{stock} left</span>
                )}
              </div>
            )}"""

assert OLD_C in src, "PATCH C: target string not found"
src = src.replace(OLD_C, NEW_C, 1)
print("✓ Patch C applied: slashed price display")

with open(path, "w") as f:
    f.write(src)

print(f"\n✅ ProductCard.tsx patched successfully → {path}")
