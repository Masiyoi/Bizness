python3 << 'PYEOF'
import re

path = 'src/pages/admin/components/products/AddProductWizard.tsx'
with open(path, 'r') as f:
    src = f.read()

# ── A) Add flash sale state after costPrice state ─────────────────────────────
src = src.replace(
    "  const [costPrice,   setCostPrice]   = useState(editProduct?.cost_price ? String(editProduct.cost_price) : '');",
    """  const [costPrice,   setCostPrice]   = useState(editProduct?.cost_price ? String(editProduct.cost_price) : '');

  // Flash sale
  const [isFlashSale,  setIsFlashSale]  = useState<boolean>(!!(editProduct as any)?.sale_price);
  const [salePrice,    setSalePrice]    = useState<string>((editProduct as any)?.sale_price ? String((editProduct as any).sale_price) : '');
  const [saleEndsAt,   setSaleEndsAt]   = useState<string>((editProduct as any)?.sale_ends_at ? String((editProduct as any).sale_ends_at).slice(0,16) : '');"""
)

# ── B) handleSave: append flash sale fields before onSaved() ─────────────────
src = src.replace(
    "      fd.append('existingImages', JSON.stringify(existingImgs));",
    """      fd.append('existingImages', JSON.stringify(existingImgs));"""
)
src = src.replace(
    "      files.forEach(f => fd.append('images', f));",
    """      fd.append('sale_price',   isFlashSale && salePrice ? salePrice : '');
      fd.append('sale_ends_at', isFlashSale && saleEndsAt ? new Date(saleEndsAt).toISOString() : '');
      files.forEach(f => fd.append('images', f));"""
)

# ── C) Flash sale UI block — insert after the Description textarea block ──────
FLASH_UI = """
              {/* Flash Sale toggle */}
              <div style={{ background: isFlashSale ? '#FFF7ED' : T.grey5, border: `1.5px solid ${isFlashSale ? '#FB923C' : T.grey3}`, borderRadius: 12, padding: '14px 16px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setIsFlashSale(v => !v)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <div>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: isFlashSale ? '#C2410C' : T.black }}>Flash Sale</div>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, marginTop: 1 }}>Set a discounted sale price shown with a slash-through on the homepage</div>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: isFlashSale ? '#F97316' : T.grey3, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: isFlashSale ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: T.white, boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
                  </div>
                </div>

                {isFlashSale && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.2s ease both' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ ...lbl, color: '#C2410C' }}>Original Price (KSh) *</label>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, marginBottom: 4 }}>
                          This is the full price — already set as <strong style={{ color: T.black }}>KSh {Number(price || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: T.grey4, border: `1px solid ${T.grey3}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'Jost,sans-serif', fontSize: 14, fontWeight: 700, color: T.grey1 }}>
                          KSh {Number(price || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label style={{ ...lbl, color: '#C2410C' }}>Sale Price (KSh) *</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: '#C2410C', pointerEvents: 'none' }}>KSh</div>
                          <input
                            className="wz-input"
                            type="number" min="0"
                            placeholder="0"
                            value={salePrice}
                            onChange={e => setSalePrice(e.target.value)}
                            style={{ ...inp, paddingLeft: 46, borderColor: salePrice && Number(salePrice) > 0 ? '#F97316' : T.grey3, background: '#FFF7ED' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live discount preview */}
                    {salePrice && Number(salePrice) > 0 && Number(price) > 0 && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: Number(salePrice) < Number(price) ? '#FFF7ED' : '#FEF2F2',
                        border: `1px solid ${Number(salePrice) < Number(price) ? '#FED7AA' : '#FECACA'}`,
                        display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
                      }}>
                        {Number(salePrice) < Number(price) ? (
                          <>
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700, color: '#C2410C' }}>
                              🔥 {Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100)}% OFF
                            </span>
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: '#92400E' }}>
                              Customer saves KSh {(Number(price) - Number(salePrice)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: '#991B1B', fontWeight: 700 }}>⚠ Sale price must be lower than original price</span>
                        )}
                      </div>
                    )}

                    <div>
                      <label style={lbl}>Sale Ends <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.grey2, fontSize: 10, marginLeft: 4 }}>(optional — leave blank for no expiry)</span></label>
                      <input
                        className="wz-input"
                        type="datetime-local"
                        value={saleEndsAt}
                        onChange={e => setSaleEndsAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        style={{ ...inp, colorScheme: 'light' }}
                      />
                    </div>
                  </div>
                )}
              </div>
"""

src = src.replace(
    '              {/* Description */}\n              <div>',
    FLASH_UI + '\n              {/* Description */}\n              <div>'
)

# ── D) Step 3 Review — flash badge after MarginPreview ───────────────────────
FLASH_REVIEW = """
                  {/* Flash sale badge in review */}
                  {isFlashSale && salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(price) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, color: '#C2410C' }}>
                          Flash Sale — {Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100)}% OFF
                        </div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: '#92400E', marginTop: 2 }}>
                          KSh {Number(price).toLocaleString()} → KSh {Number(salePrice).toLocaleString()}
                          {saleEndsAt && ` · Ends ${new Date(saleEndsAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`}
                        </div>
                      </div>
                    </div>
                  )}
"""

src = src.replace(
    '                  {/* Live margin in review */}\n                  <MarginPreview price={price} costPrice={costPrice}/>',
    '                  {/* Live margin in review */}\n                  <MarginPreview price={price} costPrice={costPrice}/>' + FLASH_REVIEW
)

with open(path, 'w') as f:
    f.write(src)

print("✅ AddProductWizard.tsx patched successfully")
PYEOF