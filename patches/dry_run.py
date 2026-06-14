#!/usr/bin/env python3
import sys, os

checks = {
    "ProductCard.tsx": {
        "PATCH A — S.lowStock block": (
            "  lowStock: {\n"
            "    fontFamily: \"'DM Sans', sans-serif\",\n"
            "    fontSize: 10,\n"
            "    color: '#888',\n"
            "    marginLeft: 8,\n"
            "    letterSpacing: '0.5px',\n"
            "  } as React.CSSProperties,\n"
            "};"
        ),
        "PATCH B — New badge block": (
            "          {/* New badge */}\n"
            "          {(product as any).created_at && Date.now() - new Date((product as any).created_at).getTime() < 7*24*60*60*1000 && (\n"
            "            <div style={S.badge('#000', '#fff')}>New</div>\n"
            "          )}"
        ),
        "PATCH C — price display": (
            "            <div style={{ display:'flex', alignItems:'baseline' }}>\n"
            "              <span style={S.price}>KSh {Number(product.price).toLocaleString()}</span>\n"
            "              {stock > 0 && stock <= 5 && (\n"
            "                <span style={S.lowStock}>{stock} left</span>\n"
            "              )}\n"
            "            </div>"
        ),
    },
    "AddProductWizard.tsx": {
        "PATCH D — colors state comment": (
            "  // Colors & sizes\n"
            "  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);"
        ),
        "PATCH E — features FormData append": (
            "      fd.append('features',    JSON.stringify([]));\n"
            "      fd.append('colors',      JSON.stringify(colors));"
        ),
        "PATCH F — Description label": (
            "                {/* Description */}\n"
            "                <div>\n"
            "                  <label style={lbl}>\n"
            "                    Description\n"
            "                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional)</span>\n"
            "                  </label>"
        ),
        "PATCH G — description review block": (
            "                  {description.trim() && (\n"
            "                    <div style={{ background:T.cream, borderRadius:10, padding:'11px 14px', border:`1px solid ${T.cream3}` }}>\n"
            "                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Description</div>\n"
            "                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy, lineHeight:1.7 }}>{description}</div>\n"
            "                    </div>\n"
            "                  )}"
        ),
    },
    "Homepage.tsx": {
        "PATCH H — sort CSS end": (
            "  .lp-sort:hover { border-color: var(--ink) }\n"
            "`;"
        ),
        "PATCH I — Homepage component comment": (
            "/* ─── Homepage component ─────────────────────────────────────────────────── */\n"
            "export default function Homepage() {"
        ),
        "PATCH J — TrustStrip in JSX": (
            "      <Hero onShop={() => selectCategory('All')} />\n"
            "      <TrustStrip />\n"
            "      <StatsBar productCount={products.length} />"
        ),
    },
}

files = {
    "ProductCard.tsx":      sys.argv[1] if len(sys.argv) > 1 else "src/components/home/ProductCard.tsx",
    "AddProductWizard.tsx": sys.argv[2] if len(sys.argv) > 2 else "src/components/admin/AddProductWizard.tsx",
    "Homepage.tsx":         sys.argv[3] if len(sys.argv) > 3 else "src/pages/Homepage.tsx",
}

all_ok = True
for fname, patches in checks.items():
    fpath = files[fname]
    if not os.path.exists(fpath):
        print(f"  ⚠  SKIP  {fname} — file not found at {fpath}")
        all_ok = False
        continue
    with open(fpath) as f:
        content = f.read()
    for label, needle in patches.items():
        if needle in content:
            print(f"  ✓  FOUND   [{fname}] {label}")
        else:
            print(f"  ✗  MISSING [{fname}] {label}")
            all_ok = False

print()
if all_ok:
    print("✅  All target strings matched — patches will apply cleanly.")
else:
    print("❌  Some strings not found — share the output and we'll adjust.")
