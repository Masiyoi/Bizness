import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar       from '../components/common/Navbar';
import Footer       from '../components/common/Footer';


interface Product {
  id: number; name: string; price: string; description: string;
  features: string[]; category: string; stock: number;
  images: string[]; image_url: string;
  colors: string[];
  sizes: string[];
}

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  full_name: string;
}

interface ReviewStats {
  total: number;
  average: number;
  five: number; four: number; three: number; two: number; one: number;
}


const T = {
  navy:'#0D1B3E', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0', muted:'#7A7A8A',
};

function isLightColor(color: string): boolean {
  const lightNames = ['white','ivory','cream','beige','yellow','snow','linen',
    'wheat','lightyellow','lightgray','lightgrey','silver','lavender','mintcream'];
  const lower = color.toLowerCase().replace(/\s+/g,'');
  if (lightNames.includes(lower)) return true;
  const hex = lower.startsWith('#') ? lower.slice(1) : null;
  if (hex && hex.length === 6) {
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return (r*0.299 + g*0.587 + b*0.114) > 186;
  }
  return false;
}

// ── Stars component ──────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:size, color: i <= Math.round(rating) ? T.gold : T.creamDeep, lineHeight:1 }}>
          {i <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ── Reviews accordion ────────────────────────────────────────────
function ReviewsSection({ productId }: { productId: number }) {
  const [open,    setOpen]    = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats,   setStats]   = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    axios.get(`/api/reviews/product/${productId}`)
      .then(res => {
        setReviews(res.data.reviews);
        setStats(res.data.stats);
        setFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, productId, fetched]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });

  const statRows: { label: string; key: keyof ReviewStats }[] = [
    { label:'5★', key:'five'  },
    { label:'4★', key:'four'  },
    { label:'3★', key:'three' },
    { label:'2★', key:'two'   },
    { label:'1★', key:'one'   },
  ];

  return (
    <div style={{ marginTop:40, fontFamily:"'Jost','DM Sans',sans-serif" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', background:T.navy, border:'none',
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding:'16px 22px', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
          transition:'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = T.navyLight)}
        onMouseLeave={e => (e.currentTarget.style.background = T.navy)}
      >
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' as const }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase' as const, color:T.gold }}>
            Reviews
          </span>
          {stats ? (
            <>
              <span style={{ background:'rgba(200,169,81,0.15)', border:'1px solid rgba(200,169,81,0.3)', color:T.gold, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                {stats.total} review{stats.total !== 1 ? 's' : ''}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:18, fontWeight:700, color:T.cream, fontFamily:"'Playfair Display',serif" }}>
                  {Number(stats.average).toFixed(1)}
                </span>
                <Stars rating={stats.average ?? 0} size={13}/>
              </div>
            </>
          ) : (
            <span style={{ background:'rgba(200,169,81,0.15)', border:'1px solid rgba(200,169,81,0.3)', color:T.gold, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
              {loading ? 'Loading…' : 'See all reviews'}
            </span>
          )}
        </div>
        <span style={{
          color:'rgba(200,169,81,0.6)', fontSize:11,
          transition:'transform 0.25s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display:'inline-block',
        }}>▼</span>
      </button>

      <div style={{ overflow:'hidden', maxHeight: open ? 3000 : 0, transition:'max-height 0.4s ease' }}>
        <div style={{
          background:T.cream, border:`1px solid ${T.creamDeep}`,
          borderTop:'none', borderRadius:'0 0 10px 10px', padding:'22px 22px 20px',
        }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.muted, fontSize:13, fontFamily:"'Jost',sans-serif" }}>
              Loading reviews…
            </div>
          )}
          {!loading && fetched && (
            <>
              {stats && stats.total > 0 && (
                <div style={{ marginBottom:4 }}>
                  {statRows.map(({ label, key }) => {
                    const count = stats[key] as number;
                    const pct   = stats.total ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:T.muted, width:24, textAlign:'right' as const, fontFamily:"'Jost',sans-serif" }}>{label}</span>
                        <div style={{ flex:1, height:6, background:T.creamDeep, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:T.gold, borderRadius:3, transition:'width 0.5s ease' }}/>
                        </div>
                        <span style={{ fontSize:11, color:T.muted, width:18, fontFamily:"'Jost',sans-serif" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(200,169,81,0.25),transparent)`, margin:'18px 0' }}/>
              {reviews.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', fontSize:13, color:T.muted, fontFamily:"'Jost',sans-serif" }}>
                  No reviews yet — be the first after your purchase!
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column' as const, gap:12 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background:'#fff', border:`1px solid ${T.creamDeep}`, borderRadius:10, padding:'16px 18px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.navy, fontFamily:"'Jost',sans-serif" }}>{r.full_name}</div>
                          <div style={{ fontSize:11, color:T.muted, marginTop:2, fontFamily:"'Jost',sans-serif" }}>{fmtDate(r.created_at)}</div>
                        </div>
                        <Stars rating={r.rating} size={14}/>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize:13, color:`rgba(13,27,62,0.75)`, lineHeight:1.75, margin:0, fontFamily:"'Jost',sans-serif" }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product,       setProduct]       = useState<Product | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [activeImg,     setActiveImg]     = useState(0);
  const [qty,           setQty]           = useState(1);
  const [inCart,        setInCart]        = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [toast,         setToast]         = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [colorError,    setColorError]    = useState(false);
  const [selectedSize,  setSelectedSize]  = useState<string>('');
  const [sizeError,     setSizeError]     = useState(false);

  // ── Shared state mirrored from Homepage ─────────────────────────
  const [cartCount,     setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // ── Fetch cart count ──────────────────────────────────────────
const fetchCartCount = useCallback(() => {
  axios.get('/api/cart')
      .then(res => {
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      })
      .catch(() => {});
  }, []);

  // ── Fetch wishlist count ──────────────────────────────────────
const fetchWishlistCount = useCallback(() => {
  axios.get('/api/wishlist')
      .then(res => setWishlistCount(res.data.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
    // Keep counts fresh when tab regains focus
    window.addEventListener('focus', fetchCartCount);
    window.addEventListener('focus', fetchWishlistCount);
    return () => {
      window.removeEventListener('focus', fetchCartCount);
      window.removeEventListener('focus', fetchWishlistCount);
    };
  }, [fetchCartCount, fetchWishlistCount]);

  // Keep counts in sync when cart is updated from this page
  useEffect(() => {
    const handler = () => { fetchCartCount(); fetchWishlistCount(); };
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, [fetchCartCount, fetchWishlistCount]);

  // ── Fetch product ─────────────────────────────────────────────
  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(res => {
        const p = res.data;
        if (!p.images || p.images.length === 0) p.images = p.image_url ? [p.image_url] : [];
        if (typeof p.images   === 'string') p.images   = JSON.parse(p.images);
        if (typeof p.features === 'string') p.features = JSON.parse(p.features || '[]');
        if (typeof p.colors   === 'string') p.colors   = JSON.parse(p.colors   || '[]');
        if (!Array.isArray(p.colors))       p.colors   = [];
        if (typeof p.sizes    === 'string') p.sizes    = JSON.parse(p.sizes    || '[]');
        if (!Array.isArray(p.sizes))        p.sizes    = [];
        setProduct(p);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate('/'); });
  }, [id]);

  // ── Check if already in cart ──────────────────────────────────
useEffect(() => {
  if (!id) return;
  axios.get('/api/cart')
      .then(res => {
        const cartItem = res.data.find((i: any) => i.product_id === Number(id));
        if (cartItem) {
          setInCart(true);
          if (cartItem.selected_color) setSelectedColor(cartItem.selected_color);
          if (cartItem.selected_size)  setSelectedSize(cartItem.selected_size);
        } else {
          setInCart(false);
        }
      })
      .catch(() => {});
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const handleCartToggle = async () => {
    if (!inCart && product?.colors?.length && !selectedColor) {
      setColorError(true);
      setTimeout(() => setColorError(false), 600);
      showToast('Please select a colour first.');
      return;
    }
    if (!inCart && product?.sizes?.length && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 600);
      showToast('Please select a size first.');
      return;
    }
    setAdding(true);
    try {
      if (inCart) {
        const cartRes = await axios.get('/api/cart');
        const cartItem = cartRes.data.find((i: any) => i.product_id === product!.id);
        if (cartItem) await axios.delete(`/api/cart/${cartItem.id}`);
        setInCart(false);
        setSelectedColor('');
        setSelectedSize('');
        showToast('Removed from cart.');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        await axios.post('/api/cart', {
          product_id:     product!.id,
          quantity:       1,
          selected_color: selectedColor || null,
          selected_size:  selectedSize  || null,
        });
        setInCart(true);
        showToast('Added to cart!');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch { showToast('Could not update cart.'); }
    finally { setAdding(false); }
  };

  const handleColorChange = async (color: string) => {
    setSelectedColor(color);
    setColorError(false);
    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity: cartItem.quantity,
          selected_color: color,
          selected_size: selectedSize || cartItem.selected_size,
        });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        showToast(`Colour updated to ${color}`);
      }
    } catch {}
  };

  const handleSizeChange = async (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity: cartItem.quantity,
          selected_color: selectedColor || cartItem.selected_color,
          selected_size: size,
        });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        showToast(`Size updated to ${size}`);
      }
    } catch {}
  };

  const handleLogout = () => {
    setCartCount(0);
    setWishlistCount(0);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.navy, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:38, height:38, border:`3px solid rgba(200,169,81,0.2)`, borderTopColor:T.gold, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:`rgba(200,169,81,0.6)`, fontFamily:"'Jost',sans-serif", fontSize:13, letterSpacing:'1px', marginTop:16, textTransform:'uppercase' }}>Loading…</p>
    </div>
  );

  if (!product) return null;

  const images    = product.images.length ? product.images : [`https://placehold.co/600x600/F0EAD8/0D1B3E?text=Luku+Prime`];
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes  = Array.isArray(product.sizes)  && product.sizes.length  > 0;

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">
      <style>{css}</style>

      {toast && <div className="lp-toast">{toast}</div>}

      {/* ── Shared Navbar (same as Homepage) ── */}
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
      />

      <div className="lp-fade" style={{ maxWidth:1100, margin:'0 auto', padding:'clamp(20px,4vw,48px) clamp(16px,5%,5%) 80px' }}>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'clamp(18px,3vw,32px)', flexWrap:'wrap' as const }}>
          <button className="lp-back" onClick={() => navigate(-1)}>← Back</button>
          <span style={{ color:T.creamDeep }}>·</span>
          <button className="lp-back" style={{ color:T.muted }} onClick={() => navigate('/')}>Home</button>
          <span style={{ color:T.creamDeep }}>·</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>{product.category || 'Product'}</span>
          <span style={{ color:T.creamDeep }}>·</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.navy, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'clamp(100px,30vw,220px)' }}>{product.name}</span>
        </div>

        <div className="lp-grid">

          {/* ── Gallery ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#fff', border:`1px solid ${T.creamDeep}`, aspectRatio:'1', boxShadow:`0 16px 48px rgba(13,27,62,0.12)` }}>
              <img
                src={images[activeImg]} alt={product.name}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { (e.target as HTMLImageElement).src=`https://placehold.co/600x600/F0EAD8/0D1B3E?text=LP`; }}
              />
              <div style={{ position:'absolute', top:12, right:12, width:44, height:44, border:`1px solid rgba(200,169,81,0.3)`, borderRadius:4, pointerEvents:'none' }}/>
              {product.stock <= 5 && product.stock > 0 && (
                <div style={{ position:'absolute', top:12, left:12, background:T.gold, color:T.navy, fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:800, borderRadius:3, padding:'4px 10px', letterSpacing:'1.5px', textTransform:'uppercase' as const }}>
                  Only {product.stock} left
                </div>
              )}
              {product.stock === 0 && (
                <div style={{ position:'absolute', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ background:'rgba(255,255,255,0.95)', color:T.navy, fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:10, padding:'7px 18px', borderRadius:3, letterSpacing:'2px', textTransform:'uppercase' as const }}>Sold Out</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                {images.map((img, i) => (
                  <div key={i} className={`lp-thumb ${i===activeImg?'active':''}`}
                    onClick={() => setActiveImg(i)}
                    style={{ width:64, height:64, flexShrink:0, background:'#fff', border:`1px solid ${T.creamDeep}`, borderRadius:8, overflow:'hidden', cursor:'pointer' }}>
                    <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/64x64/F0EAD8/0D1B3E?text=LP'; }}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div>
            {product.category && (
              <div style={{ display:'inline-block', background:`rgba(200,169,81,0.1)`, border:`1px solid rgba(200,169,81,0.3)`, color:T.gold, borderRadius:3, padding:'3px 12px', fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'2.5px', textTransform:'uppercase' as const, marginBottom:12, width:'fit-content' }}>
                {product.category}
              </div>
            )}

            <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(22px,4vw,34px)', color:T.navy, lineHeight:1.15, marginBottom:14 }}>
              {product.name}
            </h1>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:24, height:1, background:T.gold }}/>
              <div style={{ width:4, height:4, background:T.gold, transform:'rotate(45deg)' }}/>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.gold}44,transparent)` }}/>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22, flexWrap:'wrap' as const }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(20px,3vw,30px)', color:T.navy }}>
                KSh {Number(product.price).toLocaleString()}
              </span>
              {product.stock > 0
                ? <span style={{ background:'#EEF3EE', border:'1px solid #C8DFC8', color:'#4A7A4A', borderRadius:3, padding:'4px 12px', fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase' as const }}>✓ In Stock</span>
                : <span style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', color:'#C0392B', borderRadius:3, padding:'4px 12px', fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase' as const }}>Sold Out</span>
              }
            </div>

            {product.description && (
              <div style={{ marginBottom:20 }}>
                <div style={s.lbl}>Description</div>
                <p style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:`rgba(13,27,62,0.75)`, lineHeight:1.8 }}>{product.description}</p>
              </div>
            )}

            {product.features?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={s.lbl}>Features</div>
                <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8 }}>
                  {product.features.map((f,i) => (
                    <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, background:`rgba(200,169,81,0.08)`, border:`1px solid rgba(200,169,81,0.22)`, borderRadius:20, padding:'6px 12px', fontFamily:"'Jost',sans-serif", fontSize:12, color:T.navy, fontWeight:500 }}>
                      <span style={{ color:T.gold }}>✦</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── COLOUR SELECTOR ── */}
            {hasColors && (
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={s.lbl}>Colour</div>
                  {selectedColor && (
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, color:T.navy }}>
                      {selectedColor}
                      {inCart && <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap' as const, gap:10, marginBottom:14 }}>
                  {product.colors.map((color, i) => {
                    const active = selectedColor === color;
                    const light  = isLightColor(color);
                    return (
                      <button key={i} title={color} onClick={() => handleColorChange(color)}
                        style={{
                          width:38, height:38, borderRadius:'50%', background:color,
                          border: active ? `3px solid ${T.gold}` : `2px solid ${light ? T.creamDeep : 'rgba(0,0,0,0.12)'}`,
                          boxShadow: active ? `0 0 0 2px #fff, 0 0 0 5px ${T.gold}` : `0 2px 6px rgba(0,0,0,0.15)`,
                          cursor:'pointer', transition:'all 0.18s', flexShrink:0,
                          position:'relative' as const, padding:0,
                        }}
                        aria-label={color} aria-pressed={active}
                      >
                        {active && (
                          <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color: light ? T.navy : '#fff' }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className={colorError ? 'lp-shake' : ''}>
                  <div style={{ position:'relative' as const }}>
                    {selectedColor && (
                      <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:14, height:14, borderRadius:'50%', background:selectedColor, border:`1.5px solid ${T.creamDeep}`, pointerEvents:'none', zIndex:1, boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
                    )}
                    <select value={selectedColor} onChange={e => handleColorChange(e.target.value)}
                      style={{
                        width:'100%', background:T.cream,
                        border:`1.5px solid ${colorError ? '#C0392B' : selectedColor ? T.gold : T.creamDeep}`,
                        borderRadius:10, padding:`11px 36px 11px ${selectedColor ? '36px' : '14px'}`,
                        fontFamily:"'Jost',sans-serif", fontSize:14,
                        color: selectedColor ? T.navy : T.muted,
                        outline:'none', cursor:'pointer',
                        appearance:'none' as const, WebkitAppearance:'none' as const, transition:'border-color 0.2s',
                      }}
                    >
                      <option value="">— Choose a colour —</option>
                      {product.colors.map((color, i) => <option key={i} value={color}>{color}</option>)}
                    </select>
                    <div style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:T.muted, lineHeight:1 }}>▼</div>
                  </div>
                  {colorError ? (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#C0392B', marginTop:6, fontWeight:700 }}>⚠ Please select a colour to continue</div>
                  ) : selectedColor ? (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#4A7A4A', marginTop:6, fontWeight:600 }}>✓ {selectedColor} selected{inCart ? ' · saved to cart' : ''}</div>
                  ) : (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:6 }}>{product.colors.length} colour{product.colors.length !== 1 ? 's' : ''} available — pick one above</div>
                  )}
                </div>
              </div>
            )}

            {/* ── SIZE SELECTOR ── */}
            {hasSizes && (
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div style={s.lbl}>Size</div>
                  {selectedSize && (
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, color:T.navy }}>
                      {selectedSize}
                      {inCart && <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>}
                    </span>
                  )}
                </div>
                <div className={sizeError ? 'lp-shake' : ''} style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  {product.sizes.map((size, i) => {
                    const active = selectedSize === size;
                    return (
                      <button key={i} onClick={() => handleSizeChange(size)}
                        style={{
                          minWidth:44, padding:'8px 14px', borderRadius:8,
                          border: active ? `2px solid ${T.gold}` : `1.5px solid ${T.creamDeep}`,
                          background: active ? `rgba(200,169,81,0.12)` : '#fff',
                          fontFamily:"'Jost',sans-serif", fontSize:13,
                          fontWeight: active ? 700 : 500,
                          color: active ? T.navy : T.muted,
                          cursor:'pointer', transition:'all 0.15s',
                          boxShadow: active ? `0 0 0 2px ${T.gold}33` : 'none',
                        }}
                      >{size}</button>
                    );
                  })}
                </div>
                {sizeError ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#C0392B', marginTop:4, fontWeight:700 }}>⚠ Please select a size to continue</div>
                ) : selectedSize ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#4A7A4A', marginTop:4, fontWeight:600 }}>✓ Size {selectedSize} selected{inCart ? ' · saved to cart' : ''}</div>
                ) : (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:4 }}>{product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''} available — pick one above</div>
                )}
              </div>
            )}

            {/* ── QUANTITY ── */}
            {product.stock > 0 && (
              <div style={{ marginBottom:22 }}>
                <div style={s.lbl}>Quantity</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <button className="lp-qty" onClick={() => setQty(q => Math.max(1,q-1))}>−</button>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.navy, minWidth:24, textAlign:'center' as const }}>{qty}</span>
                  <button className="lp-qty" onClick={() => setQty(q => Math.min(product.stock,q+1))}>+</button>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>{product.stock} available</span>
                </div>
              </div>
            )}

            {/* ── CART BUTTON ── */}
            <div style={{ display:'flex', flexDirection:'column' as const, gap:10, marginBottom:20 }}>
              {product.stock === 0 ? (
                <button className="lp-btn" style={{ background:T.creamDeep, color:T.muted }} disabled>Sold Out</button>
              ) : inCart ? (
                <>
                  <button className="lp-btn lp-btn-green" onClick={() => navigate('/cart')}>✓ In Cart — View Cart</button>
                  <button className="lp-btn lp-btn-outline" onClick={handleCartToggle} disabled={adding}>
                    {adding ? '⏳ Updating…' : '✕ Remove from Cart'}
                  </button>
                </>
              ) : (
                <button className="lp-btn"
                  style={{ background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, color:T.navy }}
                  onClick={handleCartToggle} disabled={adding}
                >
                  {adding ? '⏳ Adding…' : `Add to Cart — KSh ${(Number(product.price) * qty).toLocaleString()}`}
                </button>
              )}
            </div>

            <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(200,169,81,0.3),transparent)`, marginBottom:18 }}/>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8 }}>
              {['🔒 Secure Payment','📱 M-Pesa Ready','🚚 Fast Delivery','↩️ 30-Day Returns'].map(t => (
                <span key={t} style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, background:'#fff', border:`1px solid ${T.creamDeep}`, borderRadius:20, padding:'5px 11px' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── REVIEWS ACCORDION ── */}
        <ReviewsSection productId={product.id} />

      </div>

      {/* ── Shared Footer (same as Homepage) ── */}
      <Footer />
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  @keyframes fadeUp  {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn {from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)}}
  @keyframes spin    {to{transform:rotate(360deg)}}
  @keyframes shake   {0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}}

  .lp-fade{animation:fadeUp 0.45s ease forwards}
  .lp-shake{animation:shake 0.45s ease both}

  .lp-toast{
    position:fixed;top:18px;left:50%;transform:translateX(-50%);
    background:#0D1B3E;color:#DEC06A;
    font-family:'Jost',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;
    border-radius:8px;padding:12px 24px;z-index:9999;
    box-shadow:0 8px 28px rgba(13,27,62,0.3);border:1px solid rgba(200,169,81,0.25);
    animation:slideIn 0.3s ease forwards;max-width:calc(100vw - 32px);text-align:center
  }

  .lp-back{
    background:none;border:none;cursor:pointer;
    font-family:'Jost',sans-serif;font-size:10px;font-weight:700;
    color:rgba(200,169,81,0.7);display:flex;align-items:center;gap:5px;
    padding:0;transition:color 0.15s;letter-spacing:1px;text-transform:uppercase;white-space:nowrap
  }
  .lp-back:hover{color:#C8A951}

  .lp-thumb{border:2px solid transparent;transition:border-color 0.2s,transform 0.15s}
  .lp-thumb:hover{transform:scale(1.04)}
  .lp-thumb.active{border-color:#C8A951 !important}

  .lp-qty{
    background:rgba(200,169,81,0.08);border:1px solid rgba(200,169,81,0.25);
    border-radius:6px;width:36px;height:36px;font-size:18px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:background 0.15s;color:#0D1B3E;flex-shrink:0
  }
  .lp-qty:hover{background:rgba(200,169,81,0.18)}

  .lp-btn{
    border:none;border-radius:6px;padding:14px 16px;
    font-family:'Jost',sans-serif;font-size:11px;font-weight:700;
    letter-spacing:2px;text-transform:uppercase;cursor:pointer;
    transition:all 0.25s;width:100%
  }
  .lp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(200,169,81,0.3)}
  .lp-btn:disabled{opacity:0.6;cursor:not-allowed}
  .lp-btn-green{background:linear-gradient(135deg,#2E6B2E,#3E8A3E);color:#fff}
  .lp-btn-outline{
    background:transparent !important;
    border:1.5px solid rgba(200,169,81,0.4);color:#0D1B3E
  }
  .lp-btn-outline:hover:not(:disabled){
    border-color:#C8A951;background:rgba(200,169,81,0.05) !important
  }

  .lp-grid{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:clamp(24px,4vw,56px);
    align-items:start;
  }
  @media(max-width:768px){
    .lp-grid{grid-template-columns:1fr;gap:24px}
  }
`;

const s: Record<string, React.CSSProperties> = {
  lbl: {
    fontFamily:"'Jost',sans-serif",
    fontSize: 9, fontWeight: 700,
    letterSpacing: '2.5px',
    color: `rgba(200,169,81,0.8)`,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
};