import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Product } from '../../types';
import { T, CATEGORIES, lbl, inp } from '../../constants';
import { authH } from '../../utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Variant { color: string; size: string; stock: number; sku: string; }

interface WizardProps {
  onClose:      () => void;
  onSaved:      () => void;
  editProduct?: (Product & { variants?: Variant[] }) | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const variantKey = (color: string, size: string) => `${color}||${size}`;
const buildVariantMap = (variants: Variant[]) => {
  const map = new Map<string, Variant>();
  for (const v of variants) map.set(variantKey(v.color, v.size), v);
  return map;
};

// ── Tag pill ──────────────────────────────────────────────────────────────────
function TagPill({ label, dot, onRemove }: { label: string; dot?: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 20, padding: '4px 10px 4px 8px', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.black }}>
      {dot && <div style={{ width: 12, height: 12, borderRadius: '50%', background: dot, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>}
      <span style={{ fontWeight: 600 }}>{label}</span>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.grey1, fontSize: 15, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}>×</button>
    </div>
  );
}

// ── Margin preview ────────────────────────────────────────────────────────────
function MarginPreview({ price, costPrice }: { price: string; costPrice: string }) {
  const p = parseFloat(price);
  const c = parseFloat(costPrice);
  if (!p || !c || c <= 0 || p <= 0) return null;
  const profit = p - c;
  const margin = ((profit / p) * 100).toFixed(1);
  const good = parseFloat(margin) >= 30;
  const ok   = parseFloat(margin) >= 10;
  return (
    <div style={{
      marginTop: 8, padding: '8px 12px', borderRadius: 8,
      background: good ? '#F0FDF4' : ok ? '#FFFBEB' : '#FEF2F2',
      border: `1px solid ${good ? '#BBF7D0' : ok ? '#FDE68A' : '#FECACA'}`,
      display: 'flex', gap: 14, flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: good ? '#166534' : ok ? '#92400E' : '#991B1B', fontWeight: 700 }}>
        Profit: KSh {profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
      <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: good ? '#166534' : ok ? '#92400E' : '#991B1B', fontWeight: 700 }}>
        Margin: {margin}%
      </span>
      <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: good ? '#166534' : ok ? '#92400E' : '#991B1B' }}>
        {good ? '✓ Healthy margin' : ok ? '⚠ Low margin' : '⚠ Very low margin'}
      </span>
    </div>
  );
}

// ── Variant grid ──────────────────────────────────────────────────────────────
function VariantGrid({ colors, sizes, variants, onChange }: {
  colors: string[]; sizes: string[];
  variants: Variant[]; onChange: (v: Variant[]) => void;
}) {
  const updateStock = (color: string, size: string, stock: number) => {
    const key = variantKey(color, size);
    onChange(variants.map(v => variantKey(v.color, v.size) === key ? { ...v, stock } : v));
  };
  const updateSku = (color: string, size: string, sku: string) => {
    const key = variantKey(color, size);
    onChange(variants.map(v => variantKey(v.color, v.size) === key ? { ...v, sku } : v));
  };
  const variantMap = buildVariantMap(variants);

  const stockColor = (stock: number) =>
    stock === 0 ? { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' } :
    stock <= 5  ? { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' } :
                  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' };

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700,
    letterSpacing: '2px', color: T.grey1, textTransform: 'uppercase', marginBottom: 10,
  };

  // Color only
  if (colors.length > 0 && sizes.length === 0) return (
    <div>
      <div style={sectionLabel}>Stock per colour</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {colors.map(color => {
          const v = variantMap.get(variantKey(color, '')); const stock = v?.stock ?? 0; const c = stockColor(stock);
          return (
            <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: color, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600, color: T.black, flex: 1 }}>{color}</span>
              <input type="number" min={0} value={stock} onChange={e => updateStock(color, '', Number(e.target.value))}
                style={{ width: 68, textAlign: 'center', background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 7, padding: '7px 4px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 15, color: c.text, outline: 'none' }}/>
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>units</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
        Total: <strong style={{ color: T.black }}>{variants.reduce((s, v) => s + v.stock, 0)}</strong> units
      </div>
    </div>
  );

  // Size only
  if (sizes.length > 0 && colors.length === 0) return (
    <div>
      <div style={sectionLabel}>Stock per size</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {sizes.map(size => {
          const v = variantMap.get(variantKey('', size)); const stock = v?.stock ?? 0; const c = stockColor(stock);
          return (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '10px 12px', minWidth: 76 }}>
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, color: T.black }}>{size}</span>
              <input type="number" min={0} value={stock} onChange={e => updateStock('', size, Number(e.target.value))}
                style={{ width: 56, textAlign: 'center', background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 7, padding: '6px 2px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 14, color: c.text, outline: 'none' }}/>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Full matrix
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={sectionLabel}>Stock per variant (colour × size)</div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>Total: <strong style={{ color: T.black }}>{totalStock}</strong></div>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 9, border: `1px solid ${T.grey3}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.grey4 }}>
              <th style={{ textAlign: 'left', padding: '9px 12px', color: T.grey1, fontWeight: 700, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.grey3}` }}>Colour</th>
              {sizes.map(size => (
                <th key={size} style={{ padding: '9px 12px', color: T.black, fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${T.grey3}`, textAlign: 'center', minWidth: 76 }}>{size}</th>
              ))}
              <th style={{ padding: '9px 12px', color: T.grey1, fontWeight: 700, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', borderBottom: `1px solid ${T.grey3}`, textAlign: 'center' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color, ci) => {
              const rowTotal = variants.filter(v => v.color === color).reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={color} style={{ background: ci % 2 === 0 ? T.white : T.grey5 }}>
                  <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.grey3}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>
                      <span style={{ fontWeight: 600, color: T.black, fontSize: 12 }}>{color}</span>
                    </div>
                  </td>
                  {sizes.map(size => {
                    const v = variantMap.get(variantKey(color, size)); const stock = v?.stock ?? 0; const c = stockColor(stock);
                    return (
                      <td key={size} style={{ padding: '5px 7px', textAlign: 'center', borderBottom: `1px solid ${T.grey3}` }}>
                        <input type="number" min={0} value={stock} onChange={e => updateStock(color, size, Number(e.target.value))}
                          style={{ width: 60, textAlign: 'center', background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 7, padding: '6px 4px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: c.text, outline: 'none' }}/>
                      </td>
                    );
                  })}
                  <td style={{ padding: '7px 12px', textAlign: 'center', borderBottom: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: rowTotal === 0 ? '#991B1B' : T.black }}>{rowTotal}</td>
                </tr>
              );
            })}
            <tr style={{ background: T.grey4 }}>
              <td style={{ padding: '7px 12px', fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px' }}>Total</td>
              {sizes.map(size => {
                const col = variants.filter(v => v.size === size).reduce((s, v) => s + v.stock, 0);
                return <td key={size} style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: col === 0 ? '#991B1B' : T.black }}>{col}</td>;
              })}
              <td style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 14, color: T.black }}>{totalStock}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>▸</span> Add SKU codes (optional)
        </summary>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {variants.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {v.color && <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>}
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.black, minWidth: 110 }}>{[v.color, v.size].filter(Boolean).join(' / ')}</span>
              <input placeholder="e.g. LP-001-BLK-M" value={v.sku} onChange={e => updateSku(v.color, v.size, e.target.value)}
                style={{ flex: 1, ...inp, padding: '7px 10px', fontSize: 12 }}/>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
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
  const [costPrice,   setCostPrice]   = useState(editProduct?.cost_price ? String(editProduct.cost_price) : '');
  const [category,    setCategory]    = useState(editProduct?.category    || '');
  const [description, setDescription] = useState(editProduct?.description || '');

  // Variants
  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);
  const [colorInput, setColorInput] = useState('');
  const [sizes,      setSizes]      = useState<string[]>(editProduct?.sizes  || []);
  const [sizeInput,  setSizeInput]  = useState('');

  const initVariants = useCallback((): Variant[] => editProduct?.variants?.length ? editProduct.variants : [], [editProduct]);
  const [variants, setVariants] = useState<Variant[]>(initVariants);

  const syncVariants = useCallback((newColors: string[], newSizes: string[]) => {
    setVariants(prev => {
      const prevMap = buildVariantMap(prev);
      if (!newColors.length && !newSizes.length) return [];
      if (newColors.length > 0 && newSizes.length === 0)
        return newColors.map(color => prevMap.get(variantKey(color, '')) ?? { color, size: '', stock: 0, sku: '' });
      if (newSizes.length > 0 && newColors.length === 0)
        return newSizes.map(size => prevMap.get(variantKey('', size)) ?? { color: '', size, stock: 0, sku: '' });
      const rows: Variant[] = [];
      for (const color of newColors)
        for (const size of newSizes)
          rows.push(prevMap.get(variantKey(color, size)) ?? { color, size, stock: 0, sku: '' });
      return rows;
    });
  }, []);

  const addColor = () => {
    const val = colorInput.trim().replace(/,$/, '');
    if (!val || colors.includes(val)) { setColorInput(''); return; }
    const next = [...colors, val]; setColors(next); setColorInput(''); syncVariants(next, sizes);
  };
  const removeColor = (c: string) => { const next = colors.filter(x => x !== c); setColors(next); syncVariants(next, sizes); };
  const addSize = () => {
    const val = sizeInput.trim().toUpperCase().replace(/,$/, '');
    if (!val || sizes.includes(val)) { setSizeInput(''); return; }
    const next = [...sizes, val]; setSizes(next); setSizeInput(''); syncVariants(colors, next);
  };
  const removeSize = (s: string) => { const next = sizes.filter(x => x !== s); setSizes(next); syncVariants(colors, next); };
  const toggleQuickSize = (s: string) => {
    const next = sizes.includes(s) ? sizes.filter(x => x !== s) : [...sizes, s];
    setSizes(next); syncVariants(colors, next);
  };

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
  const hasVariants = variants.length > 0;

  const handleSave = async () => {
    if (!step2Ok) { setError('Name and a valid price are required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name',        name.trim());
      fd.append('price',       price);
      fd.append('cost_price',  costPrice || '');
      fd.append('category',    category);
      fd.append('description', description);
      fd.append('features',    JSON.stringify([]));
      fd.append('colors',      JSON.stringify(colors));
      fd.append('sizes',       JSON.stringify(sizes));
      fd.append('variants',    JSON.stringify(variants.filter(v => v.stock > 0 || v.sku)));
      if (editProduct) fd.append('existingImages', JSON.stringify(existingImgs));
      files.forEach(f => fd.append('images', f));
      const hdrs = { ...authH().headers, 'Content-Type': 'multipart/form-data' };
      if (editProduct)
        await axios.put(`/api/admin/products/${editProduct.id}`, fd, { headers: hdrs });
      else
        await axios.post('/api/admin/products', fd, { headers: hdrs });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save product.');
    } finally { setSaving(false); }
  };

  // ── Shared styles ──
  const primaryBtn: React.CSSProperties = {
    flex: 1, borderRadius: 9, border: 'none', padding: '13px',
    fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 14,
    background: T.black, color: T.white, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
  };
  const ghostBtn: React.CSSProperties = {
    borderRadius: 9, border: `1px solid ${T.grey3}`, padding: '12px 20px',
    fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13,
    background: T.grey5, color: T.grey1, cursor: 'pointer',
  };
  const STEPS = [{ n: 1, label: 'Photos' }, { n: 2, label: 'Details' }, { n: 3, label: 'Review' }];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes wizardIn { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .wz-input:focus { border-color: ${T.black} !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        details summary::-webkit-details-marker { display:none; }
      `}</style>

      <div style={{ background: T.white, borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'wizardIn 0.3s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                {editProduct ? 'Edit Product' : 'New Product'}
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.black }}>
                {editProduct ? 'Update Details' : 'Add to Catalogue'}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 9, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: T.grey1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: step === s.n ? T.black : step > s.n ? '#166534' : T.grey4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12,
                    color: step === s.n ? T.white : step > s.n ? T.white : T.grey1,
                    transition: 'all 0.3s',
                  }}>{step > s.n ? '✓' : s.n}</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: step === s.n ? T.black : T.grey1, whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1.5, background: step > s.n ? '#166534' : T.grey3, margin: '0 8px 16px', transition: 'background 0.3s' }}/>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>

          {/* ── Step 1: Photos ── */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.grey1, marginBottom: 18, lineHeight: 1.65 }}>
                {editProduct ? 'Manage photos — remove existing or add new ones.' : 'Add photos. The first image becomes the cover.'}
              </p>

              {totalImgs === 0 && (
                <div onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = T.black; }}
                  onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.grey3; }}
                  onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = T.grey3; addFiles(Array.from(e.dataTransfer.files)); }}
                  style={{ border: `2px dashed ${T.grey3}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: T.grey5, transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 15, color: T.black, marginBottom: 6 }}>Drop photos here or click to browse</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, marginBottom: 16 }}>JPG, PNG, WebP · Up to 8 images</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.black, color: T.white, borderRadius: 25, padding: '10px 24px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13 }}>
                    Browse Files
                  </div>
                </div>
              )}

              {totalImgs > 0 && (
                <>
                  <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: T.grey4 }}>
                    <img src={existingImgs[0] || previews[0]} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: T.white, borderRadius: 20, padding: '3px 10px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700 }}>Cover</div>
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: '3px 10px', fontFamily: 'Jost,sans-serif', fontSize: 11 }}>{totalImgs} / 8</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {existingImgs.map((img, i) => (
                      <div key={`ex${i}`} style={{ position: 'relative', width: 68, height: 68 }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, border: i === 0 ? `2px solid ${T.black}` : `1px solid ${T.grey3}` }}/>
                        <button onClick={() => setExistingImgs(imgs => imgs.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#DC2626', color: T.white, border: `2px solid ${T.white}`, cursor: 'pointer', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                    {previews.map((prev, i) => (
                      <div key={`nw${i}`} style={{ position: 'relative', width: 68, height: 68 }}>
                        <img src={prev} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9, border: `2px solid #166534` }}/>
                        <button onClick={() => { setFiles(f => f.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#DC2626', color: T.white, border: `2px solid ${T.white}`, cursor: 'pointer', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        <div style={{ position: 'absolute', bottom: 3, left: 3, background: '#166534', color: T.white, fontSize: 7, fontWeight: 700, fontFamily: 'Jost,sans-serif', padding: '1px 4px', borderRadius: 3 }}>NEW</div>
                      </div>
                    ))}
                    {totalImgs < 8 && (
                      <div onClick={() => fileRef.current?.click()} style={{ width: 68, height: 68, borderRadius: 9, border: `2px dashed ${T.grey3}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: T.grey5, gap: 3 }}>
                        <span style={{ fontSize: 18, color: T.grey1 }}>+</span>
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, fontWeight: 600 }}>Add</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => addFiles(Array.from(e.target.files || []))}/>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={onClose} style={ghostBtn}>Cancel</button>
                <button onClick={() => setStep(2)} disabled={!editProduct && !step1Ok} style={{ ...primaryBtn, opacity: (!editProduct && !step1Ok) ? 0.4 : 1, cursor: (!editProduct && !step1Ok) ? 'not-allowed' : 'pointer' }}>
                  {totalImgs > 0 ? `Continue with ${totalImgs} photo${totalImgs !== 1 ? 's' : ''} →` : editProduct ? 'Continue →' : 'Add at least 1 photo'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.25s ease both', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Name */}
              <div>
                <label style={lbl}>Product Name *</label>
                <input className="wz-input" placeholder="e.g. Leather Crossbody Bag" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ ...inp, borderColor: name.trim() ? '#166534' : T.grey3 }}/>
              </div>

              {/* Price + Cost price side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Selling Price (KSh) *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: T.grey1, pointerEvents: 'none' }}>KSh</div>
                    <input className="wz-input" type="number" min="0" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp, paddingLeft: 46, borderColor: price && Number(price) > 0 ? '#166534' : T.grey3 }}/>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Cost Price (KSh)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: T.grey1, pointerEvents: 'none' }}>KSh</div>
                    <input className="wz-input" type="number" min="0" placeholder="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={{ ...inp, paddingLeft: 46 }}/>
                  </div>
                </div>
              </div>

              {/* Live margin preview */}
              <MarginPreview price={price} costPrice={costPrice} />

              {/* Category */}
              <div>
                <label style={lbl}>Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)} style={{ border: `1.5px solid ${category === c ? T.black : T.grey3}`, borderRadius: 7, padding: '8px 6px', background: category === c ? T.black : T.grey5, fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, color: category === c ? T.white : T.grey1, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colours */}
              <div>
                <label style={lbl}>Colours <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.grey2, fontSize: 10, marginLeft: 4 }}>(optional)</span></label>
                {colors.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{colors.map((c, i) => <TagPill key={i} label={c} dot={c} onRemove={() => removeColor(c)}/>)}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="wz-input" placeholder="e.g. Midnight Black…" value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && colorInput.trim()) { e.preventDefault(); addColor(); } }} style={{ ...inp, flex: 1 }}/>
                  <button onClick={addColor} disabled={!colorInput.trim()} style={{ flexShrink: 0, borderRadius: 8, border: 'none', padding: '11px 16px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: colorInput.trim() ? T.black : T.grey4, color: colorInput.trim() ? T.white : T.grey1, cursor: colorInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label style={lbl}>Sizes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.grey2, fontSize: 10, marginLeft: 4 }}>(optional)</span></label>
                {sizes.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{sizes.map((s, i) => <TagPill key={i} label={s} onRemove={() => removeSize(s)}/>)}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','One Size'].map(s => (
                    <button key={s} onClick={() => toggleQuickSize(s)} style={{ border: `1.5px solid ${sizes.includes(s) ? T.black : T.grey3}`, borderRadius: 6, padding: '4px 9px', background: sizes.includes(s) ? T.black : T.grey5, fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: sizes.includes(s) ? T.white : T.grey1, cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="wz-input" placeholder="Custom size…" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && sizeInput.trim()) { e.preventDefault(); addSize(); } }} style={{ ...inp, flex: 1 }}/>
                  <button onClick={addSize} disabled={!sizeInput.trim()} style={{ flexShrink: 0, borderRadius: 8, border: 'none', padding: '11px 16px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: sizeInput.trim() ? T.black : T.grey4, color: sizeInput.trim() ? T.white : T.grey1, cursor: sizeInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                </div>
              </div>

              {/* Variant stock grid */}
              {(colors.length > 0 || sizes.length > 0) && (
                <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 12, padding: '16px 14px' }}>
                  <VariantGrid colors={colors} sizes={sizes} variants={variants} onChange={setVariants}/>
                </div>
              )}

              {/* Flat stock (no variants) */}
              {colors.length === 0 && sizes.length === 0 && (
                <div>
                  <label style={lbl}>Stock (total units)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setVariants([{ color: '', size: '', stock: Math.max(0, (variants[0]?.stock ?? 0) - 1), sku: '' }])} style={{ width: 42, height: 42, borderRadius: 8, border: `1.5px solid ${T.grey3}`, background: T.grey5, fontSize: 18, cursor: 'pointer', color: T.black, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <input type="number" min="0" value={variants[0]?.stock ?? 0} onChange={e => setVariants([{ color: '', size: '', stock: Number(e.target.value), sku: '' }])} style={{ ...inp, textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, flex: 1 }}/>
                    <button onClick={() => setVariants([{ color: '', size: '', stock: (variants[0]?.stock ?? 0) + 1, sku: '' }])} style={{ width: 42, height: 42, borderRadius: 8, border: `1.5px solid ${T.grey3}`, background: T.grey5, fontSize: 18, cursor: 'pointer', color: T.black, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={lbl}>Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.grey2, fontSize: 10, marginLeft: 4 }}>(optional)</span></label>
                <textarea className="wz-input" placeholder="Describe what makes this product special…" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }}/>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '11px 14px', fontFamily: 'Jost,sans-serif', fontSize: 13, color: '#991B1B' }}>⚠ {error}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={ghostBtn}>← Photos</button>
                <button onClick={() => { if (!step2Ok) { setError('Please enter a name and price.'); return; } setError(''); setStep(3); }} disabled={!step2Ok} style={{ ...primaryBtn, opacity: !step2Ok ? 0.4 : 1, cursor: !step2Ok ? 'not-allowed' : 'pointer' }}>
                  {editProduct ? 'Review Changes →' : 'Review & Publish →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.25s ease both' }}>
              <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.grey1, marginBottom: 18, lineHeight: 1.65 }}>Review everything before publishing.</p>

              <div style={{ border: `1px solid ${T.grey3}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20, background: T.white }}>
                <div style={{ position: 'relative', height: 180, background: T.grey4, overflow: 'hidden' }}>
                  {(existingImgs[0] || previews[0])
                    ? <img src={existingImgs[0] || previews[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1 }}><span style={{ fontSize: 32 }}>📷</span>No cover image</div>
                  }
                  {category && <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.75)', color: T.white, borderRadius: 4, padding: '3px 9px', fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{category}</div>}
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.black, marginBottom: 4 }}>{name || <span style={{ color: T.grey1, fontStyle: 'italic' }}>Untitled</span>}</div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.black }}>KSh {Number(price || 0).toLocaleString()}</span>
                        {costPrice && Number(costPrice) > 0 && (
                          <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, alignSelf: 'center' }}>
                            Cost: KSh {Number(costPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 9, background: totalVariantStock === 0 ? '#FEF2F2' : T.grey5, border: `1px solid ${totalVariantStock === 0 ? '#FECACA' : T.grey3}` }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Stock</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: totalVariantStock === 0 ? '#991B1B' : T.black }}>{totalVariantStock}</div>
                    </div>
                  </div>

                  {/* Live margin in review */}
                  <MarginPreview price={price} costPrice={costPrice}/>

                  {/* Variant summary */}
                  {hasVariants && (
                    <div style={{ background: T.grey5, borderRadius: 9, padding: '11px 14px', border: `1px solid ${T.grey3}` }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Variants</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {variants.map((v, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            {v.color && <div style={{ width: 10, height: 10, borderRadius: '50%', background: v.color, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>}
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.black, flex: 1 }}>{[v.color, v.size].filter(Boolean).join(' / ') || 'Default'}</span>
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, color: v.stock === 0 ? '#991B1B' : T.black }}>{v.stock === 0 ? 'Out of stock' : `${v.stock} units`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '11px 14px', fontFamily: 'Jost,sans-serif', fontSize: 13, color: '#991B1B', marginBottom: 14 }}>⚠ {error}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={ghostBtn}>← Edit Details</button>
                <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '⏳ Saving…' : editProduct ? '✓ Save Changes' : '🚀 Publish to Store'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}