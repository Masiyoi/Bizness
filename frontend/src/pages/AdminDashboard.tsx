import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: number; name: string; price: string; category: string;
  description: string; features: string[]; stock: number;
  images: string[]; image_url: string; colors: string[]; sizes: string[];
}
interface Order {
  id: number; customer_name: string; customer_email: string;
  total: string; status: string; tracking_status: string;
  mpesa_phone: string; mpesa_receipt: string;
  items_snapshot: any; created_at: string;
  // shipping fields (may come from items_snapshot or direct columns)
  shipping_info?: any;
  delivery_zone?: string;
  delivery_fee?: string | number;
}
interface Stats {
  totalOrders: number; totalProducts: number;
  totalRevenue: number; totalUsers: number; activeOrders: number;
  recentOrders: Order[]; topProducts: any[]; lowStock: any[];
  revenueByDay: { day: string; revenue: string; orders: string }[];
  ordersByStatus: { status: string; count: string }[];
}

const T = {
  navy:'#0D1B3E', navy2:'#152348', navy3:'#1E2F5A',
  gold:'#C8A951', gold2:'#DEC06A',
  cream:'#F9F5EC', cream2:'#F0EAD8', cream3:'#E4D9C0',
  white:'#FFFFFF', muted:'#7A8099',
};

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const TRACKING_STEPS = ['Order Placed','Payment Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered'];
const ORDER_STATUSES  = ['pending','confirmed','processing','shipped','delivered','cancelled'];
const CATEGORIES      = ['Clothes','Shoes','Bags','Female Wear','Sneakers','Jackets','Socks','Jerseys','Hoodies'];

const TRACKING_TO_STATUS: Record<string, string> = {
  'Order Placed':'confirmed','Payment Confirmed':'confirmed','Processing':'processing',
  'Packed':'processing','Shipped':'shipped','Out for Delivery':'shipped','Delivered':'delivered',
};

const SC: Record<string,{bg:string;col:string;border:string}> = {
  pending:    { bg:'#FDF8EC', col:'#B7791F', border:'#F6E4A0' },
  confirmed:  { bg:'#EEF5EE', col:'#4A8A4A', border:'#C8DFC8' },
  processing: { bg:'#EEF0FA', col:'#4A5FBF', border:'#C5CBEE' },
  shipped:    { bg:'#EDF5FB', col:'#2B7AB5', border:'#BAD9EF' },
  delivered:  { bg:'#EEF5EE', col:'#2E7D32', border:'#A5D6A7' },
  cancelled:  { bg:'#FDF0EE', col:'#C0392B', border:'#F5C6C0' },
};

// ── Parse items_snapshot into a usable array ──────────────────────────────────
const parseItemsSnapshot = (snapshot: any): any[] => {
  if (!snapshot) return [];
  if (Array.isArray(snapshot)) return snapshot;
  if (typeof snapshot === 'string') {
    try { const p = JSON.parse(snapshot); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  if (typeof snapshot === 'object') {
    // might be { items: [...] } or similar
    if (Array.isArray(snapshot.items)) return snapshot.items;
    return [];
  }
  return [];
};

// ── Parse shipping info from snapshot or order fields ─────────────────────────
const parseShippingInfo = (order: Order): any => {
  // Try order.shipping_info first
  if (order.shipping_info) {
    if (typeof order.shipping_info === 'object') return order.shipping_info;
    try { return JSON.parse(order.shipping_info); } catch {}
  }
  // Try items_snapshot.shipping or items_snapshot.shippingInfo
  const snap = order.items_snapshot;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    if (snap.shipping) return snap.shipping;
    if (snap.shippingInfo) return snap.shippingInfo;
    if (snap.shipping_info) return snap.shipping_info;
  }
  if (typeof snap === 'string') {
    try {
      const p = JSON.parse(snap);
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        if (p.shipping) return p.shipping;
        if (p.shippingInfo) return p.shippingInfo;
        if (p.shipping_info) return p.shipping_info;
      }
    } catch {}
  }
  return null;
};

const parseDeliveryZone = (order: Order): string | null => {
  if (order.delivery_zone) return order.delivery_zone;
  const snap = order.items_snapshot;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    if (snap.deliveryZone) return snap.deliveryZone;
    if (snap.delivery_zone) return snap.delivery_zone;
  }
  if (typeof snap === 'string') {
    try {
      const p = JSON.parse(snap);
      if (p && typeof p === 'object') {
        if (p.deliveryZone) return p.deliveryZone;
        if (p.delivery_zone) return p.delivery_zone;
      }
    } catch {}
  }
  return null;
};

function RevenueChart({ data }: { data: { day: string; revenue: string }[] }) {
  if (!data.length) return (
    <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted }}>
      No revenue data yet
    </div>
  );
  const max = Math.max(...data.map(d => parseFloat(d.revenue)), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130, padding:'0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max((parseFloat(d.revenue)/max)*100, 3);
        const day = new Date(d.day).toLocaleDateString('en-KE',{weekday:'short'});
        const rev = parseFloat(d.revenue);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, minHeight:14 }}>
              {rev>0?`${(rev/1000).toFixed(1)}k`:''}
            </div>
            <div title={`KSh ${rev.toLocaleString()}`} style={{
              width:'100%', borderRadius:'4px 4px 0 0',
              background:`linear-gradient(180deg,${T.gold2} 0%,${T.gold} 100%)`,
              height:`${h}%`, minHeight:4, transition:'height 0.6s cubic-bezier(.34,1.56,.64,1)',
            }}/>
            <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, color:T.muted }}>{day}</div>
          </div>
        );
      })}
    </div>
  );
}

interface WizardProps { onClose:()=>void; onSaved:()=>void; editProduct?:Product|null; }

function AddProductWizard({ onClose, onSaved, editProduct }: WizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step,   setStep]   = useState<1|2|3>(1);
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

  const [colors,     setColors]     = useState<string[]>(editProduct?.colors || []);
  const [colorInput, setColorInput] = useState('');
  const [sizes,     setSizes]     = useState<string[]>(editProduct?.sizes || []);
  const [sizeInput, setSizeInput] = useState('');

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid].slice(0, 8));
    valid.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPreviews(prev => [...prev, ev.target!.result as string].slice(0, 8));
      r.readAsDataURL(f);
    });
  };
  const removeNew = (i: number) => { setFiles(f => f.filter((_,j) => j!==i)); setPreviews(p => p.filter((_,j) => j!==i)); };
  const removeOld = (i: number) => { setExistingImgs(imgs => imgs.filter((_,j) => j!==i)); };

  const totalImgs = existingImgs.length + previews.length;
  const step1Ok   = totalImgs > 0;
  const step2Ok   = name.trim() !== '' && price !== '' && Number(price) > 0;

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

  const STEPS = [{ n:1, label:'Add Photos' }, { n:2, label:'Product Info' }, { n:3, label:'Review' }];
  const stepBtnStyle = (active: boolean): React.CSSProperties => ({
    flex:1, borderRadius:10, border:'none', padding:'13px',
    fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14,
    background: active ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2,
    color: active ? T.navy : T.muted,
    cursor: active ? 'pointer' : 'not-allowed',
    transition:'all 0.2s',
    boxShadow: active ? `0 4px 14px rgba(200,169,81,0.28)` : 'none',
  });

  const TagPill = ({ label, dot, onRemove }: { label: string; dot?: string; onRemove: () => void }) => (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:20, padding:'5px 10px 5px 8px', fontFamily:'Jost,sans-serif', fontSize:12, color:T.navy }}>
      {dot && <div style={{ width:14, height:14, borderRadius:'50%', background:dot, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>}
      <span style={{ fontWeight:600 }}>{label}</span>
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, fontSize:15, lineHeight:1, padding:0, display:'flex', alignItems:'center', marginLeft:2 }}>×</button>
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.7)', backdropFilter:'blur(5px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', boxShadow:`0 40px 100px rgba(13,27,62,0.35)`, animation:'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ padding:'26px 32px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
            <div>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:5 }}>{editProduct ? 'Edit Product' : 'New Product'}</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:T.navy }}>{editProduct ? 'Update Details' : 'Add to Catalogue'}</h2>
            </div>
            <button onClick={onClose} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, width:38, height:38, cursor:'pointer', fontSize:17, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', marginBottom:26 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: step===s.n ? `linear-gradient(135deg,${T.gold},${T.gold2})` : step>s.n ? '#4A8A4A' : T.cream2, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:12, color: step===s.n ? T.navy : step>s.n ? '#fff' : T.muted, transition:'all 0.3s', boxShadow: step===s.n ? `0 4px 14px rgba(200,169,81,0.4)` : 'none' }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color: step===s.n ? T.gold : T.muted, whiteSpace:'nowrap', letterSpacing:'0.3px' }}>{s.label}</div>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex:1, height:2, background: step>s.n ? '#4A8A4A' : T.cream3, margin:'0 8px 18px', transition:'background 0.3s' }}/>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'0 32px 32px' }}>
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'Jost,sans-serif', fontSize:14, color:T.muted, marginBottom:20, lineHeight:1.65 }}>
                {editProduct ? 'Manage product photos — remove or add new ones.' : 'Start by adding photos. The first image will be the cover.'}
              </p>
              {totalImgs === 0 && (
                <div onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.gold; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = T.cream3; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.cream3; addFiles(Array.from(e.dataTransfer.files)); }}
                  style={{ border:`2px dashed ${T.cream3}`, borderRadius:18, padding:'52px 24px', textAlign:'center', cursor:'pointer', background:T.cream, transition:'all 0.2s' }}>
                  <div style={{ fontSize:52, marginBottom:14 }}>📷</div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:16, color:T.navy, marginBottom:8 }}>Tap to choose photos</div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, marginBottom:18 }}>or drag and drop images here</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, borderRadius:30, padding:'12px 28px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13 }}>📁 Browse Device</div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:14 }}>JPG, PNG, WebP · Up to 8 images</div>
                </div>
              )}
              {totalImgs > 0 && (
                <div>
                  <div style={{ position:'relative', width:'100%', height:220, borderRadius:16, overflow:'hidden', marginBottom:14, background:T.cream2 }}>
                    <img src={existingImgs[0] || previews[0]} alt="Cover" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/560x220/F0EAD8/0D1B3E?text=Image`; }}/>
                    <div style={{ position:'absolute', top:12, left:12, background:'rgba(13,27,62,0.75)', color:'#fff', borderRadius:20, padding:'4px 12px', fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700 }}>📌 Cover Photo</div>
                    <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(13,27,62,0.75)', color:T.gold, borderRadius:20, padding:'4px 10px', fontFamily:'Jost,sans-serif', fontSize:11 }}>{totalImgs} / 8 photos</div>
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
                    {existingImgs.map((img, i) => (
                      <div key={`ex${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10, border: i===0 ? `2.5px solid ${T.gold}` : `1.5px solid ${T.cream3}` }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x72/F0EAD8/0D1B3E?text=📦'; }}/>
                        <button onClick={() => removeOld(i)} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                      </div>
                    ))}
                    {previews.map((prev, i) => (
                      <div key={`nw${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={prev} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10, border:`1.5px solid ${T.gold}` }}/>
                        <button onClick={() => removeNew(i)} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
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
                <button onClick={onClose} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>Cancel</button>
                <button onClick={() => setStep(2)} disabled={!editProduct && !step1Ok} style={stepBtnStyle(editProduct ? true : step1Ok)}>
                  {totalImgs > 0 ? `Continue with ${totalImgs} photo${totalImgs !== 1 ? 's' : ''} →` : editProduct ? 'Continue without photos →' : 'Add at least 1 photo'}
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              {(existingImgs.length > 0 || previews.length > 0) && !editProduct && (
                <div style={{ display:'flex', alignItems:'center', gap:12, background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:12, padding:'10px 16px', marginBottom:20 }}>
                  <img src={existingImgs[0] || previews[0]} style={{ width:44, height:44, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
                  <div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:'#2E7D32' }}>✓ {totalImgs} photo{totalImgs !== 1 ? 's' : ''} ready</div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#5A8A5A', marginTop:2 }}>Now fill in the product details below</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ marginLeft:'auto', fontFamily:'Jost,sans-serif', fontSize:12, color:T.gold, fontWeight:600, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>Change photos</button>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div>
                  <label style={lbl}>Product Name *</label>
                  <input placeholder="e.g. Leather Crossbody Bag" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ ...inp, borderColor: name.trim() ? '#4A8A4A' : T.cream3 }}/>
                  {name.trim() && <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#4A8A4A', marginTop:5 }}>✓ Looks good</div>}
                </div>
                <div>
                  <label style={lbl}>Price (KSh) *</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.muted, pointerEvents:'none' }}>KSh</div>
                    <input type="number" min="0" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} style={{ ...inp, paddingLeft:52, borderColor: price && Number(price) > 0 ? '#4A8A4A' : T.cream3 }}/>
                  </div>
                  {price && Number(price) > 0 && <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'#4A8A4A', marginTop:5 }}>✓ KSh {Number(price).toLocaleString()}</div>}
                </div>
                <div>
                  <label style={lbl}>Items Available (Stock)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button onClick={() => setStock(s => String(Math.max(0, parseInt(s||'0') - 1)))} style={{ width:44, height:44, borderRadius:8, border:`1.5px solid ${T.cream3}`, background:T.cream, fontSize:18, cursor:'pointer', color:T.navy, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} style={{ ...inp, textAlign:'center', fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, flex:1 }}/>
                    <button onClick={() => setStock(s => String(parseInt(s||'0') + 1))} style={{ width:44, height:44, borderRadius:8, border:`1.5px solid ${T.cream3}`, background:T.cream, fontSize:18, cursor:'pointer', color:T.navy, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)}
                        style={{ border: category===c ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius:8, padding:'9px 6px', background: category===c ? `rgba(200,169,81,0.1)` : T.cream, fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:600, color: category===c ? T.gold : T.muted, cursor:'pointer', transition:'all 0.15s' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Available Colours <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:4, color:T.muted, fontSize:10 }}>(optional)</span></label>
                  {colors.length > 0 && (
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10 }}>
                      {colors.map((c, i) => <TagPill key={i} label={c} dot={c} onRemove={() => setColors(prev => prev.filter((_,j) => j!==i))}/>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    <input placeholder="e.g. Midnight Black…" value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && colorInput.trim()) { e.preventDefault(); addColor(); } }} style={{ ...inp, flex:1 }}/>
                    <button onClick={addColor} disabled={!colorInput.trim()} style={{ flexShrink:0, borderRadius:10, border:'none', padding:'12px 18px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, background: colorInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: colorInput.trim() ? T.navy : T.muted, cursor: colorInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Available Sizes <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:4, color:T.muted, fontSize:10 }}>(optional)</span></label>
                  {sizes.length > 0 && (
                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:10 }}>
                      {sizes.map((s, i) => <TagPill key={i} label={s} onRemove={() => setSizes(prev => prev.filter((_,j) => j!==i))}/>)}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    {['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','One Size'].map(s => (
                      <button key={s} onClick={() => { if (!sizes.includes(s)) setSizes(prev => [...prev, s]); }} style={{ border: sizes.includes(s) ? `2px solid ${T.gold}` : `1.5px solid ${T.cream3}`, borderRadius:7, padding:'5px 10px', background: sizes.includes(s) ? `rgba(200,169,81,0.1)` : T.cream, fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color: sizes.includes(s) ? T.gold : T.muted, cursor:'pointer' }}>{s}</button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input placeholder="Custom size…" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && sizeInput.trim()) { e.preventDefault(); addSize(); } }} style={{ ...inp, flex:1 }}/>
                    <button onClick={addSize} disabled={!sizeInput.trim()} style={{ flexShrink:0, borderRadius:10, border:'none', padding:'12px 18px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, background: sizeInput.trim() ? `linear-gradient(135deg,${T.gold},${T.gold2})` : T.cream2, color: sizeInput.trim() ? T.navy : T.muted, cursor: sizeInput.trim() ? 'pointer' : 'not-allowed' }}>+ Add</button>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Description <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:4, color:T.muted, fontSize:10 }}>(optional)</span></label>
                  <textarea placeholder="Describe what makes this product special…" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ background:T.cream, border:`1.5px solid ${T.cream3}`, borderRadius:10, padding:'12px 14px', fontFamily:'Jost,sans-serif', fontSize:14, color:T.navy, width:'100%', outline:'none', resize:'vertical', lineHeight:1.65, transition:'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.cream3}/>
                </div>
              </div>
              {error && <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'12px 16px', fontFamily:'Jost,sans-serif', fontSize:13, color:'#C0392B', marginTop:14 }}>⚠ {error}</div>}
              <div style={{ display:'flex', gap:12, marginTop:24 }}>
                <button onClick={() => setStep(1)} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>← Photos</button>
                <button onClick={() => { if (!step2Ok) { setError('Please enter a product name and price.'); return; } setError(''); setStep(3); }} disabled={!step2Ok} style={stepBtnStyle(step2Ok)}>
                  {editProduct ? 'Review Changes →' : 'Review & Publish →'}
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'Jost,sans-serif', fontSize:14, color:T.muted, marginBottom:20 }}>Review everything before publishing to the store.</p>
              <div style={{ border:`1px solid ${T.cream3}`, borderRadius:18, overflow:'hidden', marginBottom:22, background:'#fff', boxShadow:`0 4px 20px rgba(13,27,62,0.07)` }}>
                {(existingImgs[0] || previews[0]) ? (
                  <div style={{ height:190, overflow:'hidden', background:T.cream2 }}>
                    <img src={existingImgs[0] || previews[0]} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/560x190/F0EAD8/0D1B3E?text=Product`; }}/>
                  </div>
                ) : (
                  <div style={{ height:80, background:T.cream2, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted }}>No image</div>
                )}
                <div style={{ padding:'16px 20px' }}>
                  {category && <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>{category}</div>}
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:17, color:T.navy, marginBottom:5 }}>{name}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:21, color:T.gold, marginBottom:8 }}>KSh {Number(price).toLocaleString()}</div>
                </div>
              </div>
              {error && <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'12px 16px', fontFamily:'Jost,sans-serif', fontSize:13, color:'#C0392B', marginBottom:14 }}>⚠ {error}</div>}
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setStep(2)} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'12px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, color:T.muted, cursor:'pointer' }}>← Edit Details</button>
                <button onClick={handleSave} disabled={saving} style={{ flex:1, borderRadius:10, border:'none', padding:'14px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:14, letterSpacing:'1px', textTransform:'uppercase', background: saving ? T.cream2 : `linear-gradient(135deg,${T.gold},${T.gold2})`, color: saving ? T.muted : T.navy, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '⏳ Publishing…' : '🚀 Publish to Store'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ORDER DETAIL MODAL ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onUpdateStatus }: { order: Order; onClose: () => void; onUpdateStatus: () => void }) {
  const items = parseItemsSnapshot(order.items_snapshot);
  const shippingInfo = parseShippingInfo(order);
  const deliveryZone = parseDeliveryZone(order);
  const sc = SC[order.status] || SC.pending;

  const ZONE_LABELS: Record<string, { label: string; icon: string }> = {
    pickup:   { label: 'Pick Up from Shop', icon: '🏪' },
    cbd:      { label: 'Nairobi CBD',       icon: '🏙️' },
    environs: { label: 'Nairobi Environs',  icon: '🌆' },
    county:   { label: 'Other Counties',    icon: '📍' },
  };
  const zoneLabel = deliveryZone ? ZONE_LABELS[deliveryZone] : null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.65)', backdropFilter:'blur(5px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:640, maxHeight:'94vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(13,27,62,0.35)', animation:'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* ── Modal header ── */}
        <div style={{ background:T.navy, borderRadius:'22px 22px 0 0', padding:'22px 28px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:5 }}>Order Details</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:'#fff' }}>Order #{order.id}</div>
            <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>
              {new Date(order.created_at).toLocaleString('en-KE', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, padding:'5px 14px', borderRadius:20, background:sc.bg, color:sc.col, border:`1px solid ${sc.border}`, textTransform:'capitalize' }}>{order.status}</span>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:9, width:36, height:36, cursor:'pointer', fontSize:15, color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        </div>

        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:22 }}>

          {/* ── Customer & Payment info ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>👤 Customer</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.navy, marginBottom:5 }}>{order.customer_name || 'Unknown'}</div>
              {order.customer_email && <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted, marginBottom:4 }}>✉️ {order.customer_email}</div>}
              {order.mpesa_phone && <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted }}>📱 {order.mpesa_phone}</div>}
            </div>
            <div style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>💳 Payment</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.gold, marginBottom:5 }}>KSh {Number(order.total).toLocaleString()}</div>
              {order.mpesa_receipt && (
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color:'#2E7D32', background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:6, padding:'4px 10px', display:'inline-block' }}>
                  🧾 {order.mpesa_receipt}
                </div>
              )}
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:6 }}>🚚 {order.tracking_status}</div>
            </div>
          </div>

          {/* ── Shipping / Delivery Info ── */}
          {(shippingInfo || zoneLabel) && (
            <div style={{ background:'#fff', border:`1px solid ${T.cream3}`, borderRadius:14, overflow:'hidden' }}>
              <div style={{ background:`linear-gradient(135deg,${T.navy},${T.navy3})`, padding:'12px 18px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:16 }}>{zoneLabel?.icon || '📦'}</span>
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color:T.gold, letterSpacing:'1.5px', textTransform:'uppercase' }}>
                  Delivery Information{zoneLabel ? ` — ${zoneLabel.label}` : ''}
                </div>
              </div>
              <div style={{ padding:'16px 18px' }}>
                {shippingInfo ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {(shippingInfo.firstName || shippingInfo.lastName) && (
                      <div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Name</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, fontWeight:600, color:T.navy }}>{[shippingInfo.firstName, shippingInfo.lastName].filter(Boolean).join(' ')}</div>
                      </div>
                    )}
                    {shippingInfo.phone && (
                      <div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Phone</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, fontWeight:600, color:T.navy }}>{shippingInfo.phone}</div>
                      </div>
                    )}
                    {shippingInfo.email && (
                      <div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Email</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy }}>{shippingInfo.email}</div>
                      </div>
                    )}
                    {(shippingInfo.county || shippingInfo.town) && (
                      <div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Location</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy }}>📍 {[shippingInfo.town, shippingInfo.county].filter(Boolean).join(', ')}</div>
                      </div>
                    )}
                    {shippingInfo.pickupLocation && (
                      <div style={{ gridColumn:'1/-1' }}>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Pickup Location</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy }}>🏪 {shippingInfo.pickupLocation}</div>
                      </div>
                    )}
                    {shippingInfo.additionalInfo && (
                      <div style={{ gridColumn:'1/-1', background:T.cream, borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted, letterSpacing:'1px', textTransform:'uppercase', marginBottom:4 }}>Delivery Notes</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.navy, lineHeight:1.6, fontStyle:'italic' }}>"{shippingInfo.additionalInfo}"</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, fontStyle:'italic' }}>No shipping details saved with this order.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Ordered Items ── */}
          <div style={{ background:'#fff', border:`1px solid ${T.cream3}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ background:`linear-gradient(135deg,rgba(200,169,81,0.15),rgba(200,169,81,0.05))`, borderBottom:`1px solid ${T.cream3}`, padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color:T.navy, letterSpacing:'1.5px', textTransform:'uppercase' }}>
                🛍️ Items Ordered
              </div>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ padding:'24px 18px', textAlign:'center' }}>
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, fontStyle:'italic' }}>
                  Item details not available for this order.
                </div>
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:6, opacity:0.7 }}>
                  Order total: KSh {Number(order.total).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {items.map((item: any, idx: number) => {
                  const imgSrc = item.image_url || item.imageUrl || item.image || null;
                  const itemName = item.name || item.product_name || `Product #${item.product_id || idx + 1}`;
                  const itemPrice = item.price || item.unit_price || 0;
                  const qty = item.quantity || 1;
                  const lineTotal = Number(itemPrice) * qty;
                  const selectedColor = item.selected_color || item.color || null;
                  const selectedSize = item.selected_size || item.size || null;
                  const category = item.category || null;
                  const isLast = idx === items.length - 1;

                  return (
                    <div key={idx} style={{ display:'flex', gap:16, padding:'16px 18px', borderBottom: isLast ? 'none' : `1px solid ${T.cream3}` }}>
                      {/* Product image */}
                      <div style={{ width:80, height:80, borderRadius:12, overflow:'hidden', flexShrink:0, background:T.cream2, border:`1px solid ${T.cream3}` }}>
                        {imgSrc ? (
                          <img src={imgSrc} alt={itemName} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/80x80/F0EAD8/0D1B3E?text=📦`; }}/>
                        ) : (
                          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📦</div>
                        )}
                      </div>

                      {/* Product details */}
                      <div style={{ flex:1, minWidth:0 }}>
                        {category && (
                          <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.gold, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:4 }}>{category}</div>
                        )}
                        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:15, color:T.navy, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {itemName}
                        </div>

                        {/* Color + Size badges */}
                        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:8 }}>
                          {selectedColor && (
                            <div style={{ display:'flex', alignItems:'center', gap:5, background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:20, padding:'3px 10px 3px 7px', fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, color:T.navy }}>
                              <div style={{ width:10, height:10, borderRadius:'50%', background:selectedColor, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>
                              {selectedColor}
                            </div>
                          )}
                          {selectedSize && (
                            <div style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:7, padding:'3px 10px', fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:700, color:T.navy }}>
                              📐 {selectedSize}
                            </div>
                          )}
                          <div style={{ background:`rgba(200,169,81,0.1)`, border:`1px solid rgba(200,169,81,0.25)`, borderRadius:7, padding:'3px 10px', fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, color:T.gold }}>
                            Qty: {qty}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.navy }}>
                            KSh {lineTotal.toLocaleString()}
                          </span>
                          {qty > 1 && (
                            <span style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>
                              (KSh {Number(itemPrice).toLocaleString()} × {qty})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Order total footer */}
                <div style={{ borderTop:`2px solid ${T.cream3}`, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', background:T.cream }}>
                  <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'1px' }}>Order Total</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.gold }}>KSh {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onUpdateStatus} style={{ flex:1, borderRadius:10, border:'none', padding:'14px', fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, letterSpacing:'0.5px', background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, cursor:'pointer', boxShadow:`0 4px 14px rgba(200,169,81,0.28)` }}>
              ✏️ Update Status
            </button>
            <button onClick={onClose} style={{ borderRadius:10, border:`1px solid ${T.cream3}`, padding:'14px 20px', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, background:T.cream, color:T.muted, cursor:'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab,          setTab]          = useState<'overview'|'products'|'orders'>('overview');
  const [stats,        setStats]        = useState<Stats|null>(null);
  const [products,     setProducts]     = useState<Product[]>([]);
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [toast,        setToast]        = useState('');
  const [toastType,    setToastType]    = useState<'ok'|'err'>('ok');
  const [showWizard,   setShowWizard]   = useState(false);
  const [editProduct,  setEditProduct]  = useState<Product|null>(null);
  const [editingStock, setEditingStock] = useState<number|null>(null);
  const [stockVal,     setStockVal]     = useState('');
  const [editOrder,    setEditOrder]    = useState<Order|null>(null);
  const [viewOrder,    setViewOrder]    = useState<Order|null>(null); // NEW: order detail view
  const [orderForm,    setOrderForm]    = useState({ status:'', tracking_status:'' });
  const [savingOrder,  setSavingOrder]  = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p, o] = await Promise.all([
        axios.get('/api/admin/stats',   authH()),
        axios.get('/api/products',      authH()),
        axios.get('/api/admin/orders',  authH()),
      ]);
      setStats(s.data);
      setProducts(p.data.map((pr: any) => ({
        ...pr,
        images:   Array.isArray(pr.images)   ? pr.images   : [],
        features: Array.isArray(pr.features) ? pr.features : [],
        colors:   Array.isArray(pr.colors)   ? pr.colors   : [],
        sizes:    Array.isArray(pr.sizes)    ? pr.sizes    : [],
      })));
      setOrders(o.data);
    } catch {
      showToast('Failed to load dashboard', 'err');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => { setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3200); };
  const handleWizardSaved = () => { setShowWizard(false); setEditProduct(null); showToast(editProduct ? '✓ Product updated!' : '✓ Product published to store!'); fetchAll(); };
  const handleDelete = async (id: number, name: string) => { if (!confirm(`Delete "${name}"? This cannot be undone.`)) return; try { await axios.delete(`/api/admin/products/${id}`, authH()); showToast('Product deleted'); fetchAll(); } catch { showToast('Delete failed', 'err'); } };
  const saveStock = async (id: number) => { const v = parseInt(stockVal); if (isNaN(v) || v < 0) { showToast('Enter a valid stock number', 'err'); return; } try { await axios.patch(`/api/admin/products/${id}/stock`, { stock: v }, authH()); showToast('Stock updated!'); setEditingStock(null); fetchAll(); } catch { showToast('Stock update failed', 'err'); } };
  const saveOrderStatus = async () => { if (!editOrder) return; setSavingOrder(true); try { await axios.patch(`/api/admin/orders/${editOrder.id}/status`, orderForm, authH()); showToast('Order status updated!'); setEditOrder(null); fetchAll(); } catch { showToast('Update failed', 'err'); } finally { setSavingOrder(false); } };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight:'100vh', background:T.cream, fontFamily:"'Jost','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .tbtn{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;padding:11px 14px;border-radius:9px;border:none;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:9px;width:100%;text-align:left;letter-spacing:0.3px}
        .tbtn.on{background:linear-gradient(135deg,${T.gold},${T.gold2});color:${T.navy};box-shadow:0 4px 14px rgba(200,169,81,0.3)}
        .tbtn.off{background:transparent;color:${T.muted}}
        .tbtn.off:hover{background:rgba(200,169,81,0.08);color:${T.navy}}
        .btn{font-family:'Jost',sans-serif;font-size:12px;font-weight:600;border-radius:8px;border:none;cursor:pointer;padding:9px 16px;transition:filter 0.15s,transform 0.1s;display:inline-flex;align-items:center;gap:6px;letter-spacing:0.3px}
        .btn:hover:not(:disabled){filter:brightness(0.93);transform:translateY(-1px)}
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .row{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid ${T.cream3};border-radius:14px;padding:14px 18px;transition:all 0.2s}
        .row:hover{box-shadow:0 4px 18px rgba(13,27,62,0.08);border-color:${T.gold}}
        .kpi{border-radius:16px;padding:20px 22px;transition:transform 0.2s,box-shadow 0.2s}
        .kpi:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(13,27,62,0.1)}
        .panel{background:#fff;border:1px solid ${T.cream3};border-radius:16px;padding:20px}
        .overlay2{position:fixed;inset:0;background:rgba(13,27,62,0.6);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal2{background:#fff;border-radius:20px;padding:32px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(13,27,62,0.25)}
        .track-opt{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:9px;cursor:pointer;transition:background 0.15s;font-family:'Jost',sans-serif;font-size:13px;color:${T.navy}}
        .track-opt:hover{background:${T.cream}}
        .track-opt.cur{background:rgba(200,169,81,0.1);color:${T.gold};font-weight:700}
        .sel2{background:${T.cream};border:1.5px solid ${T.cream3};border-radius:9px;padding:11px 14px;font-family:'Jost',sans-serif;font-size:14px;color:${T.navy};width:100%;outline:none;cursor:pointer}
        .order-card-clickable{cursor:pointer;transition:all 0.2s}
        .order-card-clickable:hover{border-color:${T.gold}!important;box-shadow:0 4px 20px rgba(13,27,62,0.1)!important;transform:translateY(-1px)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wizardIn{from{opacity:0;transform:scale(0.94) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.35s ease both}
        .slide-in{animation:slideIn 0.28s ease both}
        .spinner{width:36px;height:36px;border:3px solid ${T.cream3};border-top-color:${T.gold};border-radius:50%;animation:spin 0.8s linear infinite}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${T.cream3};border-radius:6px}
        .mob-nav{display:none}
        .admin-sidebar{display:flex}
        @media(max-width:768px){
          .admin-sidebar{display:none !important}
          .mob-nav{display:flex !important;position:fixed;bottom:0;left:0;right:0;z-index:200;background:${T.navy};border-top:1px solid rgba(200,169,81,0.2);height:60px;box-shadow:0 -8px 32px rgba(13,27,62,0.3)}
          .mob-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:none;cursor:pointer;background:transparent;padding:6px 4px;font-family:'Jost',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s}
          .mob-nav-btn.on{color:${T.gold}}
          .mob-nav-btn.off{color:rgba(255,255,255,0.4)}
          .mob-nav-btn .nav-icon{font-size:19px;line-height:1}
          .admin-main{padding:14px 14px 80px !important}
          .admin-main h1{font-size:20px !important}
          .kpi-grid{grid-template-columns:repeat(2,1fr) !important;gap:9px !important;margin-bottom:14px !important}
          .kpi{padding:13px 12px !important}
          .overview-charts{grid-template-columns:1fr !important;gap:12px !important}
          .overview-bottom{grid-template-columns:1fr !important;gap:12px !important}
          .row{flex-wrap:wrap !important;gap:8px !important;padding:12px !important;align-items:flex-start !important}
          .row-actions{width:100%;justify-content:flex-end;margin-top:2px}
          .row-price{min-width:unset !important;text-align:left !important;flex:1}
          .order-card{padding:14px !important}
          .order-card-inner{flex-direction:column !important;align-items:stretch !important;gap:12px !important}
          .order-card-right{flex-direction:row !important;align-items:center !important;justify-content:space-between !important;width:100% !important}
          .order-meta-grid{grid-template-columns:1fr 1fr !important}
          .modal2{padding:20px 16px !important;border-radius:16px !important}
          .dash-date{display:none !important}
          .dash-header{flex-wrap:wrap;gap:10px}
          .products-header{flex-wrap:wrap;gap:10px}
          .products-header h1{flex:1}
        }
      `}</style>

      {toast && (
        <div className="slide-in" style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background: toastType==='ok' ? T.navy : '#C0392B', color:'#fff', fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:13, borderRadius:12, padding:'13px 28px', zIndex:999, boxShadow:`0 8px 28px rgba(13,27,62,0.3)`, whiteSpace:'nowrap', letterSpacing:'0.3px' }}>
          {toast}
        </div>
      )}

      {(showWizard || editProduct) && (
        <AddProductWizard onClose={() => { setShowWizard(false); setEditProduct(null); }} onSaved={handleWizardSaved} editProduct={editProduct}/>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdateStatus={() => {
            setEditOrder(viewOrder);
            setOrderForm({ status: viewOrder.status, tracking_status: viewOrder.tracking_status });
            setViewOrder(null);
          }}
        />
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mob-nav">
        {([
          { id:'overview', icon:'📊', label:'Overview' },
          { id:'products', icon:'📦', label:'Products' },
          { id:'orders',   icon:'🧾', label:'Orders'   },
        ] as const).map(t => (
          <button key={t.id} className={`mob-nav-btn ${tab===t.id?'on':'off'}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ display:'flex', minHeight:'100vh' }}>
        {/* ── SIDEBAR ── */}
        <aside className="admin-sidebar" style={{ width:232, background:T.navy, padding:'24px 14px', flexDirection:'column', gap:4, position:'sticky', top:0, height:'100vh', flexShrink:0, borderRight:`1px solid rgba(200,169,81,0.15)` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:30, paddingLeft:4 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.gold2})`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:14, color:T.navy, flexShrink:0 }}>L</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:'#fff' }}>Luku Prime</div>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, color:`rgba(200,169,81,0.55)`, letterSpacing:'1px', textTransform:'uppercase', marginTop:1 }}>Control Panel</div>
            </div>
          </div>
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(200,169,81,0.3),transparent)`, margin:'0 4px 16px' }}/>
          <nav style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
            {([
              { id:'overview', icon:'📊', label:'Overview', badge: null },
              { id:'products', icon:'📦', label:'Products', badge: products.length || null },
              { id:'orders',   icon:'🧾', label:'Orders',   badge: stats?.activeOrders || null },
            ] as const).map(t => (
              <button key={t.id} className={`tbtn ${tab===t.id?'on':'off'}`} onClick={() => setTab(t.id)}>
                <span>{t.icon}</span>
                <span style={{ flex:1 }}>{t.label}</span>
                {t.badge !== null && (
                  <span style={{ background: tab===t.id ? `rgba(13,27,62,0.2)` : T.gold, color: tab===t.id ? T.navy : '#fff', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:800 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div style={{ borderTop:`1px solid rgba(200,169,81,0.15)`, paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            <button className="btn" style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', width:'100%', justifyContent:'center', padding:'10px' }} onClick={fetchAll}>🔄 Refresh</button>
            <button className="btn" style={{ background:`rgba(200,169,81,0.1)`, color:T.gold2, border:`1px solid rgba(200,169,81,0.2)`, width:'100%', justifyContent:'center', padding:'10px' }} onClick={() => navigate('/')}>← Back to Store</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="admin-main" style={{ flex:1, padding:'32px 36px 60px', overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:18 }}>
              <div className="spinner"/>
              <p style={{ fontFamily:'Jost,sans-serif', color:T.muted, fontSize:14 }}>Loading dashboard…</p>
            </div>
          ) : (<>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && stats && (
            <div className="fade-up">
              <div className="dash-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
                <div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:6 }}>Dashboard</div>
                  <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:T.navy }}>Overview</h1>
                </div>
                <div className="dash-date" style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted, background:'#fff', border:`1px solid ${T.cream3}`, borderRadius:9, padding:'8px 14px' }}>
                  📅 {new Date().toLocaleDateString('en-KE',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>

              <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(178px,1fr))', gap:14, marginBottom:24 }}>
                {[
                  { label:'Total Revenue', value:`KSh ${stats.totalRevenue.toLocaleString()}`, icon:'💰', col:T.gold,    bg:`rgba(200,169,81,0.08)`,  border:`rgba(200,169,81,0.25)`,  sub:'Confirmed orders' },
                  { label:'Active Orders', value:stats.activeOrders,                           icon:'⏳', col:'#B7791F', bg:'#FDF8EC',               border:'#F6E4A0',               sub:'Awaiting delivery' },
                  { label:'Total Orders',  value:stats.totalOrders,                            icon:'🧾', col:'#4A8A4A', bg:'#EEF5EE',               border:'#C8DFC8',               sub:'All time' },
                  { label:'Products',      value:stats.totalProducts,                          icon:'📦', col:T.navy3,   bg:`rgba(30,47,90,0.07)`,    border:`rgba(30,47,90,0.15)`,    sub:'In catalogue' },
                  { label:'Customers',     value:stats.totalUsers,                             icon:'👥', col:'#2B7AB5', bg:'#EDF5FB',               border:'#BAD9EF',               sub:'Registered' },
                ].map(k => (
                  <div key={k.label} className="kpi" style={{ background:k.bg, border:`1px solid ${k.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:26 }}>{k.icon}</span>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:k.col, marginTop:4 }}/>
                    </div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:k.col, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:12, color:T.navy }}>{k.label}</div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div className="overview-charts" style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:18, marginBottom:18 }}>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.navy }}>📈 Revenue — Last 7 Days</div>
                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted }}>KSh {stats.revenueByDay.reduce((s,d) => s + parseFloat(d.revenue), 0).toLocaleString()}</div>
                  </div>
                  <RevenueChart data={stats.revenueByDay}/>
                </div>
                <div className="panel">
                  <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.navy, marginBottom:14 }}>📊 Orders by Status</div>
                  {stats.ordersByStatus.length === 0
                    ? <p style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, textAlign:'center', padding:'16px 0' }}>No orders yet</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        {stats.ordersByStatus.map(r => { const sc = SC[r.status] || SC.pending; return (
                          <div key={r.status} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:9 }}>
                            <span style={{ fontFamily:'Jost,sans-serif', fontSize:12, fontWeight:600, color:sc.col, textTransform:'capitalize' }}>{r.status}</span>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:sc.col }}>{r.count}</span>
                          </div>
                        ); })}
                      </div>
                  }
                </div>
              </div>

              <div className="overview-bottom" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.navy }}>🧾 Recent Orders</div>
                    <button className="btn" style={{ background:T.cream, color:T.gold, border:`1px solid ${T.cream3}`, fontSize:11, padding:'5px 12px' }} onClick={() => setTab('orders')}>View All →</button>
                  </div>
                  {stats.recentOrders.length === 0
                    ? <p style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:T.muted, textAlign:'center', padding:'16px 0' }}>No orders yet</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        {stats.recentOrders.map(o => { const sc = SC[o.status] || SC.pending; return (
                          <div key={o.id} onClick={() => { setTab('orders'); }} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:T.cream, borderRadius:10, border:`1px solid ${T.cream3}`, cursor:'pointer' }}>
                            <div>
                              <div style={{ fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:12, color:T.navy }}>{o.customer_name||'Customer'} <span style={{ color:T.muted, fontWeight:400 }}>#{o.id}</span></div>
                              <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, marginTop:1 }}>{new Date(o.created_at).toLocaleDateString('en-KE')}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:T.gold }}>KSh {Number(o.total).toLocaleString()}</span>
                              <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, background:sc.bg, color:sc.col, border:`1px solid ${sc.border}`, textTransform:'capitalize' }}>{o.status}</span>
                            </div>
                          </div>
                        ); })}
                      </div>
                  }
                </div>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.navy }}>⚠️ Low Stock Alerts</div>
                    <button className="btn" style={{ background:T.cream, color:T.gold, border:`1px solid ${T.cream3}`, fontSize:11, padding:'5px 12px' }} onClick={() => setTab('products')}>Manage →</button>
                  </div>
                  {stats.lowStock.length === 0
                    ? <p style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:'#4A8A4A', textAlign:'center', padding:'16px 0' }}>✓ All products well stocked</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                        {stats.lowStock.map(p => (
                          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background: p.stock===0 ? '#FDF0EE' : '#FDF8EC', borderRadius:10, border:`1px solid ${p.stock===0?'#F5C6C0':'#F6E4A0'}` }}>
                            <img src={p.image_url || `https://placehold.co/40x40/F0EAD8/0D1B3E?text=📦`} style={{ width:38, height:38, borderRadius:9, objectFit:'cover', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/F0EAD8/0D1B3E?text=📦`; }}/>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:'Jost,sans-serif', fontWeight:600, fontSize:12, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color: p.stock===0 ? '#C0392B' : '#B7791F', marginTop:1 }}>{p.stock===0 ? '❌ Out of stock' : `⚠️ Only ${p.stock} left`}</div>
                            </div>
                            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:T.gold, flexShrink:0 }}>KSh {Number(p.price).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ PRODUCTS ══ */}
          {tab === 'products' && (
            <div className="fade-up">
              <div className="products-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:6 }}>Catalogue</div>
                  <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:T.navy }}>Products ({products.length})</h1>
                </div>
                <button className="btn" style={{ background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, padding:'12px 24px', fontSize:12, fontWeight:700, borderRadius:8, letterSpacing:'1px', boxShadow:`0 4px 14px rgba(200,169,81,0.3)`, flexShrink:0 }} onClick={() => { setEditProduct(null); setShowWizard(true); }}>
                  + Add Product
                </button>
              </div>

              <div style={{ display:'flex', alignItems:'center', background:'#fff', border:`1px solid ${T.cream3}`, borderRadius:10, padding:'10px 16px', gap:10, marginBottom:16 }}>
                <span style={{ opacity:0.4, fontSize:15 }}>🔍</span>
                <input style={{ border:'none', background:'transparent', outline:'none', fontFamily:'Jost,sans-serif', fontSize:14, color:T.navy, flex:1 }} placeholder="Search by name or category…" value={search} onChange={e => setSearch(e.target.value)}/>
                {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, fontSize:15 }}>✕</button>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign:'center', padding:'60px 0', color:T.muted, fontFamily:'Jost,sans-serif' }}>
                    {search ? `No products match "${search}"` : (
                      <div>
                        <div style={{ fontSize:50, marginBottom:14 }}>📦</div>
                        <div style={{ fontWeight:600, fontSize:15, marginBottom:8, color:T.navy }}>No products yet</div>
                        <button className="btn" style={{ background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, padding:'12px 28px', fontSize:12, fontWeight:700, borderRadius:8, margin:'0 auto' }} onClick={() => setShowWizard(true)}>+ Add Your First Product</button>
                      </div>
                    )}
                  </div>
                )}
                {filtered.map(p => {
                  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
                  return (
                    <div key={p.id} className="row">
                      <img src={imgs[0] || `https://placehold.co/64x64/F0EAD8/0D1B3E?text=📦`} alt={p.name} style={{ width:62, height:62, borderRadius:12, objectFit:'cover', flexShrink:0, border:`1px solid ${T.cream3}` }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/F0EAD8/0D1B3E?text=📦`; }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:15, color:T.navy, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, display:'flex', gap:10, flexWrap:'wrap' }}>
                          {p.category && <span>🏷 {p.category}</span>}
                          <span>🖼 {imgs.length} photo{imgs.length!==1?'s':''}</span>
                          {p.colors?.length > 0 && <span>🎨 {p.colors.length} colour{p.colors.length!==1?'s':''}</span>}
                          {p.sizes?.length  > 0 && <span>📐 {p.sizes.length} size{p.sizes.length!==1?'s':''}</span>}
                        </div>
                        {p.colors?.length > 0 && (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:5 }}>
                            {p.colors.map((c: string, i: number) => (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:4, background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:20, padding:'2px 8px 2px 5px', fontFamily:'Jost,sans-serif', fontSize:10, color:T.navy, fontWeight:600 }}>
                                <div style={{ width:9, height:9, borderRadius:'50%', background:c, border:'1px solid rgba(0,0,0,0.12)', flexShrink:0 }}/>{c}
                              </div>
                            ))}
                          </div>
                        )}
                        {p.sizes?.length > 0 && (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
                            {p.sizes.map((s: string, i: number) => (
                              <div key={i} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:6, padding:'2px 8px', fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.navy }}>{s}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink:0 }}>
                        {editingStock === p.id ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <input type="number" value={stockVal} onChange={e => setStockVal(e.target.value)} onKeyDown={e => { if (e.key==='Enter') saveStock(p.id); if (e.key==='Escape') setEditingStock(null); }} autoFocus style={{ width:64, textAlign:'center', background:T.cream, border:`2px solid ${T.gold}`, borderRadius:7, padding:'6px 8px', fontFamily:'Jost,sans-serif', fontSize:14, color:T.navy, outline:'none' }}/>
                            <button className="btn" style={{ background:'#4A8A4A', color:'#fff', padding:'6px 10px' }} onClick={() => saveStock(p.id)}>✓</button>
                            <button className="btn" style={{ background:T.cream, color:T.muted, border:`1px solid ${T.cream3}`, padding:'6px 10px' }} onClick={() => setEditingStock(null)}>✕</button>
                          </div>
                        ) : (
                          <div title="Click to edit stock" onClick={() => { setEditingStock(p.id); setStockVal(String(p.stock ?? 0)); }} style={{ cursor:'pointer', padding:'6px 14px', borderRadius:9, background: p.stock===0 ? '#FDF0EE' : p.stock<=5 ? '#FDF8EC' : '#EEF5EE', border:`1px solid ${p.stock===0?'#F5C6C0':p.stock<=5?'#F6E4A0':'#C8DFC8'}` }}>
                            <div style={{ fontFamily:'Jost,sans-serif', fontSize:9, color:T.muted, marginBottom:2, letterSpacing:'1px', textTransform:'uppercase' }}>STOCK</div>
                            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color: p.stock===0 ? '#C0392B' : p.stock<=5 ? '#B7791F' : '#2E7D32' }}>{p.stock ?? 0}</div>
                          </div>
                        )}
                      </div>
                      <div className="row-price" style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:T.gold, flexShrink:0, minWidth:110, textAlign:'right' }}>
                        KSh {Number(p.price).toLocaleString()}
                      </div>
                      <div className="row-actions" style={{ display:'flex', gap:7, flexShrink:0 }}>
                        <button className="btn" style={{ background:T.cream, color:T.navy, border:`1px solid ${T.cream3}` }} onClick={() => setEditProduct(p)}>✏️ Edit</button>
                        <button className="btn" style={{ background:'#FDF0EE', color:'#C0392B', border:'1px solid #F5C6C0', padding:'9px 10px' }} onClick={() => handleDelete(p.id, p.name)}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {tab === 'orders' && (
            <div className="fade-up">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:6 }}>Sales</div>
                  <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:28, color:T.navy }}>Orders ({orders.length})</h1>
                </div>
                {stats && stats.activeOrders > 0 && (
                  <div style={{ background:`rgba(200,169,81,0.1)`, border:`1px solid rgba(200,169,81,0.3)`, borderRadius:10, padding:'10px 18px', fontFamily:'Jost,sans-serif', fontSize:12, color:T.gold, fontWeight:700 }}>
                    ⏳ {stats.activeOrders} active order{stats.activeOrders!==1?'s':''} need attention
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {orders.length === 0 && <div style={{ textAlign:'center', padding:'60px 0', color:T.muted, fontFamily:'Jost,sans-serif', fontSize:14 }}>No orders yet.</div>}
                {orders.map(o => {
                  const sc = SC[o.status] || SC.pending;
                  const items = parseItemsSnapshot(o.items_snapshot);
                  const previewItems = items.slice(0, 3);
                  return (
                    <div key={o.id} className="order-card order-card-clickable" onClick={() => setViewOrder(o)}
                      style={{ background:'#fff', border:`1px solid ${T.cream3}`, borderRadius:16, padding:'18px 22px' }}>
                      <div className="order-card-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color:T.navy }}>Order #{o.id}</span>
                            <span style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, padding:'3px 12px', borderRadius:20, background:sc.bg, color:sc.col, border:`1px solid ${sc.border}`, textTransform:'capitalize', letterSpacing:'0.3px' }}>{o.status}</span>
                            <span style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:20, padding:'3px 10px' }}>🚚 {o.tracking_status}</span>
                          </div>
                          <div className="order-meta-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:5, marginBottom: previewItems.length > 0 ? 12 : 0 }}>
                            <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.navy }}>👤 <strong>{o.customer_name||'Unknown'}</strong></div>
                            <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>✉️ {o.customer_email||'—'}</div>
                            <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>📱 {o.mpesa_phone||'—'}</div>
                            {o.mpesa_receipt && <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted }}>🧾 <strong style={{ color:'#4A8A4A' }}>{o.mpesa_receipt}</strong></div>}
                            <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, color:T.muted }}>🕐 {new Date(o.created_at).toLocaleString('en-KE')}</div>
                          </div>

                          {/* ── Mini product preview ── */}
                          {previewItems.length > 0 && (
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              {previewItems.map((item: any, i: number) => {
                                const imgSrc = item.image_url || item.imageUrl || item.image || null;
                                const itemName = item.name || item.product_name || `Item ${i+1}`;
                                const selectedColor = item.selected_color || item.color || null;
                                const selectedSize = item.selected_size || item.size || null;
                                return (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:10, padding:'6px 10px 6px 6px', maxWidth:220 }}>
                                    <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', flexShrink:0, background:T.cream2 }}>
                                      {imgSrc ? (
                                        <img src={imgSrc} alt={itemName} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/36x36/F0EAD8/0D1B3E?text=📦`; }}/>
                                      ) : (
                                        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
                                      )}
                                    </div>
                                    <div style={{ minWidth:0 }}>
                                      <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{itemName}</div>
                                      <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
                                        {selectedColor && (
                                          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                                            <div style={{ width:8, height:8, borderRadius:'50%', background:selectedColor, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }}/>
                                            <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, color:T.muted }}>{selectedColor}</span>
                                          </div>
                                        )}
                                        {selectedSize && <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:T.muted }}>/ {selectedSize}</span>}
                                        {item.quantity > 1 && <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, color:T.muted }}>× {item.quantity}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {items.length > 3 && (
                                <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, color:T.muted, fontWeight:600 }}>+{items.length - 3} more</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="order-card-right" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.gold }}>KSh {Number(o.total).toLocaleString()}</div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="btn" style={{ background:T.cream, color:T.navy, border:`1px solid ${T.cream3}`, fontSize:11, padding:'7px 12px' }}
                              onClick={e => { e.stopPropagation(); setViewOrder(o); }}>
                              👁 Details
                            </button>
                            <button className="btn" style={{ background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, padding:'7px 12px', fontWeight:700, fontSize:11 }}
                              onClick={e => { e.stopPropagation(); setEditOrder(o); setOrderForm({ status:o.status, tracking_status:o.tracking_status }); }}>
                              ✏️ Update
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </>)}
        </main>
      </div>

      {/* ── ORDER STATUS UPDATE MODAL ── */}
      {editOrder && (
        <div className="overlay2" onClick={e => { if (e.target === e.currentTarget) setEditOrder(null); }}>
          <div className="modal2" style={{ animation:'fadeUp 0.3s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.gold, letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>Order #{editOrder.id}</div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.navy }}>Update Status</h2>
              </div>
              <button onClick={() => setEditOrder(null)} style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:9, width:36, height:36, cursor:'pointer', fontSize:15, color:T.muted, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ background:T.cream, border:`1px solid ${T.cream3}`, borderRadius:12, padding:'13px 16px', marginBottom:18 }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontWeight:700, fontSize:13, color:T.navy }}>{editOrder.customer_name||'Customer'}</div>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted, marginTop:2 }}>{editOrder.customer_email}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <div style={{ fontFamily:'Jost,sans-serif', fontSize:12, color:T.muted }}>📱 {editOrder.mpesa_phone||'—'}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.gold }}>KSh {Number(editOrder.total).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ background:`rgba(200,169,81,0.07)`, border:`1px solid rgba(200,169,81,0.2)`, borderRadius:10, padding:'10px 14px', marginBottom:16, fontFamily:'Jost,sans-serif', fontSize:12, color:T.gold }}>
              💡 Selecting a tracking step automatically sets the order status.
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>
                Order Status
                {orderForm.status && (
                  <span style={{ marginLeft:10, background:SC[orderForm.status]?.bg, color:SC[orderForm.status]?.col, border:`1px solid ${SC[orderForm.status]?.border}`, borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:700, textTransform:'capitalize', letterSpacing:'0.3px' }}>{orderForm.status}</span>
                )}
              </div>
              <select className="sel2" value={orderForm.status} onChange={e => { const ns = e.target.value; setOrderForm({ status:ns, tracking_status: ns==='cancelled' ? 'Order Placed' : orderForm.tracking_status }); }}>
                {ORDER_STATUSES.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase()+st.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>Tracking Step</div>
              <div style={{ background:T.cream, borderRadius:12, padding:8, border:`1px solid ${T.cream3}`, display:'flex', flexDirection:'column', gap:2 }}>
                {TRACKING_STEPS.map((step, i) => (
                  <div key={step} className={`track-opt ${orderForm.tracking_status===step?'cur':''}`} onClick={() => setOrderForm({ tracking_status:step, status: TRACKING_TO_STATUS[step] ?? orderForm.status })}>
                    <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, border:`2px solid ${orderForm.tracking_status===step?T.gold:T.cream3}`, background: orderForm.tracking_status===step ? T.gold : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: orderForm.tracking_status===step ? T.navy : T.muted, fontFamily:'Jost,sans-serif' }}>{i+1}</div>
                    <span style={{ flex:1 }}>{step}</span>
                    <span style={{ fontFamily:'Jost,sans-serif', fontSize:9, fontWeight:700, color:SC[TRACKING_TO_STATUS[step]]?.col, opacity: orderForm.tracking_status===step ? 1 : 0.45, textTransform:'capitalize', letterSpacing:'0.5px' }}>→ {TRACKING_TO_STATUS[step]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn" style={{ flex:1, background:`linear-gradient(135deg,${T.gold},${T.gold2})`, color:T.navy, padding:'13px', fontSize:12, fontWeight:700, justifyContent:'center', borderRadius:10, letterSpacing:'0.5px', boxShadow:`0 4px 14px rgba(200,169,81,0.28)` }} onClick={saveOrderStatus} disabled={savingOrder}>
                {savingOrder ? '⏳ Saving…' : '✓ Save Changes'}
              </button>
              <button className="btn" style={{ background:T.cream, color:T.muted, border:`1px solid ${T.cream3}`, padding:'13px 18px', borderRadius:10 }} onClick={() => setEditOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display:'block', fontFamily:'Jost,sans-serif', fontSize:10, fontWeight:700,
  color:'#7A8099', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8,
};
const inp: React.CSSProperties = {
  background:'#F9F5EC', border:`1.5px solid #E4D9C0`, borderRadius:10,
  padding:'12px 14px', fontFamily:'Jost,sans-serif', fontSize:14,
  color:'#0D1B3E', width:'100%', outline:'none', transition:'border-color 0.2s',
};