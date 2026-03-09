import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: number; name: string; price: string; category: string;
  description: string; features: string[]; stock: number;
  images: string[]; image_url: string;
}
interface Order {
  id: number; customer_name: string; customer_email: string;
  total: string; status: string; tracking_status: string;
  mpesa_phone: string; mpesa_receipt: string;
  items_snapshot: any; created_at: string;
}
interface Stats {
  totalOrders: number; totalProducts: number;
  totalRevenue: number; totalUsers: number; activeOrders: number;
  recentOrders: Order[];
  topProducts: any[];
  lowStock: any[];
  revenueByDay: { day: string; revenue: string; orders: string }[];
  ordersByStatus: { status: string; count: string }[];
}

const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const TRACKING_STEPS = [
  'Order Placed','Payment Confirmed','Processing',
  'Packed','Shipped','Out for Delivery','Delivered',
];
const ORDER_STATUSES  = ['pending','confirmed','processing','shipped','delivered','cancelled'];
const CATEGORIES      = ['Electronics','Fashion','Home & Living','Beauty & Health','Sports','Other'];

const SC: Record<string,{bg:string;col:string;border:string}> = {
  pending:    { bg:'#FDF8EC', col:'#B7791F', border:'#F6E4A0' },
  confirmed:  { bg:'#EEF5EE', col:'#5A8A5A', border:'#C8DFC8' },
  processing: { bg:'#EEF0FA', col:'#4A5FBF', border:'#C5CBEE' },
  shipped:    { bg:'#EDF5FB', col:'#2B7AB5', border:'#BAD9EF' },
  delivered:  { bg:'#EEF5EE', col:'#2E7D32', border:'#A5D6A7' },
  cancelled:  { bg:'#FDF0EE', col:'#C0392B', border:'#F5C6C0' },
};

// ── Revenue bar chart ─────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: { day: string; revenue: string }[] }) {
  if (!data.length) return (
    <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#BEA898' }}>
      No revenue data yet — make some sales!
    </div>
  );
  const max = Math.max(...data.map(d => parseFloat(d.revenue)), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:130, padding:'0 4px' }}>
      {data.map((d, i) => {
        const h   = Math.max((parseFloat(d.revenue) / max) * 100, 3);
        const day = new Date(d.day).toLocaleDateString('en-KE', { weekday:'short' });
        const rev = parseFloat(d.revenue);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, fontWeight:700, color:'#C4703A', minHeight:14 }}>
              {rev > 0 ? `${(rev/1000).toFixed(1)}k` : ''}
            </div>
            <div title={`KSh ${rev.toLocaleString()}`} style={{
              width:'100%', borderRadius:'6px 6px 0 0',
              background:'linear-gradient(180deg,#E8944A 0%,#C4703A 100%)',
              height:`${h}%`, minHeight:4,
              transition:'height 0.6s cubic-bezier(.34,1.56,.64,1)',
            }} />
            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, color:'#9C7A60' }}>{day}</div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD PRODUCT WIZARD  (3 steps)
// Step 1 — pick images from device
// Step 2 — fill in product details
// Step 3 — review & submit
// ══════════════════════════════════════════════════════════════════════════════
interface WizardProps {
  onClose: () => void;
  onSaved: () => void;
  editProduct?: Product | null;
}

function AddProductWizard({ onClose, onSaved, editProduct }: WizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]     = useState<1|2|3>(editProduct ? 2 : 1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Images
  const [files,        setFiles]        = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [existingImgs, setExistingImgs] = useState<string[]>(
    editProduct ? (editProduct.images || []) : []
  );
  const [mainIdx, setMainIdx] = useState(0); // which image is the "cover"

  // Details
  const [name,        setName]        = useState(editProduct?.name        || '');
  const [price,       setPrice]       = useState(editProduct?.price       || '');
  const [stock,       setStock]       = useState(String(editProduct?.stock ?? ''));
  const [category,    setCategory]    = useState(editProduct?.category    || '');
  const [description, setDescription] = useState(editProduct?.description || '');

  // Add files from <input> or drag-drop
  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid].slice(0, 8));
    valid.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPreviews(prev => [...prev, ev.target!.result as string].slice(0, 8));
      r.readAsDataURL(f);
    });
  };

  const removeNew = (i: number) => {
    setFiles(f => f.filter((_,j)=>j!==i));
    setPreviews(p => p.filter((_,j)=>j!==i));
    if (mainIdx >= previews.length - 1) setMainIdx(Math.max(0, mainIdx - 1));
  };
  const removeOld = (i: number) => {
    setExistingImgs(imgs => imgs.filter((_,j)=>j!==i));
  };

  const totalImgs = existingImgs.length + previews.length;

  // Validation
  const step1Ok = totalImgs > 0;
  const step2Ok = name.trim() !== '' && price !== '' && Number(price) > 0;

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
      if (editProduct) fd.append('existingImages', JSON.stringify(existingImgs));
      files.forEach(f => fd.append('images', f));

      const hdrs = { ...authH().headers, 'Content-Type': 'multipart/form-data' };
      if (editProduct) {
        await axios.put(`/api/admin/products/${editProduct.id}`, fd, { headers: hdrs });
      } else {
        await axios.post('/api/admin/products', fd, { headers: hdrs });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to save product. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // Step labels
  const STEPS = [
    { n:1, label:'Add Photos'   },
    { n:2, label:'Product Info' },
    { n:3, label:'Review'       },
  ];

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(44,26,14,0.55)',
      backdropFilter:'blur(4px)',
      zIndex:400,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:'#fff', borderRadius:28, width:'100%', maxWidth:560,
        maxHeight:'92vh', overflowY:'auto',
        boxShadow:'0 40px 100px rgba(44,26,14,0.25)',
        animation:'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)',
      }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ padding:'28px 32px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>
                {editProduct ? 'Edit Product' : 'New Product'}
              </div>
              <h2 style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:22, color:'#2C1A0E' }}>
                {editProduct ? 'Update Details' : 'Add to Catalogue'}
              </h2>
            </div>
            <button onClick={onClose} style={{
              background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:10,
              width:38, height:38, cursor:'pointer', fontSize:18, color:'#9C7A60',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>✕</button>
          </div>

          {/* Step indicator */}
          {!editProduct && (
            <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{
                      width:34, height:34, borderRadius:'50%',
                      background: step === s.n ? 'linear-gradient(135deg,#C4703A,#E8944A)'
                                : step > s.n ? '#5A8A5A' : '#EDE3D9',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13,
                      color: step >= s.n ? '#fff' : '#9C7A60',
                      transition:'all 0.3s',
                      boxShadow: step === s.n ? '0 4px 12px rgba(196,112,58,0.35)' : 'none',
                    }}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, fontWeight:700, color: step === s.n ? '#C4703A' : '#BEA898', whiteSpace:'nowrap' }}>
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length-1 && (
                    <div style={{ flex:1, height:2, background: step > s.n ? '#5A8A5A' : '#EDE3D9', margin:'0 8px 18px', transition:'background 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Step content ──────────────────────────────────── */}
        <div style={{ padding:'0 32px 32px' }}>

          {/* ═══ STEP 1 — Image picker ═══ */}
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#8C6A50', marginBottom:20, lineHeight:1.6 }}>
                Start by adding photos of your product. The first image will be the cover photo shown in the store.
              </p>

              {/* Big drop zone (shown when no images yet) */}
              {totalImgs === 0 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#C4703A'; e.currentTarget.style.background='#FDF6F0'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor='#EDE3D9'; e.currentTarget.style.background='#FDFAF7'; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='#EDE3D9'; e.currentTarget.style.background='#FDFAF7'; addFiles(Array.from(e.dataTransfer.files)); }}
                  style={{
                    border:'2.5px dashed #EDE3D9', borderRadius:20, padding:'52px 24px',
                    textAlign:'center', cursor:'pointer', background:'#FDFAF7',
                    transition:'all 0.2s',
                  }}
                >
                  <div style={{ fontSize:56, marginBottom:14 }}>📷</div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:16, color:'#5C3D1E', marginBottom:8 }}>
                    Tap to choose photos
                  </div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#9C7A60', marginBottom:16 }}>
                    or drag and drop images here
                  </div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#C4703A,#E8944A)', color:'#fff', borderRadius:30, padding:'11px 28px', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14 }}>
                    📁 Browse Device
                  </div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#BEA898', marginTop:14 }}>
                    JPG, PNG, WebP · Up to 8 images · Max 10 MB each
                  </div>
                </div>
              )}

              {/* Image grid (shown after picking) */}
              {totalImgs > 0 && (
                <div>
                  {/* Cover preview */}
                  <div style={{ position:'relative', width:'100%', height:220, borderRadius:18, overflow:'hidden', marginBottom:16, background:'#F5EDE3' }}>
                    <img
                      src={existingImgs[0] || previews[0]}
                      alt="Cover"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/560x220/F5EDE3/9C7A60?text=Image'; }}
                    />
                    <div style={{ position:'absolute', top:12, left:12, background:'rgba(44,26,14,0.65)', color:'#fff', borderRadius:20, padding:'4px 12px', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700 }}>
                      📌 Cover Photo
                    </div>
                    <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(44,26,14,0.65)', color:'#fff', borderRadius:20, padding:'4px 10px', fontFamily:'DM Sans,sans-serif', fontSize:11 }}>
                      {totalImgs} / 8 photos
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
                    {existingImgs.map((img, i) => (
                      <div key={`ex${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={img} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12, border: i === 0 ? '2.5px solid #C4703A' : '1.5px solid #EDE3D9' }}
                          onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/72x72/F5EDE3/9C7A60?text=📦'; }} />
                        <button onClick={() => removeOld(i)} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                      </div>
                    ))}
                    {previews.map((prev, i) => (
                      <div key={`nw${i}`} style={{ position:'relative', width:72, height:72 }}>
                        <img src={prev} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12, border: (existingImgs.length===0 && i===0) ? '2.5px solid #C4703A' : '1.5px solid #C4703A', opacity:1 }} />
                        <button onClick={() => removeNew(i)} style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#C0392B', color:'#fff', border:'2px solid #fff', cursor:'pointer', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                        <div style={{ position:'absolute', bottom:4, left:4, background:'#5A8A5A', color:'#fff', fontSize:7, fontWeight:700, fontFamily:'DM Sans,sans-serif', padding:'2px 4px', borderRadius:3 }}>NEW</div>
                      </div>
                    ))}

                    {/* Add more tile */}
                    {totalImgs < 8 && (
                      <div onClick={() => fileRef.current?.click()}
                        style={{ width:72, height:72, borderRadius:12, border:'2px dashed #EDE3D9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#FDFAF7', gap:4, transition:'all 0.2s' }}>
                        <span style={{ fontSize:20 }}>+</span>
                        <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:9, color:'#9C7A60', fontWeight:600 }}>Add more</span>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div style={{ background:'#FDF6EF', border:'1px solid #F5D5B8', borderRadius:12, padding:'12px 16px' }}>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#8C6A50', fontWeight:600, marginBottom:4 }}>📸 Photo tips</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60', lineHeight:1.6 }}>
                      • Good lighting makes a big difference<br/>
                      • Show the product from multiple angles<br/>
                      • First photo is the cover shown in search results
                    </div>
                  </div>
                </div>
              )}

              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:'none' }}
                onChange={e => addFiles(Array.from(e.target.files || []))} />

              <div style={{ display:'flex', gap:12, marginTop:24 }}>
                <button onClick={onClose} style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:12, padding:'13px 20px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14, color:'#8C6A50', cursor:'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Ok}
                  style={{
                    flex:1, borderRadius:12, border:'none', padding:'14px',
                    fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15,
                    background: step1Ok ? 'linear-gradient(135deg,#C4703A,#E8944A)' : '#EDE3D9',
                    color: step1Ok ? '#fff' : '#BEA898',
                    cursor: step1Ok ? 'pointer' : 'not-allowed',
                    transition:'all 0.2s',
                  }}
                >
                  {step1Ok ? `Continue with ${totalImgs} photo${totalImgs !== 1 ? 's' : ''} →` : 'Add at least 1 photo to continue'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 2 — Product details ═══ */}
          {step === 2 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>

              {/* Show tiny image reminder */}
              {(existingImgs.length > 0 || previews.length > 0) && !editProduct && (
                <div style={{ display:'flex', alignItems:'center', gap:12, background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:14, padding:'10px 16px', marginBottom:22 }}>
                  <img src={existingImgs[0] || previews[0]} style={{ width:44, height:44, borderRadius:10, objectFit:'cover', flexShrink:0, border:'1.5px solid #C8DFC8' }} />
                  <div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, color:'#2E7D32' }}>✓ {totalImgs} photo{totalImgs!==1?'s':''} ready</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#5A8A5A', marginTop:2 }}>Now fill in the product details below</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ marginLeft:'auto', fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#C4703A', fontWeight:600, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>
                    Change photos
                  </button>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                {/* Product name */}
                <div>
                  <label style={lbl}>Product Name *</label>
                  <input
                    className="winp"
                    placeholder="e.g. Leather Crossbody Bag"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    style={{ ...inpStyle, borderColor: name.trim() ? '#5A8A5A' : '#EDE3D9' }}
                  />
                  {name.trim() && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#5A8A5A', marginTop:5 }}>✓ Looks good</div>}
                </div>

                {/* Price */}
                <div>
                  <label style={lbl}>Price (KSh) *</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#9C7A60', pointerEvents:'none' }}>KSh</div>
                    <input
                      type="number" min="0" placeholder="0"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      style={{ ...inpStyle, paddingLeft:52, borderColor: price && Number(price) > 0 ? '#5A8A5A' : '#EDE3D9' }}
                    />
                  </div>
                  {price && Number(price) > 0 && (
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#5A8A5A', marginTop:5 }}>
                      ✓ KSh {Number(price).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Stock count */}
                <div>
                  <label style={lbl}>Items Available (Stock)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <button
                      onClick={() => setStock(s => String(Math.max(0, parseInt(s||'0') - 1)))}
                      style={{ width:44, height:44, borderRadius:10, border:'1.5px solid #EDE3D9', background:'#FBF6F0', fontSize:20, cursor:'pointer', fontFamily:'DM Sans,sans-serif', color:'#5C3D1E', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      −
                    </button>
                    <input
                      type="number" min="0"
                      value={stock}
                      onChange={e => setStock(e.target.value)}
                      style={{ ...inpStyle, textAlign:'center', fontFamily:'Lora,serif', fontWeight:700, fontSize:20, flex:1, borderColor:'#EDE3D9' }}
                    />
                    <button
                      onClick={() => setStock(s => String(parseInt(s||'0') + 1))}
                      style={{ width:44, height:44, borderRadius:10, border:'1.5px solid #EDE3D9', background:'#FBF6F0', fontSize:20, cursor:'pointer', fontFamily:'DM Sans,sans-serif', color:'#5C3D1E', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      +
                    </button>
                  </div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#9C7A60', marginTop:5 }}>
                    {parseInt(stock||'0') === 0 ? '⚠️ Product will show as out of stock' : `✓ ${parseInt(stock||'0')} units will be available`}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={lbl}>Category</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setCategory(cat => cat === c ? '' : c)}
                        style={{
                          border: category === c ? '2px solid #C4703A' : '1.5px solid #EDE3D9',
                          borderRadius:10, padding:'9px 6px',
                          background: category === c ? '#FDF0E6' : '#FBF6F0',
                          fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600,
                          color: category === c ? '#C4703A' : '#8C6A50',
                          cursor:'pointer', transition:'all 0.15s', textAlign:'center',
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={lbl}>
                    Product Description
                    <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6, color:'#BEA898', fontSize:11 }}>(optional but recommended)</span>
                  </label>
                  <textarea
                    placeholder="Describe what makes this product special — materials, features, who it's for, how to use it…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    style={{
                      background:'#FBF6F0', border:'1.5px solid #EDE3D9', borderRadius:12,
                      padding:'12px 14px', fontFamily:'DM Sans,sans-serif', fontSize:14,
                      color:'#2C1A0E', width:'100%', outline:'none', resize:'vertical',
                      lineHeight:1.65, transition:'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor='#C4703A'}
                    onBlur={e => e.target.style.borderColor='#EDE3D9'}
                  />
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#BEA898', marginTop:5, textAlign:'right' }}>
                    {description.length} characters
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:10, padding:'12px 16px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#C0392B', marginTop:16 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:26 }}>
                {!editProduct && (
                  <button onClick={() => setStep(1)} style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:12, padding:'13px 20px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14, color:'#8C6A50', cursor:'pointer' }}>
                    ← Photos
                  </button>
                )}
                {editProduct && (
                  <button onClick={onClose} style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:12, padding:'13px 20px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14, color:'#8C6A50', cursor:'pointer' }}>
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => { if (!step2Ok) { setError('Please enter a product name and price.'); return; } setError(''); setStep(3); }}
                  disabled={!step2Ok}
                  style={{
                    flex:1, borderRadius:12, border:'none', padding:'14px',
                    fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15,
                    background: step2Ok ? 'linear-gradient(135deg,#C4703A,#E8944A)' : '#EDE3D9',
                    color: step2Ok ? '#fff' : '#BEA898',
                    cursor: step2Ok ? 'pointer' : 'not-allowed',
                    transition:'all 0.2s',
                  }}>
                  {editProduct ? 'Review Changes →' : 'Review & Publish →'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3 — Review & submit ═══ */}
          {step === 3 && (
            <div style={{ animation:'fadeUp 0.28s ease both' }}>
              <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#8C6A50', marginBottom:20 }}>
                Review everything before publishing to the store.
              </p>

              {/* Product preview card */}
              <div style={{ border:'1.5px solid #EDE3D9', borderRadius:20, overflow:'hidden', marginBottom:22, background:'#fff', boxShadow:'0 4px 20px rgba(44,26,14,0.08)' }}>
                {/* Image */}
                {(existingImgs[0] || previews[0]) ? (
                  <div style={{ height:200, overflow:'hidden', background:'#F5EDE3' }}>
                    <img src={existingImgs[0] || previews[0]} alt={name}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/560x200/F5EDE3/9C7A60?text=Product'; }} />
                  </div>
                ) : (
                  <div style={{ height:100, background:'#F5EDE3', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#9C7A60' }}>No image</div>
                )}

                <div style={{ padding:'18px 20px' }}>
                  {category && (
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1px', textTransform:'uppercase', marginBottom:6 }}>
                      {category}
                    </div>
                  )}
                  <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:18, color:'#2C1A0E', marginBottom:6 }}>{name}</div>
                  <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:22, color:'#C4703A', marginBottom:8 }}>
                    KSh {Number(price).toLocaleString()}
                  </div>
                  {description && (
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#8C6A50', lineHeight:1.6, marginBottom:10 }}>{description}</div>
                  )}
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <div style={{ background:'#EEF5EE', border:'1px solid #C8DFC8', borderRadius:8, padding:'4px 12px', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, color:'#2E7D32' }}>
                      📦 {parseInt(stock||'0')} in stock
                    </div>
                    {totalImgs > 0 && (
                      <div style={{ background:'#EDF5FB', border:'1px solid #BAD9EF', borderRadius:8, padding:'4px 12px', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, color:'#2B7AB5' }}>
                        🖼 {totalImgs} photo{totalImgs!==1?'s':''}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary list */}
              <div style={{ background:'#FBF6F0', borderRadius:14, padding:'14px 18px', marginBottom:22, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Name',        value: name },
                  { label:'Price',       value: `KSh ${Number(price).toLocaleString()}` },
                  { label:'Stock',       value: `${parseInt(stock||'0')} units` },
                  { label:'Category',    value: category || '—' },
                  { label:'Description', value: description ? `${description.slice(0,60)}${description.length>60?'…':''}` : '—' },
                  { label:'Photos',      value: `${totalImgs} image${totalImgs!==1?'s':''}` },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12 }}>
                    <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700, color:'#9C7A60', textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
                      {row.label}
                    </span>
                    <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#2C1A0E', textAlign:'right' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:10, padding:'12px 16px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#C0392B', marginBottom:16 }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setStep(2)} style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:12, padding:'13px 20px', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14, color:'#8C6A50', cursor:'pointer' }}>
                  ← Edit Details
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex:1, borderRadius:12, border:'none', padding:'15px',
                    fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:15,
                    background: saving ? '#EDE3D9' : 'linear-gradient(135deg,#C4703A,#E8944A)',
                    color: saving ? '#BEA898' : '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 4px 16px rgba(196,112,58,0.35)',
                    transition:'all 0.2s',
                  }}>
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

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tab,      setTab]      = useState<'overview'|'products'|'orders'>('overview');
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const [toast,     setToast]     = useState('');
  const [toastType, setToastType] = useState<'ok'|'err'>('ok');

  const [showWizard,   setShowWizard]   = useState(false);
  const [editProduct,  setEditProduct]  = useState<Product|null>(null);

  // inline stock
  const [editingStock, setEditingStock] = useState<number|null>(null);
  const [stockVal,     setStockVal]     = useState('');

  // order modal
  const [editOrder,   setEditOrder]   = useState<Order|null>(null);
  const [orderForm,   setOrderForm]   = useState({ status:'', tracking_status:'' });
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, p, o] = await Promise.all([
        axios.get('/api/admin/stats',  authH()),
        axios.get('/api/products',     authH()),
        axios.get('/api/admin/orders', authH()),
      ]);
      setStats(s.data);
      setProducts(p.data.map((pr: any) => ({
        ...pr,
        images:   Array.isArray(pr.images)   ? pr.images   : JSON.parse(pr.images   || '[]'),
        features: Array.isArray(pr.features) ? pr.features : JSON.parse(pr.features || '[]'),
      })));
      setOrders(o.data);
    } catch {
      showToast('Failed to load dashboard', 'err');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3200);
  };

  const handleWizardSaved = () => {
    setShowWizard(false);
    setEditProduct(null);
    showToast(editProduct ? '✓ Product updated!' : '✓ Product published to store!');
    fetchAll();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/products/${id}`, authH());
      showToast('Product deleted');
      fetchAll();
    } catch {
      showToast('Delete failed', 'err');
    }
  };

  const saveStock = async (id: number) => {
    const v = parseInt(stockVal);
    if (isNaN(v) || v < 0) { showToast('Enter a valid stock number', 'err'); return; }
    try {
      await axios.patch(`/api/admin/products/${id}/stock`, { stock: v }, authH());
      showToast('Stock updated!');
      setEditingStock(null);
      fetchAll();
    } catch {
      showToast('Stock update failed', 'err');
    }
  };

  const saveOrderStatus = async () => {
    if (!editOrder) return;
    setSavingOrder(true);
    try {
      await axios.patch(`/api/admin/orders/${editOrder.id}/status`, orderForm, authH());
      showToast('Order status updated!');
      setEditOrder(null);
      fetchAll();
    } catch {
      showToast('Update failed', 'err');
    } finally { setSavingOrder(false); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:'100vh', background:'#FBF6F0', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .tbtn { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:11px 16px; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:9px; width:100%; text-align:left; }
        .tbtn.on  { background:linear-gradient(135deg,#C4703A,#E8944A); color:#fff; box-shadow:0 4px 12px rgba(196,112,58,0.3); }
        .tbtn.off { background:transparent; color:#8C6A50; }
        .tbtn.off:hover { background:#F5EDE3; color:#2C1A0E; }
        .btn { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; border-radius:10px; border:none; cursor:pointer; padding:9px 18px; transition:filter 0.15s,transform 0.1s; display:inline-flex; align-items:center; gap:6px; }
        .btn:hover:not(:disabled) { filter:brightness(0.9); transform:translateY(-1px); }
        .btn:disabled { opacity:0.6; cursor:not-allowed; }
        .row { display:flex; align-items:center; gap:14px; background:#fff; border:1px solid #EDE3D9; border-radius:16px; padding:14px 18px; transition:box-shadow 0.2s; }
        .row:hover { box-shadow:0 4px 16px rgba(44,26,14,0.09); }
        .kpi { background:#fff; border:1px solid #EDE3D9; border-radius:18px; padding:22px 24px; box-shadow:0 2px 12px rgba(44,26,14,0.05); transition:transform 0.2s,box-shadow 0.2s; }
        .kpi:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(44,26,14,0.09); }
        .panel { background:#fff; border:1px solid #EDE3D9; border-radius:18px; padding:22px; }
        .overlay2 { position:fixed; inset:0; background:rgba(44,26,14,0.5); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); }
        .modal2 { background:#fff; border-radius:24px; padding:36px; width:100%; max-width:460px; max-height:90vh; overflow-y:auto; box-shadow:0 32px 80px rgba(44,26,14,0.22); }
        .track-opt { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:10px; cursor:pointer; transition:background 0.15s; font-family:'DM Sans',sans-serif; font-size:13px; }
        .track-opt:hover { background:#FBF6F0; }
        .track-opt.cur { background:#FDF0E6; color:#C4703A; font-weight:700; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wizardIn { from{opacity:0;transform:scale(0.94) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .fade-up  { animation:fadeUp 0.35s ease both; }
        .slide-in { animation:slideIn 0.28s ease both; }
        .spinner  { width:36px; height:36px; border:3px solid #EDE3D9; border-top-color:#C4703A; border-radius:50%; animation:spin 0.8s linear infinite; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#E8D8C8; border-radius:6px; }
        .sel2 { background:#FBF6F0; border:1.5px solid #EDE3D9; border-radius:10px; padding:11px 14px; font-family:'DM Sans',sans-serif; font-size:14px; color:#2C1A0E; width:100%; outline:none; cursor:pointer; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="slide-in" style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          background: toastType==='ok' ? '#2C1A0E' : '#C0392B',
          color:'#fff', fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:14,
          borderRadius:14, padding:'13px 28px', zIndex:999,
          boxShadow:'0 8px 28px rgba(44,26,14,0.3)', whiteSpace:'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Wizard */}
      {(showWizard || editProduct) && (
        <AddProductWizard
          onClose={() => { setShowWizard(false); setEditProduct(null); }}
          onSaved={handleWizardSaved}
          editProduct={editProduct}
        />
      )}

      <div style={{ display:'flex', minHeight:'100vh' }}>

        {/* ── SIDEBAR ─────────────────────────────── */}
        <aside style={{ width:230, background:'#fff', borderRight:'1px solid #EDE3D9', padding:'26px 14px', display:'flex', flexDirection:'column', gap:4, position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:30, paddingLeft:4 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#2C1A0E,#C4703A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#fff', fontWeight:800 }}>A</div>
            <div>
              <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:15, color:'#2C1A0E' }}>A&I Admin</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#9C7A60' }}>Control Panel</div>
            </div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
            {([
              { id:'overview', icon:'📊', label:'Overview',  badge: null },
              { id:'products', icon:'📦', label:'Products',  badge: products.length || null },
              { id:'orders',   icon:'🧾', label:'Orders',    badge: stats?.activeOrders || null },
            ] as const).map(t => (
              <button key={t.id} className={`tbtn ${tab===t.id?'on':'off'}`} onClick={() => setTab(t.id)}>
                <span>{t.icon}</span>
                <span style={{ flex:1 }}>{t.label}</span>
                {t.badge !== null && (
                  <span style={{ background: tab===t.id?'rgba(255,255,255,0.3)':'#C4703A', color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:10, fontWeight:800 }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ borderTop:'1px solid #EDE3D9', paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            <button className="btn" style={{ background:'transparent', border:'1px solid #EDE3D9', color:'#9C7A60', width:'100%', justifyContent:'center', padding:'10px' }} onClick={fetchAll}>🔄 Refresh</button>
            <button className="btn" style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', color:'#5C3D1E', width:'100%', justifyContent:'center', padding:'10px' }} onClick={() => navigate('/')}>← Back to Store</button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────── */}
        <main style={{ flex:1, padding:'36px 36px 60px', overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:18 }}>
              <div className="spinner" />
              <p style={{ fontFamily:'DM Sans,sans-serif', color:'#9C7A60', fontSize:14 }}>Loading dashboard…</p>
            </div>
          ) : (<>

          {/* ══ OVERVIEW ══ */}
          {tab==='overview' && stats && (
            <div className="fade-up">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
                <div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Dashboard</div>
                  <h1 style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:28, color:'#2C1A0E' }}>Overview</h1>
                </div>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#9C7A60', background:'#fff', border:'1px solid #EDE3D9', borderRadius:10, padding:'8px 14px' }}>
                  📅 {new Date().toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:26 }}>
                {[
                  { label:'Total Revenue', value:`KSh ${stats.totalRevenue.toLocaleString()}`, icon:'💰', col:'#C4703A', bg:'#FDF0E6', border:'#F5D5B8', sub:'Confirmed orders' },
                  { label:'Active Orders', value:stats.activeOrders, icon:'⏳', col:'#E8944A', bg:'#FEF9EF', border:'#FBDFA0', sub:'Awaiting delivery' },
                  { label:'Total Orders',  value:stats.totalOrders,  icon:'🧾', col:'#5A8A5A', bg:'#EEF5EE', border:'#C8DFC8', sub:'All time' },
                  { label:'Products',      value:stats.totalProducts,icon:'📦', col:'#7B5EA7', bg:'#F3EEF9', border:'#D8C8F0', sub:'In catalogue' },
                  { label:'Customers',     value:stats.totalUsers,   icon:'👥', col:'#3A7DB5', bg:'#EDF5FB', border:'#BAD9EF', sub:'Registered' },
                ].map(k => (
                  <div key={k.label} className="kpi" style={{ background:k.bg, border:`1px solid ${k.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:28 }}>{k.icon}</span>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:k.col, marginTop:4 }} />
                    </div>
                    <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:21, color:k.col, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:13, color:'#2C1A0E' }}>{k.label}</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#9C7A60', marginTop:2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginBottom:20 }}>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#2C1A0E' }}>📈 Revenue — Last 7 Days</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60' }}>KSh {stats.revenueByDay.reduce((s,d)=>s+parseFloat(d.revenue),0).toLocaleString()}</div>
                  </div>
                  <RevenueChart data={stats.revenueByDay} />
                </div>
                <div className="panel">
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#2C1A0E', marginBottom:16 }}>📊 Orders by Status</div>
                  {stats.ordersByStatus.length===0
                    ? <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#BEA898', textAlign:'center', padding:'20px 0' }}>No orders yet</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {stats.ordersByStatus.map(r => { const sc=SC[r.status]||SC.pending; return (
                          <div key={r.status} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 13px', background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:10 }}>
                            <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:600, color:sc.col, textTransform:'capitalize' }}>{r.status}</span>
                            <span style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:16, color:sc.col }}>{r.count}</span>
                          </div>
                        );})}
                      </div>
                  }
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#2C1A0E' }}>🧾 Recent Orders</div>
                    <button className="btn" style={{ background:'#FBF6F0', color:'#C4703A', border:'1px solid #EDE3D9', fontSize:12, padding:'5px 12px' }} onClick={()=>setTab('orders')}>View All →</button>
                  </div>
                  {stats.recentOrders.length===0
                    ? <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#BEA898', textAlign:'center', padding:'20px 0' }}>No orders yet</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {stats.recentOrders.map(o => { const sc=SC[o.status]||SC.pending; return (
                          <div key={o.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 13px', background:'#FBF6F0', borderRadius:12, border:'1px solid #EDE3D9' }}>
                            <div>
                              <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13, color:'#2C1A0E' }}>{o.customer_name||'Customer'} <span style={{ color:'#BEA898', fontWeight:400 }}>#{o.id}</span></div>
                              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#9C7A60', marginTop:2 }}>{new Date(o.created_at).toLocaleDateString('en-KE')}</div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:14, color:'#C4703A' }}>KSh {Number(o.total).toLocaleString()}</span>
                              <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:sc.bg, color:sc.col, border:`1px solid ${sc.border}`, textTransform:'capitalize' }}>{o.status}</span>
                            </div>
                          </div>
                        );})}
                      </div>
                  }
                </div>
                <div className="panel">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#2C1A0E' }}>⚠️ Low Stock Alerts</div>
                    <button className="btn" style={{ background:'#FBF6F0', color:'#C4703A', border:'1px solid #EDE3D9', fontSize:12, padding:'5px 12px' }} onClick={()=>setTab('products')}>Manage →</button>
                  </div>
                  {stats.lowStock.length===0
                    ? <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#5A8A5A', textAlign:'center', padding:'20px 0' }}>✓ All products well stocked</p>
                    : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {stats.lowStock.map(p => (
                          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:p.stock===0?'#FDF0EE':'#FDF8EC', borderRadius:12, border:`1px solid ${p.stock===0?'#F5C6C0':'#F6E4A0'}` }}>
                            <img src={p.image_url||'https://placehold.co/40x40/F5EDE3/9C7A60?text=📦'} style={{ width:40,height:40,borderRadius:10,objectFit:'cover',flexShrink:0 }} onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/40x40/F5EDE3/9C7A60?text=📦';}} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:13, color:'#2C1A0E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:p.stock===0?'#C0392B':'#B7791F' }}>{p.stock===0?'❌ Out of stock':`⚠️ Only ${p.stock} left`}</div>
                            </div>
                            <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:14, color:'#C4703A', flexShrink:0 }}>KSh {Number(p.price).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ PRODUCTS ══ */}
          {tab==='products' && (
            <div className="fade-up">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:26 }}>
                <div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Catalogue</div>
                  <h1 style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:28, color:'#2C1A0E' }}>Products ({products.length})</h1>
                </div>
                <button className="btn"
                  style={{ background:'linear-gradient(135deg,#C4703A,#E8944A)', color:'#fff', padding:'12px 24px', fontSize:14, borderRadius:14, boxShadow:'0 4px 14px rgba(196,112,58,0.3)' }}
                  onClick={() => { setEditProduct(null); setShowWizard(true); }}>
                  + Add Product
                </button>
              </div>

              <div style={{ display:'flex', alignItems:'center', background:'#fff', border:'1px solid #EDE3D9', borderRadius:12, padding:'10px 16px', gap:10, marginBottom:18 }}>
                <span style={{ opacity:0.4, fontSize:16 }}>🔍</span>
                <input style={{ border:'none', background:'transparent', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#2C1A0E', flex:1 }}
                  placeholder="Search by name or category…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9C7A60', fontSize:16 }}>✕</button>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filtered.length===0 && (
                  <div style={{ textAlign:'center', padding:'70px 0', color:'#9C7A60', fontFamily:'DM Sans,sans-serif' }}>
                    {search ? `No products match "${search}"` : (
                      <div>
                        <div style={{ fontSize:52, marginBottom:14 }}>📦</div>
                        <div style={{ fontWeight:600, fontSize:15, marginBottom:8 }}>No products yet</div>
                        <div style={{ fontSize:13, color:'#BEA898', marginBottom:20 }}>Add your first product to start selling</div>
                        <button className="btn"
                          style={{ background:'linear-gradient(135deg,#C4703A,#E8944A)', color:'#fff', padding:'12px 28px', fontSize:14, borderRadius:14, margin:'0 auto' }}
                          onClick={()=>setShowWizard(true)}>
                          + Add Your First Product
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {filtered.map(p => {
                  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
                  return (
                    <div key={p.id} className="row">
                      <img src={imgs[0]||'https://placehold.co/64x64/F5EDE3/9C7A60?text=📦'} alt={p.name}
                        style={{ width:64, height:64, borderRadius:14, objectFit:'cover', flexShrink:0, border:'1px solid #EDE3D9' }}
                        onError={e=>{(e.target as HTMLImageElement).src='https://placehold.co/64x64/F5EDE3/9C7A60?text=📦';}} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'Lora,serif', fontWeight:600, fontSize:15, color:'#2C1A0E', marginBottom:3 }}>{p.name}</div>
                        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60', display:'flex', gap:10, flexWrap:'wrap' }}>
                          {p.category && <span>🏷 {p.category}</span>}
                          <span>🖼 {imgs.length} photo{imgs.length!==1?'s':''}</span>
                        </div>
                        {p.description && (
                          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#BEA898', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:340 }}>{p.description}</div>
                        )}
                      </div>

                      {/* Inline stock */}
                      <div style={{ flexShrink:0 }}>
                        {editingStock===p.id ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <input type="number" value={stockVal} onChange={e=>setStockVal(e.target.value)}
                              onKeyDown={e=>{if(e.key==='Enter')saveStock(p.id);if(e.key==='Escape')setEditingStock(null);}}
                              autoFocus
                              style={{ width:66, textAlign:'center', background:'#FBF6F0', border:'2px solid #C4703A', borderRadius:8, padding:'6px 8px', fontFamily:'DM Sans,sans-serif', fontSize:14, color:'#2C1A0E', outline:'none' }} />
                            <button className="btn" style={{ background:'#5A8A5A', color:'#fff', padding:'6px 10px', fontSize:13 }} onClick={()=>saveStock(p.id)}>✓</button>
                            <button className="btn" style={{ background:'#FBF6F0', color:'#9C7A60', border:'1px solid #EDE3D9', padding:'6px 10px', fontSize:13 }} onClick={()=>setEditingStock(null)}>✕</button>
                          </div>
                        ) : (
                          <div title="Click to edit stock" onClick={()=>{setEditingStock(p.id);setStockVal(String(p.stock??0));}}
                            style={{ cursor:'pointer', padding:'6px 14px', borderRadius:10, background:p.stock===0?'#FDF0EE':p.stock<=5?'#FDF8EC':'#EEF5EE', border:`1px solid ${p.stock===0?'#F5C6C0':p.stock<=5?'#F6E4A0':'#C8DFC8'}` }}>
                            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, color:'#9C7A60', marginBottom:2 }}>STOCK</div>
                            <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:18, color:p.stock===0?'#C0392B':p.stock<=5?'#B7791F':'#2E7D32' }}>{p.stock??0}</div>
                          </div>
                        )}
                      </div>

                      <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:17, color:'#C4703A', flexShrink:0, minWidth:110, textAlign:'right' }}>
                        KSh {Number(p.price).toLocaleString()}
                      </div>

                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button className="btn" style={{ background:'#FBF6F0', color:'#5C3D1E', border:'1px solid #EDE3D9' }} onClick={()=>setEditProduct(p)}>✏️ Edit</button>
                        <button className="btn" style={{ background:'#FDF0EE', color:'#C0392B', border:'1px solid #F5C6C0', padding:'9px 12px' }} onClick={()=>handleDelete(p.id,p.name)}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {tab==='orders' && (
            <div className="fade-up">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:26 }}>
                <div>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Sales</div>
                  <h1 style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:28, color:'#2C1A0E' }}>Orders ({orders.length})</h1>
                </div>
                {stats&&stats.activeOrders>0 && (
                  <div style={{ background:'#FDF0E6', border:'1px solid #F5D5B8', borderRadius:12, padding:'10px 18px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#C4703A', fontWeight:700 }}>
                    ⏳ {stats.activeOrders} active order{stats.activeOrders!==1?'s':''} need attention
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {orders.length===0 && (
                  <div style={{ textAlign:'center', padding:'60px 0', color:'#9C7A60', fontFamily:'DM Sans,sans-serif', fontSize:15 }}>No orders yet.</div>
                )}
                {orders.map(o => {
                  const sc=SC[o.status]||SC.pending;
                  return (
                    <div key={o.id} style={{ background:'#fff', border:'1px solid #EDE3D9', borderRadius:18, padding:'18px 22px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                            <span style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:17, color:'#2C1A0E' }}>Order #{o.id}</span>
                            <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:20, background:sc.bg, color:sc.col, border:`1px solid ${sc.border}`, textTransform:'capitalize' }}>{o.status}</span>
                            <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#9C7A60', background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:20, padding:'3px 10px' }}>🚚 {o.tracking_status}</span>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:5 }}>
                            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'#5C3D1E' }}>👤 <strong>{o.customer_name||'Unknown'}</strong></div>
                            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60' }}>✉️ {o.customer_email||'—'}</div>
                            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60' }}>📱 {o.mpesa_phone||'—'}</div>
                            {o.mpesa_receipt && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60' }}>🧾 <strong style={{ color:'#5A8A5A' }}>{o.mpesa_receipt}</strong></div>}
                            <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:'#BEA898' }}>🕐 {new Date(o.created_at).toLocaleString('en-KE')}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
                          <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:22, color:'#C4703A' }}>KSh {Number(o.total).toLocaleString()}</div>
                          <button className="btn" style={{ background:'linear-gradient(135deg,#C4703A,#E8944A)', color:'#fff', padding:'10px 18px' }}
                            onClick={()=>{ setEditOrder(o); setOrderForm({status:o.status,tracking_status:o.tracking_status}); }}>
                            ✏️ Update Status
                          </button>
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

      {/* ── ORDER STATUS MODAL ───────────────────────────── */}
      {editOrder && (
        <div className="overlay2" onClick={e=>{if(e.target===e.currentTarget)setEditOrder(null);}}>
          <div className="modal2" style={{ animation:'fadeUp 0.3s ease both' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
              <div>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#C4703A', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>Order #{editOrder.id}</div>
                <h2 style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:20, color:'#2C1A0E' }}>Update Status</h2>
              </div>
              <button onClick={()=>setEditOrder(null)} style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:16, color:'#9C7A60', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ background:'#FBF6F0', border:'1px solid #EDE3D9', borderRadius:14, padding:'13px 16px', marginBottom:20 }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontWeight:700, fontSize:14, color:'#2C1A0E' }}>{editOrder.customer_name||'Customer'}</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60', marginTop:3 }}>{editOrder.customer_email}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#9C7A60' }}>📱 {editOrder.mpesa_phone||'—'}</div>
                <div style={{ fontFamily:'Lora,serif', fontWeight:700, fontSize:15, color:'#C4703A' }}>KSh {Number(editOrder.total).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#8C6A50', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>Order Status</div>
              <select className="sel2" value={orderForm.status} onChange={e=>setOrderForm({...orderForm,status:e.target.value})}>
                {ORDER_STATUSES.map(st=><option key={st} value={st}>{st.charAt(0).toUpperCase()+st.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, color:'#8C6A50', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>Tracking Step</div>
              <div style={{ background:'#FBF6F0', borderRadius:14, padding:10, border:'1px solid #EDE3D9', display:'flex', flexDirection:'column', gap:3 }}>
                {TRACKING_STEPS.map((step,i) => (
                  <div key={step} className={`track-opt ${orderForm.tracking_status===step?'cur':''}`}
                    onClick={()=>setOrderForm({...orderForm,tracking_status:step})}>
                    <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, border:`2px solid ${orderForm.tracking_status===step?'#C4703A':'#EDE3D9'}`, background:orderForm.tracking_status===step?'#C4703A':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:orderForm.tracking_status===step?'#fff':'#9C7A60', fontFamily:'DM Sans,sans-serif' }}>{i+1}</div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn" style={{ flex:1, background:'linear-gradient(135deg,#C4703A,#E8944A)', color:'#fff', padding:'14px', fontSize:14, justifyContent:'center', borderRadius:12 }}
                onClick={saveOrderStatus} disabled={savingOrder}>
                {savingOrder?'⏳ Saving…':'✓ Save Changes'}
              </button>
              <button className="btn" style={{ background:'#FBF6F0', color:'#8C6A50', border:'1px solid #EDE3D9', padding:'14px 20px', borderRadius:12 }} onClick={()=>setEditOrder(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display:'block', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700,
  color:'#8C6A50', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8,
};
const inpStyle: React.CSSProperties = {
  background:'#FBF6F0', border:'1.5px solid #EDE3D9', borderRadius:12,
  padding:'12px 14px', fontFamily:'DM Sans,sans-serif', fontSize:14,
  color:'#2C1A0E', width:'100%', outline:'none', transition:'border-color 0.2s',
};