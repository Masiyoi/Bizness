#!/usr/bin/env python3
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/components/admin/AddProductWizard.tsx"

with open(path, "r") as f:
    src = f.read()

# ── Patch D: Add salePrice / saleEndsAt state ────────────────────────────────
OLD_D = """  // Colors & sizes
  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);"""

NEW_D = """  // Sale / discount
  const [salePrice,  setSalePrice]  = useState<string>(editProduct?.sale_price   ? String(editProduct.sale_price)   : '');
  const [saleEndsAt, setSaleEndsAt] = useState<string>(editProduct?.sale_ends_at ? editProduct.sale_ends_at.slice(0,16) : '');

  // Colors & sizes
  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);"""

assert OLD_D in src, "PATCH D: target string not found"
src = src.replace(OLD_D, NEW_D, 1)
print("✓ Patch D applied: salePrice + saleEndsAt state")

# ── Patch E: Append sale fields to FormData ───────────────────────────────────
OLD_E = """      fd.append('features',    JSON.stringify([]));
      fd.append('colors',      JSON.stringify(colors));"""

NEW_E = """      fd.append('features',    JSON.stringify([]));
      if (salePrice && Number(salePrice) > 0)  fd.append('sale_price',   salePrice);
      if (saleEndsAt) fd.append('sale_ends_at', new Date(saleEndsAt).toISOString());
      fd.append('colors',      JSON.stringify(colors));"""

assert OLD_E in src, "PATCH E: target string not found"
src = src.replace(OLD_E, NEW_E, 1)
print("✓ Patch E applied: sale fields appended to FormData")

# ── Patch F: Sale fields UI in Step 2 ────────────────────────────────────────
OLD_F = """                {/* Description */}
                <div>
                  <label style={lbl}>
                    Description
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional)</span>
                  </label>"""

NEW_F = """                {/* ── Flash Sale Pricing ─────────────────────────── */}
                <div style={{ background:'#FFF8F8', border:'1.5px solid #F5C6C0', borderRadius:14, padding:'16px 16px 14px' }}>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase' as const, color:'#C0392B', marginBottom:14 }}>
                    ⚡ Flash Sale (optional)
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:12 }}>
                    <div>
                      <label style={{ ...lbl, color:'#C0392B' }}>Sale Price (KSh)</label>
                      <div style={{ position:'relative' }}>
                        <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:'#C0392B', pointerEvents:'none' }}>KSh</div>
                        <input
                          className="wz-input wz-num"
                          type="number"
                          min="0"
                          placeholder="Discounted price"
                          value={salePrice}
                          onChange={e => setSalePrice(e.target.value)}
                          style={{ ...inp, paddingLeft:52, borderColor: salePrice && Number(salePrice) > 0 ? '#C0392B' : T.cream3 }}
                        />
                      </div>
                      {salePrice && price && Number(salePrice) < Number(price) && (
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#C0392B', marginTop:5 }}>
                          ✓ {Math.round((1 - Number(salePrice)/Number(price))*100)}% discount off KSh {Number(price).toLocaleString()}
                        </div>
                      )}
                      {salePrice && price && Number(salePrice) >= Number(price) && (
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#B7791F', marginTop:5 }}>
                          ⚠ Sale price must be lower than the regular price
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ ...lbl, color:'#C0392B' }}>Sale Ends At <span style={{ fontWeight:400, textTransform:'none' as const, letterSpacing:0, fontSize:10 }}>(leave blank = no expiry)</span></label>
                      <input
                        className="wz-input"
                        type="datetime-local"
                        value={saleEndsAt}
                        onChange={e => setSaleEndsAt(e.target.value)}
                        style={{ ...inp, borderColor: saleEndsAt ? '#C0392B' : T.cream3 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={lbl}>
                    Description
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional)</span>
                  </label>"""

assert OLD_F in src, "PATCH F: target string not found"
src = src.replace(OLD_F, NEW_F, 1)
print("✓ Patch F applied: Flash sale UI in Step 2")

# ── Patch G: Sale preview in Step 3 review ───────────────────────────────────
OLD_G = """                  {description.trim() && (
                    <div style={{ background:T.cream, borderRadius:10, padding:'11px 14px', border:`1px solid ${T.cream3}` }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Description</div>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy, lineHeight:1.7 }}>{description}</div>
                    </div>
                  )}"""

NEW_G = """                  {description.trim() && (
                    <div style={{ background:T.cream, borderRadius:10, padding:'11px 14px', border:`1px solid ${T.cream3}` }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Description</div>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy, lineHeight:1.7 }}>{description}</div>
                    </div>
                  )}

                  {salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(price) && (
                    <div style={{ background:'#FFF8F8', borderRadius:10, padding:'11px 14px', border:'1px solid #F5C6C0' }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:'#C0392B', letterSpacing:'1.5px', textTransform:'uppercase' as const, marginBottom:6 }}>⚡ Flash Sale</div>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:'#C0392B', fontWeight:700 }}>
                        KSh {Number(salePrice).toLocaleString()}
                        <span style={{ fontWeight:400, color:'#888', textDecoration:'line-through', marginLeft:8, fontSize:12 }}>
                          KSh {Number(price).toLocaleString()}
                        </span>
                        <span style={{ marginLeft:8, background:'#C0392B', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 6px', letterSpacing:'1px' }}>
                          {Math.round((1 - Number(salePrice)/Number(price))*100)}% OFF
                        </span>
                      </div>
                      {saleEndsAt && (
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#888', marginTop:4 }}>
                          Ends: {new Date(saleEndsAt).toLocaleString('en-KE', { dateStyle:'medium', timeStyle:'short' })}
                        </div>
                      )}
                    </div>
                  )}"""

assert OLD_G in src, "PATCH G: target string not found"
src = src.replace(OLD_G, NEW_G, 1)
print("✓ Patch G applied: sale preview in Step 3")

with open(path, "w") as f:
    f.write(src)

print(f"\n✅ AddProductWizard patched successfully → {path}")
