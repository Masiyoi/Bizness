import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Product } from '../../types';
import { T, CATEGORIES, lbl, inp } from '../../constants';
import { authH } from '../../utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface Variant {
  color: string;
  size:  string;
  stock: number;
  sku:   string;
}

interface WizardProps {
  onClose:      () => void;
  onSaved:      () => void;
  editProduct?: (Product & { variants?: Variant[] }) | null;
}

// ── Tag pill ─────────────────────────────────────────────────────────────────
function TagPill({ label, dot, onRemove }: { label: string; dot?: string; onRemove: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:20, padding:'5px 10px 5px 8px', fontFamily:'Jost,sans-serif', fontSize:12, color:T.navy }}>
      {dot && <div style={{ width:14, height:14, borderRadius:'50%', background:dot, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>}
      <span style={{ fontWeight:600 }}>{label}</span>
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, fontSize:15, lineHeight:1, padding:0, display:'flex', alignItems:'center', marginLeft:2 }}>×</button>
    </div>
  );
}

// ── Variant grid ─────────────────────────────────────────────────────────────
function VariantGrid({
  colors, sizes, variants, onChange,
}: {
  colors:   string[];
  sizes:    string[];
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}) {
  const updateStock = (color: string, size: string, stock: number) =>
    onChange(variants.map(v => v.color === color && v.size === size ? { ...v, stock } : v));

  const updateSku = (color: string, size: string, sku: string) =>
    onChange(variants.map(v => v.color === color && v.size === size ? { ...v, sku } : v));

  const stockColor = (stock: number) =>
    stock === 0 ? { bg:'#FDF0EE', border:'#F5C6C0', text:'#C0392B' } :
    stock <= 5  ? { bg:'#FDF8EC', border:'#F6E4A0', text:'#B7791F' } :
                  { bg:'#EEF5EE', border:'#C8DFC8', text:'#2E7D32' };

  // Color-only (no sizes)
  if (colors.length > 0 && sizes.length === 0) {
    return (
      <div>
        <div style={sectionLabel}>Stock per colour</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {colors.map(color => {
            const v = variants.find(x => x.color === color && !x.size);
            const stock = v?.stock ?? 0;
            const c = stockColor(stock);
            return (
              <div key={color} style={{ display:'flex', alignItems:'center', gap:12, background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:10, padding:'10px 14px' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:color, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>
                <span style={{ fontFamily:'Jost,sans-serif', fontSize:13, fontWeight:600, color:T.navy, flex:1 }}>{color}</span>
                <input
                  type="number" min={0} value={stock}
                  onChange={e => updateStock(color, '', Number(e.target.value))}
                  style={{ width:72, textAlign:'center', background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'7px 4px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:15, color:c.text, outline:'none' }}
                />
                <span style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>units</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:10, fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>
          Total: <strong style={{ color:T.navy }}>{variants.reduce((s,v)=>s+v.stock,0)}</strong> units across all colours
        </div>
      </div>
    );
  }

  // Size-only (no colors)
  if (sizes.length > 0 && colors.length === 0) {
    return (
      <div>
        <div style={sectionLabel}>Stock per size</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {sizes.map(size => {
            const v = variants.find(x => x.size === size && !x.color);
            const stock = v?.stock ?? 0;
            const c = stockColor(stock);
            return (
              <div key={size} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:10, padding:'10px 12px', minWidth:80 }}>
                <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:700, color:T.navy }}>{size}</span>
                <input
                  type="number" min={0} value={stock}
                  onChange={e => updateStock('', size, Number(e.target.value))}
                  style={{ width:60, textAlign:'center', background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:8, padding:'6px 2px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14, color:c.text, outline:'none' }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:10, fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>
          Total: <strong style={{ color:T.navy }}>{variants.reduce((s,v)=>s+v.stock,0)}</strong> units across all sizes
        </div>
      </div>
    );
  }

  // Full color × size matrix
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={sectionLabel}>Stock per variant (colour × size)</div>
        <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>
          Total: <strong style={{ color:T.navy }}>{totalStock}</strong> units
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:10, flexWrap:'wrap' }}>
        {[{ label:'Out of stock', bg:'#FDF0EE', border:'#F5C6C0', text:'#C0392B' },
          { label:'Low (≤5)',     bg:'#FDF8EC', border:'#F6E4A0', text:'#B7791F' },
          { label:'In stock',    bg:'#EEF5EE', border:'#C8DFC8', text:'#2E7D32' }].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:l.bg, border:`1px solid ${l.border}` }}/>
            <span style={{ fontFamily:'Jost,sans-serif', fontSize:10, color:T.muted }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX:'auto', borderRadius:10, border:`1px solid ${T.cream3}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'Jost,sans-serif', fontSize:13 }}>
          <thead>
            <tr style={{ background:T.cream2 }}>
              <th style={{ textAlign:'left', padding:'10px 12px', color:T.muted, fontWeight:700, fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', borderBottom:`1px solid ${T.cream3}`, whiteSpace:'nowrap' }}>
                Colour
              </th>
              {sizes.map(size => (
                <th key={size} style={{ padding:'10px 12px', color:T.navy, fontWeight:700, fontSize:12, borderBottom:`1px solid ${T.cream3}`, textAlign:'center', minWidth:80, whiteSpace:'nowrap' }}>
                  {size}
                </th>
              ))}
              <th style={{ padding:'10px 12px', color:T.muted, fontWeight:700, fontSize:10, letterSpacing:'1px', textTransform:'uppercase', borderBottom:`1px solid ${T.cream3}`, textAlign:'center', whiteSpace:'nowrap' }}>
                Row total
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color, ci) => {
              const rowVariants = variants.filter(v => v.color === color);
              const rowTotal    = rowVariants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={color} style={{ background: ci % 2 === 0 ? '#fff' : T.cream }}>
                  {/* Color label */}
                  <td style={{ padding:'8px 12px', borderBottom:`1px solid ${T.cream3}`, whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background:color, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>
                      <span style={{ fontWeight:600, color:T.navy, fontSize:12 }}>{color}</span>
                    </div>
                  </td>

                  {/* Stock input per size */}
                  {sizes.map(size => {
                    const v     = variants.find(x => x.color === color && x.size === size);
                    const stock = v?.stock ?? 0;
                    const c     = stockColor(stock);
                    return (
                      <td key={size} style={{ padding:'6px 8px', textAlign:'center', borderBottom:`1px solid ${T.cream3}` }}>
                        <input
                          type="number" min={0} value={stock}
                          onChange={e => updateStock(color, size, Number(e.target.value))}
                          style={{
                            width:64, textAlign:'center',
                            background:c.bg, border:`1.5px solid ${c.border}`,
                            borderRadius:8, padding:'7px 4px',
                            fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14,
                            color:c.text, outline:'none', transition:'all 0.15s',
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* Row total */}
                  <td style={{ padding:'8px 12px', textAlign:'center', borderBottom:`1px solid ${T.cream3}` }}>
                    <span style={{
                      fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:700,
                      color: rowTotal === 0 ? '#C0392B' : rowTotal <= 10 ? '#B7791F' : T.navy,
                    }}>
                      {rowTotal}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Column totals */}
            <tr style={{ background:T.cream2 }}>
              <td style={{ padding:'8px 12px', fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase' }}>
                Size total
              </td>
              {sizes.map(size => {
                const colTotal = variants.filter(v => v.size === size).reduce((s, v) => s + v.stock, 0);
                return (
                  <td key={size} style={{ padding:'8px 12px', textAlign:'center' }}>
                    <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:700, color: colTotal === 0 ? '#C0392B' : T.navy }}>
                      {colTotal}
                    </span>
                  </td>
                );
              })}
              <td style={{ padding:'8px 12px', textAlign:'center' }}>
                <span style={{ fontFamily:'Jost,sans-serif', fontSize:13, fontWeight:700, color:T.gold }}>
                  {totalStock}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SKU inputs — collapsible hint */}
      <details style={{ marginTop:14 }}>
        <summary style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, cursor:'pointer', userSelect:'none', listStyle:'none', display:'flex', alignItems:'center', gap:6 }}>
          <span>▸</span> Add SKU codes (optional)
        </summary>
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
          {variants.map((v, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:v.color||'#ccc', border:'1px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>
              <span style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.navy, minWidth:120 }}>
                {[v.color, v.size].filter(Boolean).join(' / ')}
              </span>
              <input
                placeholder="e.g. LP-001-NAV-M"
                value={v.sku}
                onChange={e => updateSku(v.color, v.size, e.target.value)}
                style={{ flex:1, ...inp, padding:'7px 10px', fontSize:12 }}
              />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700,
  letterSpacing:'2.5px', color:`rgba(200,169,81,0.8)`,
  textTransform:'uppercase', marginBottom:10,
};

// ── Wizard ───────────────────────────────────────────────────────────────────
export function AddProductWizard({ onClose, onSaved, editProduct }: WizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step,   setStep]   = useState<1|2|3>(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Images
  const [files,        setFiles]        = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [existingImgs, setExistingImgs] = useState<string[]>(editProduct?.images || []);

  // Core fields
  const [name,        setName]        = useState(editProduct?.name        || '');
  const [price,       setPrice]       = useState(editProduct?.price       || '');
  const [category,    setCategory]    = useState(editProduct?.category    || '');
  const [description, setDescription] = useState(editProduct?.description || '');

  // Colors & sizes
  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);
  const [colorInput, setColorInput] = useState('');
  const [sizes,      setSizes]      = useState<string[]>(editProduct?.sizes  || []);
  const [sizeInput,  setSizeInput]  = useState('');

  // Variants — built from existing or initialised as empty matrix
  const initVariants = useCallback((): Variant[] => {
    if (editProduct?.variants?.length) return editProduct.variants;
    return [];
  }, [editProduct]);
  const [variants, setVariants] = useState<Variant[]>(initVariants);

  // ── Rebuild variant matrix when colors/sizes change ─────────────────────
  const syncVariants = useCallback((newColors: string[], newSizes: string[]) => {
    setVariants(prev => {
      // Neither dimension set — clear
      if (newColors.length === 0 && newSizes.length === 0) return [];

      // Color only
      if (newColors.length > 0 && newSizes.length === 0) {
        return newColors.map(color => {
          const existing = prev.find(v => v.color === color && !v.size);
          return existing ?? { color, size:'', stock:0, sku:'' };
        });
      }

      // Size only
      if (newSizes.length > 0 && newColors.length === 0) {
        return newSizes.map(size => {
          const existing = prev.find(v => v.size === size && !v.color);
          return existing ?? { color:'', size, stock:0, sku:'' };
        });
      }

      // Full matrix
      const rows: Variant[] = [];
      for (const color of newColors) {
        for (const size of newSizes) {
          const existing = prev.find(v => v.color === color && v.size === size);
          rows.push(existing ?? { color, size, stock:0, sku:'' });
        }
      }
      return rows;
    });
  }, []);

  // ── Color management ─────────────────────────────────────────────────────
  const addColor = () => {
    const val = colorInput.trim().replace(/,$/, '');
    if (!val || colors.includes(val)) { setColorInput(''); return; }
    const next = [...colors, val];
    setColors(next);
    setColorInput('');
    syncVariants(next, sizes);
  };
  const removeColor = (color: string) => {
    const next = colors.filter(c => c !== color);
    setColors(next);
    syncVariants(next, sizes);
  };

  // ── Size management ──────────────────────────────────────────────────────
  const addSize = () => {
    const val = sizeInput.trim().toUpperCase().replace(/,$/, '');
    if (!val || sizes.includes(val)) { setSizeInput(''); return; }
    const next = [...sizes, val];
    setSizes(next);
    setSizeInput('');
    syncVariants(colors, next);
  };
  const removeSize = (size: string) => {
    const next = sizes.filter(s => s !== size);
    setSizes(next);
    syncVariants(colors, next);
  };
  const toggleQuickSize = (size: string) => {
    const next = sizes.includes(size) ? sizes.filter(s => s !== size) : [...sizes, size];
    setSizes(next);
    syncVariants(colors, next);
  };

  // ── Images ───────────────────────────────────────────────────────────────
  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid].slice(0, 8));
    valid.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPreviews(prev => [...prev, ev.target!.result as string].slice(0, 8));
      r.readAsDataURL(f);
    });
  };

  const totalImgs = existingImgs.length + previews.length;
  const step1Ok   = totalImgs > 0;
  const step2Ok   = name.trim() !== '' && Number(price) > 0;

  const totalVariantStock = variants.reduce((s, v) => s + v.stock, 0);
  const hasVariants       = variants.length > 0;

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!step2Ok) { setError('Name and a valid price are required.'); return; }
    setSaving(true); setError('');
    try {
      const variantsToSave = variants.filter(v => v.stock > 0 || v.sku);
      const fd = new FormData();
      fd.append('name',        name.trim());
      fd.append('price',       price);
      fd.append('category',    category);
      fd.append('description', description);
      fd.append('features',    JSON.stringify([]));
      fd.append('colors',      JSON.stringify(colors));
      fd.append('sizes',       JSON.stringify(sizes));
      fd.append('variants', JSON.stringify(variantsToSave));

      if (editProduct) fd.append('existingImages', JSON.stringify(existingImgs));
      files.forEach(f => fd.append('images', f));

      const hdrs = { ...authH().headers, 'Content-Type':'multipart/form-data' };
      if (editProduct)
        await axios.put(`/api/admin/products/${editProduct.id}`, fd, { headers:hdrs });
      else
        await axios.post('/api/admin/products', fd, { headers:hdrs });

      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const stepBtnStyle = (active: boolean): React.CSSProperties => ({
    flex:1, borderRadius:10, border:'none', padding:'13px',
    fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14,
    background: active ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2,
    color:      active ? T.navy : T.muted,
    cursor:     active ? 'pointer' : 'not-allowed',
    transition:'all 0.2s',
    boxShadow:  active ? '0 4px 14px rgba(200,169,81,0.28)' : 'none',
  });

  const STEPS = [
    { n:1, label:'Add Photos' },
    { n:2, label:'Product Info' },
    { n:3, label:'Review' },
  ];

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.7)', backdropFilter:'blur(5px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes wizardIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .wz-input:focus { border-color:${T.gold} !important; box-shadow:0 0 0 3px rgba(200,169,81,0.1); }
        .wz-num::-webkit-inner-spin-button, .wz-num::-webkit-outer-spin-button { opacity:0; }
        .wz-num:hover::-webkit-inner-spin-button { opacity:1; }
        details summary::-webkit-details-marker { display:none; }
      `}</style>

      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(13,27,62,0.35)', animation:'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* ── Header + step indicators ── */}
        <div style={{ padding:'26px 32px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <div>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:5 }}>
                {editProduct ? 'Edit Product' : 'New Product'}
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:T.navy }}>
                {editProduct ? 'Update Details' : 'Add to Catalogue'}
              </h2>
            </div>
            <button onClick={onClose} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, width:38, height:38, cursor:'pointer', fontSize:17, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>

          {/* Step indicators */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:26 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: step===s.n ? `linear-gradient(135deg,${T.gold},${T.gold2})` : step>s.n ? '#4A8A4A' : T.cream2, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:12, color: step===s.n ? T.navy : step>s.n ? '#fff' : T.muted, transition:'all 0.3s', boxShadow: step===s.n ? '0 4px 14px rgba(200,169,81,0.4)' : 'none' }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color: step===s.n ? T.gold : T.muted, whiteSpace:'nowrap', letterSpacing:'0.3px' }}>{s.label}</div>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:2, background: step>s.n ? '#4A8A4A' : T.cream3, margin:'0 8px 18px', transition:'background 0.3s' }}/>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:'0 32px 32px' }}>

          {/* ════════════════════════════════════════════════════════
              STEP 1 — Photos
          ════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'Jost,sans-serif', fontSize:14, color:T.muted, marginBottom:20, lineHeight:1.65 }}>
                {editProduct ? 'Manage product photos — remove or add new ones.' : 'Start by adding photos. The first image will be the cover.'}
              </p>

              {totalImgs === 0 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.gold; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = T.cream3; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.cream3; addFiles(Array.from(e.dataTransfer.files)); }}
                  style={{ border:`2px dashed ${T.cream3}`, borderRadius:18, padding:'52px 24px', textAlign:'center', cursor:'pointer', background:T.cream, transition:'all 0.2s' }}
                >
                  <div style={{ fontSize:52, marginBottom:14 }}>📷</div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:16, color:T.navy, marginBottom:8 }}>Tap to choose photos</div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, marginBottom:18 }}>or drag and drop images here</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, borderRadius:30, padding:'12px 28px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13 }}>
                    📁 Browse Device
                  </div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:14 }}>JPG, PNG, WebP · Up to 8 images</div>
                </div>
              )}

              {totalImgs > 0 && (
                <div>
                  <div style={{ position:'relative', width:'100%', height:220, borderRadius:16, overflow:'hidden', marginBottom:14, background:T.cream2 }}>
                    <img src={existingImgs[0] || previews[0]} alt="Cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/560x220/F0EAD8/0D1B3E?text=Image'; }}/>
                    <div style={{ position:'absolute', top:12, left:12, background:'rgba(13,27,62,0.75)', color:'#fff', borderRadius:20, padding:'4px 12px', fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700 }}>📌 Cover Photo</div>
                    <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(13,27,62,0.75)', color:T.gold, borderRadius:20, padding:'4px 10px', fontFamily:'Jost,sans-serif', fontSize:11 }}>{totalImgs} / 8 photos</div>
                  </div>

                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
                    {existingImgs.map((img, i) => (
                      <div key={`ex${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10, border: i===0 ? `2.5px solid ${T.gold}` : `1.5px solid ${T.cream3}` }} onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/72x72/F0EAD8/0D1B3E?text=📦'; }}/>
                        <button onClick={() => setExistingImgs(imgs => imgs.filter((_,j)=>j!==i))} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                      </div>
                    ))}
                    {previews.map((prev, i) => (
                      <div key={`nw${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={prev} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10, border:`1.5px solid ${T.gold}` }}/>
                        <button onClick={() => { setFiles(f=>f.filter((_,j)=>j!==i)); setPreviews(p=>p.filter((_,j)=>j!==i)); }} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                        <div style={{ position:'absolute', bottom:4, left:4, background:'#4A8A4A', color:'#fff', fontSize:7, fontWeight:700, fontFamily:'Jost,sans-serif', padding:'2px 4px', borderRadius:3 }}>NEW</div>
                      </div>
                    ))}
                    {totalImgs < 8 && (
                      <div onClick={() => fileRef.current?.click()} style={{ width:72, height:72, borderRadius:10, border:`2px dashed ${T.cream3}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background:T.cream, gap:4 }}>
                        <span style={{ fontSize:20, color:T.muted }}>+</span>
                        <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, color:T.muted, fontWeight:600 }}>Add more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }} onChange={e => addFiles(Array.from(e.target.files || []))}/>

              <div style={{ display:'flex', gap:12, marginTop:22 }}>
                <button onClick={onClose} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={() => setStep(2)} disabled={!editProduct && !step1Ok} style={stepBtnStyle(editProduct ? true : step1Ok)}>
                  {totalImgs > 0 ? `Continue with ${totalImgs} photo${totalImgs!==1?'s':''} →` : editProduct ? 'Continue without photos →' : 'Add at least 1 photo'}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP 2 — Product Info + Variants
          ════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              {(existingImgs.length > 0 || previews.length > 0) && !editProduct && (
                <div style={{ display:'flex', alignItems:'center', gap:12, background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:12, padding:'10px 16px', marginBottom:20 }}>
                  <img src={existingImgs[0]||previews[0]} style={{ width:44, height:44, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:'#2E7D32' }}>✓ {totalImgs} photo{totalImgs!==1?'s':''} ready</div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#5A8A5A', marginTop:2 }}>Now fill in the product details below</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ marginLeft:'auto', fontFamily:'Jost,sans-serif', fontSize:12, color:T.gold, fontWeight:600, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>Change photos</button>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                {/* Name */}
                <div>
                  <label style={lbl}>Product Name *</label>
                  <input className="wz-input" placeholder="e.g. Leather Crossbody Bag" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ ...inp, borderColor: name.trim() ? '#4A8A4A' : T.cream3 }}/>
                  {name.trim() && <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#4A8A4A', marginTop:5 }}>✓ Looks good</div>}
                </div>

                {/* Price */}
                <div>
                  <label style={lbl}>Price (KSh) *</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.muted, pointerEvents:'none' }}>KSh</div>
                    <input className="wz-input wz-num" type="number" min="0" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp, paddingLeft:52, borderColor: price && Number(price)>0 ? '#4A8A4A' : T.cream3 }}/>
                  </div>
                  {price && Number(price)>0 && <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#4A8A4A', marginTop:5 }}>✓ KSh {Number(price).toLocaleString()}</div>}
                </div>

                {/* Category */}
                <div>
                  <label style={lbl}>Category</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(cat => cat===c ? '' : c)}
                        style={{ border: category===c ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius:8, padding:'9px 6px', background: category===c ? 'rgba(200,169,81,0.1)' : T.cream, fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:600, color: category===c ? T.gold : T.muted, cursor:'pointer', transition:'all 0.15s' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── COLOURS ─────────────────────────────────────── */}
                <div>
                  <label style={lbl}>
                    Available Colours
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional — enables per-variant stock)</span>
                  </label>
                  {colors.length > 0 && (
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10 }}>
                      {colors.map((c,i) => <TagPill key={i} label={c} dot={c} onRemove={() => removeColor(c)}/>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      className="wz-input"
                      placeholder="e.g. Midnight Black…"
                      value={colorInput}
                      onChange={e => setColorInput(e.target.value)}
                      onKeyDown={e => { if ((e.key==='Enter'||e.key===',') && colorInput.trim()) { e.preventDefault(); addColor(); } }}
                      style={{ ...inp, flex:1 }}
                    />
                    <button onClick={addColor} disabled={!colorInput.trim()} style={{ flexShrink:0, borderRadius:10, border:'none', padding:'12px 18px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, background: colorInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: colorInput.trim() ? T.navy : T.muted, cursor: colorInput.trim() ? 'pointer' : 'not-allowed' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* ── SIZES ───────────────────────────────────────── */}
                <div>
                  <label style={lbl}>
                    Available Sizes
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional)</span>
                  </label>
                  {sizes.length > 0 && (
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10 }}>
                      {sizes.map((s,i) => <TagPill key={i} label={s} onRemove={() => removeSize(s)}/>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    {['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','One Size'].map(s => (
                      <button key={s} onClick={() => toggleQuickSize(s)}
                        style={{ border: sizes.includes(s) ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius:7, padding:'5px 10px', background: sizes.includes(s) ? 'rgba(200,169,81,0.1)' : T.cream, fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color: sizes.includes(s) ? T.gold : T.muted, cursor:'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      className="wz-input"
                      placeholder="Custom size…"
                      value={sizeInput}
                      onChange={e => setSizeInput(e.target.value)}
                      onKeyDown={e => { if ((e.key==='Enter'||e.key===',') && sizeInput.trim()) { e.preventDefault(); addSize(); } }}
                      style={{ ...inp, flex:1 }}
                    />
                    <button onClick={addSize} disabled={!sizeInput.trim()} style={{ flexShrink:0, borderRadius:10, border:'none', padding:'12px 18px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, background: sizeInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: sizeInput.trim() ? T.navy : T.muted, cursor: sizeInput.trim() ? 'pointer' : 'not-allowed' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* ── VARIANT STOCK GRID ──────────────────────────── */}
                {(colors.length > 0 || sizes.length > 0) && (
                  <div style={{ background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:14, padding:'18px 16px' }}>
                    <VariantGrid
                      colors={colors}
                      sizes={sizes}
                      variants={variants}
                      onChange={setVariants}
                    />
                    {hasVariants && (
                      <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8, background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:8, padding:'8px 12px' }}>
                        <span style={{ fontSize:14 }}>✓</span>
                        <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:'#2E7D32', fontWeight:600 }}>
                          {totalVariantStock} units total across {variants.filter(v=>v.stock>0).length} of {variants.length} variant{variants.length!==1?'s':''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* No variants — show flat stock input */}
                {colors.length === 0 && sizes.length === 0 && (
                  <div>
                    <label style={lbl}>Stock (total units)</label>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <button onClick={() => { const cur = parseInt(variants[0]?.stock as any || '0'); const next = Math.max(0, cur-1); setVariants([{ color:'', size:'', stock:next, sku:'' }]); }} style={{ width:44, height:44, borderRadius:8, border:`1.5px solid ${T.cream3}`, background:T.cream, fontSize:18, cursor:'pointer', color:T.navy, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <input
                        className="wz-num"
                        type="number" min="0"
                        value={variants[0]?.stock ?? 0}
                        onChange={e => setVariants([{ color:'', size:'', stock:Number(e.target.value), sku:'' }])}
                        style={{ ...inp, textAlign:'center', fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, flex:1 }}
                      />
                      <button onClick={() => { const cur = parseInt(variants[0]?.stock as any || '0'); setVariants([{ color:'', size:'', stock:cur+1, sku:'' }]); }} style={{ width:44, height:44, borderRadius:8, border:`1.5px solid ${T.cream3}`, background:T.cream, fontSize:18, cursor:'pointer', color:T.navy, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                    </div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:6 }}>
                      Add colours or sizes above to set per-variant stock
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label style={lbl}>
                    Description
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:T.muted, fontSize:10 }}>(optional)</span>
                  </label>
                  <textarea
                    className="wz-input"
                    placeholder="Describe what makes this product special…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    style={{ background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:10, padding:'12px 14px', fontFamily:'Jost,sans-serif', fontSize:14, color:T.navy, width:'100%', outline:'none', resize:'vertical', lineHeight:1.65, transition:'border-color 0.2s' }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'12px 16px', fontFamily:'Jost,sans-serif', fontSize:13, color:'#C0392B', marginTop:14 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:24 }}>
                <button onClick={() => setStep(1)} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>
                  ← Photos
                </button>
                <button
                  onClick={() => { if (!step2Ok) { setError('Please enter a product name and price.'); return; } setError(''); setStep(3); }}
                  disabled={!step2Ok}
                  style={stepBtnStyle(step2Ok)}
                >
                  {editProduct ? 'Review Changes →' : 'Review & Publish →'}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP 3 — Review
          ════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'Jost,sans-serif', fontSize:14, color:T.muted, marginBottom:18, lineHeight:1.65 }}>
                Review everything below before publishing.
              </p>

              {/* Product card preview */}
              <div style={{ border:`1.5px solid ${T.cream3}`, borderRadius:18, overflow:'hidden', marginBottom:20, background:'#fff', boxShadow:'0 6px 28px rgba(13,27,62,0.09)' }}>
                <div style={{ position:'relative', height:200, background:T.cream2, overflow:'hidden' }}>
                  {(existingImgs[0] || previews[0])
                    ? <img src={existingImgs[0]||previews[0]} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/560x200/F0EAD8/0D1B3E?text=Product'; }}/>
                    : <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8, fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted }}>
                        <span style={{ fontSize:36 }}>📷</span>No cover image
                      </div>
                  }
                  {category && <div style={{ position:'absolute', top:10, left:10, background:T.navy, color:T.gold, borderRadius:4, padding:'3px 9px', fontFamily:'Jost,sans-serif', fontSize:8, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' }}>{category}</div>}
                  <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(13,27,62,0.75)', color:T.gold, borderRadius:20, padding:'3px 10px', fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700 }}>{totalImgs} photo{totalImgs!==1?'s':''}</div>
                  {totalVariantStock === 0 && !hasVariants && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(13,27,62,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ background:'rgba(255,255,255,0.95)', color:T.navy, fontWeight:700, fontSize:9, padding:'5px 14px', borderRadius:3, letterSpacing:'2px', fontFamily:'Jost,sans-serif', textTransform:'uppercase' }}>Sold Out</span>
                    </div>
                  )}
                </div>

                <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:T.navy, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {name || <span style={{ color:T.muted, fontStyle:'italic' }}>Untitled product</span>}
                      </div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.gold }}>
                        KSh {Number(price||0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ flexShrink:0, textAlign:'center', padding:'8px 14px', borderRadius:10, background: totalVariantStock===0 ? '#FDF0EE' : totalVariantStock<=10 ? '#FDF8EC' : '#EEF5EE', border:`1px solid ${totalVariantStock===0 ? '#F5C6C0' : totalVariantStock<=10 ? '#F6E4A0' : '#C8DFC8'}` }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:2 }}>Stock</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color: totalVariantStock===0 ? '#C0392B' : totalVariantStock<=10 ? '#B7791F' : '#2E7D32' }}>
                        {totalVariantStock}
                      </div>
                    </div>
                  </div>

                  {/* Variant summary */}
                  {hasVariants && (
                    <div style={{ background:T.cream, borderRadius:10, padding:'12px 14px', border:`1px solid ${T.cream3}` }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>
                        Variant breakdown
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {variants.map((v, i) => {
                          const label = [v.color, v.size].filter(Boolean).join(' / ') || 'Default';
                          const c = v.stock===0 ? '#C0392B' : v.stock<=5 ? '#B7791F' : '#2E7D32';
                          return (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                              {v.color && <div style={{ width:12, height:12, borderRadius:'50%', background:v.color, border:'1px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>}
                              <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.navy, flex:1 }}>{label}</span>
                              <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:700, color:c }}>
                                {v.stock === 0 ? 'Out of stock' : `${v.stock} units`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {description.trim() && (
                    <div style={{ background:T.cream, borderRadius:10, padding:'11px 14px', border:`1px solid ${T.cream3}` }}>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Description</div>
                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy, lineHeight:1.7 }}>{description}</div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'12px 16px', fontFamily:'Jost,sans-serif', fontSize:13, color:'#C0392B', marginBottom:14 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setStep(2)} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>
                  ← Edit Details
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex:1, borderRadius:10, border:'none', padding:'14px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14, letterSpacing:'1px', textTransform:'uppercase', background: saving ? T.cream2 : `linear-gradient(135deg,${T.gold},${T.gold2})`, color: saving ? T.muted : T.navy, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 18px rgba(200,169,81,0.35)' }}
                >
                  {saving ? '⏳ Publishing…' : editProduct ? '✓ Save Changes' : '🚀 Publish to Store'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}