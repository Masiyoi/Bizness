import React, { useState, useRef } from 'react';
import axios from 'axios';
import type { Product } from '../../types';
import { T, CATEGORIES, lbl, inp } from '../../constants';
import { authH } from '../../utils';

interface WizardProps {
  onClose: () => void;
  onSaved: () => void;
  editProduct?: Product | null;
}

// ── Tag pill ────────────────────────────────────────────────────────────────
function TagPill({ label, dot, onRemove }: { label: string; dot?: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.cream, border: `1.5px solid ${T.cream3}`, borderRadius: 20, padding: '5px 10px 5px 8px', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.navy }}>
      {dot && <div style={{ width: 14, height: 14, borderRadius: '50%', background: dot, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>}
      <span style={{ fontWeight: 600 }}>{label}</span>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 15, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}>×</button>
    </div>
  );
}

export function AddProductWizard({ onClose, onSaved, editProduct }: WizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step,   setStep]   = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const [files,        setFiles]        = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [existingImgs, setExistingImgs] = useState<string[]>(editProduct?.images || []);

  const [name,        setName]        = useState(editProduct?.name        || '');
  const [price,       setPrice]       = useState(editProduct?.price       || '');
  const [stock,       setStock]       = useState(String(editProduct?.stock ?? ''));
  const [category,    setCategory]    = useState(editProduct?.category    || '');
  const [description, setDescription] = useState(editProduct?.description || '');
  const [colors,      setColors]      = useState<string[]>(editProduct?.colors || []);
  const [colorInput,  setColorInput]  = useState('');
  const [sizes,       setSizes]       = useState<string[]>(editProduct?.sizes  || []);
  const [sizeInput,   setSizeInput]   = useState('');

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

  const addColor = () => {
    const val = colorInput.trim().replace(/,$/, '');
    if (val && !colors.includes(val)) setColors(prev => [...prev, val]);
    setColorInput('');
  };
  const addSize = () => {
    const val = sizeInput.trim().toUpperCase().replace(/,$/, '');
    if (val && !sizes.includes(val)) setSizes(prev => [...prev, val]);
    setSizeInput('');
  };

  const handleSave = async () => {
    if (!step2Ok) { setError('Name and a valid price are required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name',        name.trim());
      fd.append('price',       price);
      fd.append('category',    category);
      fd.append('description', description);
      fd.append('stock',       stock || '0');
      fd.append('features',    JSON.stringify([]));
      fd.append('colors',      JSON.stringify(colors));
      fd.append('sizes',       JSON.stringify(sizes));
      if (editProduct) fd.append('existingImages', JSON.stringify(existingImgs));
      files.forEach(f => fd.append('images', f));
      const hdrs = { ...authH().headers, 'Content-Type': 'multipart/form-data' };
      if (editProduct) await axios.put(`/api/admin/products/${editProduct.id}`, fd, { headers: hdrs });
      else             await axios.post('/api/admin/products', fd, { headers: hdrs });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const stepBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, borderRadius: 10, border: 'none', padding: '13px',
    fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 14,
    background: active ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2,
    color:      active ? T.navy : T.muted,
    cursor:     active ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    boxShadow:  active ? '0 4px 14px rgba(200,169,81,0.28)' : 'none',
  });

  const STEPS = [{ n: 1, label: 'Add Photos' }, { n: 2, label: 'Product Info' }, { n: 3, label: 'Review' }];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.7)', backdropFilter: 'blur(5px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(13,27,62,0.35)', animation: 'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* ── Header + step indicators ── */}
        <div style={{ padding: '26px 32px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>{editProduct ? 'Edit Product' : 'New Product'}</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 22, color: T.navy }}>{editProduct ? 'Update Details' : 'Add to Catalogue'}</h2>
            </div>
            <button onClick={onClose} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 17, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: step === s.n ? `linear-gradient(135deg,${T.gold},${T.gold2})` : step > s.n ? '#4A8A4A' : T.cream2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: step === s.n ? T.navy : step > s.n ? '#fff' : T.muted, transition: 'all 0.3s', boxShadow: step === s.n ? '0 4px 14px rgba(200,169,81,0.4)' : 'none' }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: step === s.n ? T.gold : T.muted, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>{s.label}</div>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.n ? '#4A8A4A' : T.cream3, margin: '0 8px 18px', transition: 'background 0.3s' }}/>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {/* ── Step 1: Photos ── */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.muted, marginBottom: 20, lineHeight: 1.65 }}>
                {editProduct ? 'Manage product photos — remove or add new ones.' : 'Start by adding photos. The first image will be the cover.'}
              </p>
              {totalImgs === 0 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.gold; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = T.cream3; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.cream3; addFiles(Array.from(e.dataTransfer.files)); }}
                  style={{ border: `2px dashed ${T.cream3}`, borderRadius: 18, padding: '52px 24px', textAlign: 'center', cursor: 'pointer', background: T.cream, transition: 'all 0.2s' }}
                >
                  <div style={{ fontSize: 52, marginBottom: 14 }}>📷</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 16, color: T.navy, marginBottom: 8 }}>Tap to choose photos</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, marginBottom: 18 }}>or drag and drop images here</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, borderRadius: 30, padding: '12px 28px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13 }}>📁 Browse Device</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 14 }}>JPG, PNG, WebP · Up to 8 images</div>
                </div>
              )}
              {totalImgs > 0 && (
                <div>
                  <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 14, background: T.cream2 }}>
                    <img src={existingImgs[0] || previews[0]} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/560x220/F0EAD8/0D1B3E?text=Image'; }}/>
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(13,27,62,0.75)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700 }}>📌 Cover Photo</div>
                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(13,27,62,0.75)', color: T.gold, borderRadius: 20, padding: '4px 10px', fontFamily: 'Jost,sans-serif', fontSize: 11 }}>{totalImgs} / 8 photos</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    {existingImgs.map((img, i) => (
                      <div key={`ex${i}`} style={{ position: 'relative', width: 72, height: 72 }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: i === 0 ? `2.5px solid ${T.gold}` : `1.5px solid ${T.cream3}` }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x72/F0EAD8/0D1B3E?text=📦'; }}/>
                        <button onClick={() => setExistingImgs(imgs => imgs.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#C0392B', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                    {previews.map((prev, i) => (
                      <div key={`nw${i}`} style={{ position: 'relative', width: 72, height: 72 }}>
                        <img src={prev} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${T.gold}` }}/>
                        <button onClick={() => { setFiles(f => f.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#C0392B', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#4A8A4A', color: '#fff', fontSize: 7, fontWeight: 700, fontFamily: 'Jost,sans-serif', padding: '2px 4px', borderRadius: 3 }}>NEW</div>
                      </div>
                    ))}
                    {totalImgs < 8 && (
                      <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 10, border: `2px dashed ${T.cream3}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: T.cream, gap: 4 }}>
                        <span style={{ fontSize: 20, color: T.muted }}>+</span>
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.muted, fontWeight: 600 }}>Add more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => addFiles(Array.from(e.target.files || []))}/>
              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button onClick={onClose} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '12px 20px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.muted, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setStep(2)} disabled={!editProduct && !step1Ok} style={stepBtnStyle(editProduct ? true : step1Ok)}>
                  {totalImgs > 0 ? `Continue with ${totalImgs} photo${totalImgs !== 1 ? 's' : ''} →` : editProduct ? 'Continue without photos →' : 'Add at least 1 photo'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Product Info ── */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.28s ease both' }}>
              {(existingImgs.length > 0 || previews.length > 0) && !editProduct && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#EEF5EE', border: '1px solid #C8DFC8', borderRadius: 12, padding: '10px 16px', marginBottom: 20 }}>
                  <img src={existingImgs[0] || previews[0]} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: '#2E7D32' }}>✓ {totalImgs} photo{totalImgs !== 1 ? 's' : ''} ready</div>
                    <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: '#5A8A5A', marginTop: 2 }}>Now fill in the product details below</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Change photos</button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={lbl}>Product Name *</label>
                  <input placeholder="e.g. Leather Crossbody Bag" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ ...inp, borderColor: name.trim() ? '#4A8A4A' : T.cream3 }}/>
                  {name.trim() && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: '#4A8A4A', marginTop: 5 }}>✓ Looks good</div>}
                </div>
                <div>
                  <label style={lbl}>Price (KSh) *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.muted, pointerEvents: 'none' }}>KSh</div>
                    <input type="number" min="0" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp, paddingLeft: 52, borderColor: price && Number(price) > 0 ? '#4A8A4A' : T.cream3 }}/>
                  </div>
                  {price && Number(price) > 0 && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: '#4A8A4A', marginTop: 5 }}>✓ KSh {Number(price).toLocaleString()}</div>}
                </div>
                <div>
                  <label style={lbl}>Items Available (Stock)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setStock(s => String(Math.max(0, parseInt(s || '0') - 1)))} style={{ width: 44, height: 44, borderRadius: 8, border: `1.5px solid ${T.cream3}`, background: T.cream, fontSize: 18, cursor: 'pointer', color: T.navy, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} style={{ ...inp, textAlign: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, flex: 1 }}/>
                    <button onClick={() => setStock(s => String(parseInt(s || '0') + 1))} style={{ width: 44, height: 44, borderRadius: 8, border: `1.5px solid ${T.cream3}`, background: T.cream, fontSize: 18, cursor: 'pointer', color: T.navy, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)}
                        style={{ border: category === c ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius: 8, padding: '9px 6px', background: category === c ? 'rgba(200,169,81,0.1)' : T.cream, fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, color: category === c ? T.gold : T.muted, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Colors */}
                <div>
                  <label style={lbl}>Available Colours <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: T.muted, fontSize: 10 }}>(optional)</span></label>
                  {colors.length > 0 && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>{colors.map((c, i) => <TagPill key={i} label={c} dot={c} onRemove={() => setColors(prev => prev.filter((_, j) => j !== i))}/>)}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="e.g. Midnight Black…" value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && colorInput.trim()) { e.preventDefault(); addColor(); } }} style={{ ...inp, flex: 1 }}/>
                    <button onClick={addColor} disabled={!colorInput.trim()} style={{ flexShrink: 0, borderRadius: 10, border: 'none', padding: '12px 18px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: colorInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: colorInput.trim() ? T.navy : T.muted, cursor: colorInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                  </div>
                </div>
                {/* Sizes */}
                <div>
                  <label style={lbl}>Available Sizes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: T.muted, fontSize: 10 }}>(optional)</span></label>
                  {sizes.length > 0 && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>{sizes.map((s, i) => <TagPill key={i} label={s} onRemove={() => setSizes(prev => prev.filter((_, j) => j !== i))}/>)}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', 'One Size'].map(s => (
                      <button key={s} onClick={() => { if (!sizes.includes(s)) setSizes(prev => [...prev, s]); }} style={{ border: sizes.includes(s) ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius: 7, padding: '5px 10px', background: sizes.includes(s) ? 'rgba(200,169,81,0.1)' : T.cream, fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: sizes.includes(s) ? T.gold : T.muted, cursor: 'pointer' }}>{s}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="Custom size…" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && sizeInput.trim()) { e.preventDefault(); addSize(); } }} style={{ ...inp, flex: 1 }}/>
                    <button onClick={addSize} disabled={!sizeInput.trim()} style={{ flexShrink: 0, borderRadius: 10, border: 'none', padding: '12px 18px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: sizeInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: sizeInput.trim() ? T.navy : T.muted, cursor: sizeInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label style={lbl}>Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: T.muted, fontSize: 10 }}>(optional)</span></label>
                  <textarea placeholder="Describe what makes this product special…" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ background: T.cream, border: `1.5px solid ${T.cream3}`, borderRadius: 10, padding: '12px 14px', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.navy, width: '100%', outline: 'none', resize: 'vertical', lineHeight: 1.65, transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.cream3}/>
                </div>
              </div>
              {error && <div style={{ background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '12px 16px', fontFamily: 'Jost,sans-serif', fontSize: 13, color: '#C0392B', marginTop: 14 }}>⚠ {error}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setStep(1)} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '12px 20px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.muted, cursor: 'pointer' }}>← Photos</button>
                <button onClick={() => { if (!step2Ok) { setError('Please enter a product name and price.'); return; } setError(''); setStep(3); }} disabled={!step2Ok} style={stepBtnStyle(step2Ok)}>
                  {editProduct ? 'Review Changes →' : 'Review & Publish →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.muted, marginBottom: 18, lineHeight: 1.65 }}>
                Review everything below before publishing.
              </p>
              <div style={{ border: `1.5px solid ${T.cream3}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16, background: '#fff', boxShadow: '0 6px 28px rgba(13,27,62,0.09)' }}>
                <div style={{ position: 'relative', height: 200, background: T.cream2, overflow: 'hidden' }}>
                  {(existingImgs[0] || previews[0])
                    ? <img src={existingImgs[0] || previews[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/560x200/F0EAD8/0D1B3E?text=Product'; }}/>
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, flexDirection: 'column', gap: 8 }}><span style={{ fontSize: 36 }}>📷</span>No cover image</div>
                  }
                  {category && <div style={{ position: 'absolute', top: 10, left: 10, background: T.navy, color: T.gold, borderRadius: 4, padding: '3px 9px', fontFamily: 'Jost,sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{category}</div>}
                  <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(13,27,62,0.75)', color: T.gold, borderRadius: 20, padding: '3px 10px', fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700 }}>{totalImgs} photo{totalImgs !== 1 ? 's' : ''}</div>
                  {Number(stock) === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,27,62,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: 'rgba(255,255,255,0.95)', color: T.navy, fontWeight: 700, fontSize: 9, padding: '5px 14px', borderRadius: 3, letterSpacing: '2px', fontFamily: 'Jost,sans-serif', textTransform: 'uppercase' }}>Sold Out</span></div>}
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, color: T.navy, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || <span style={{ color: T.muted, fontStyle: 'italic' }}>Untitled product</span>}</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.gold }}>KSh {Number(price || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: Number(stock) === 0 ? '#FDF0EE' : Number(stock) <= 5 ? '#FDF8EC' : '#EEF5EE', border: `1px solid ${Number(stock) === 0 ? '#F5C6C0' : Number(stock) <= 5 ? '#F6E4A0' : '#C8DFC8'}` }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Stock</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: Number(stock) === 0 ? '#C0392B' : Number(stock) <= 5 ? '#B7791F' : '#2E7D32' }}>{stock || '0'}</div>
                    </div>
                  </div>
                  {description.trim() && (
                    <div style={{ background: T.cream, borderRadius: 10, padding: '11px 14px', border: `1px solid ${T.cream3}` }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy, lineHeight: 1.7 }}>{description}</div>
                    </div>
                  )}
                </div>
              </div>

              {error && <div style={{ background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '12px 16px', fontFamily: 'Jost,sans-serif', fontSize: 13, color: '#C0392B', marginBottom: 14 }}>⚠ {error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '12px 20px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.muted, cursor: 'pointer' }}>← Edit Details</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, borderRadius: 10, border: 'none', padding: '14px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase', background: saving ? T.cream2 : `linear-gradient(135deg,${T.gold},${T.gold2})`, color: saving ? T.muted : T.navy, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 18px rgba(200,169,81,0.35)' }}
                >{saving ? '⏳ Publishing…' : editProduct ? '✓ Save Changes' : '🚀 Publish to Store'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}