import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar         from '../components/common/Navbar';
import Footer         from '../components/common/Footer';
import InstagramStrip from '../components/common/InstagramStrip';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Variant {
  id:         number;
  product_id: number;
  color:      string;
  size:       string;
  stock:      number;
  sku:        string;
}

interface Product {
  id:          number;
  name:        string;
  price:       string;
  description: string;
  features:    string[];
  category:    string;
  stock:       number;
  images:      string[];
  image_url:   string;
  colors:      string[];
  sizes:       string[];
  variants:    Variant[];
}

interface Review {
  id:         number;
  rating:     number;
  comment:    string | null;
  created_at: string;
  full_name:  string;
}

interface ReviewStats {
  total:   number;
  average: number;
  five:    number;
  four:    number;
  three:   number;
  two:     number;
  one:     number;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  navy:      '#0D1B3E',
  navyLight: '#1E2F5A',
  gold:      '#C8A951',
  goldLight: '#DEC06A',
  cream:     '#F9F5EC',
  creamMid:  '#F0EAD8',
  creamDeep: '#E4D9C0',
  muted:     '#7A7A8A',
};

// ── Social proof messages ──────────────────────────────────────────────────────
const SOCIAL_PROOF = [
  '👀 3 people are viewing this right now',
  '🔥 Selling fast — only a few left',
  '🛍️ Someone in Nairobi just added this to cart',
  '⚡ 12 people bought this in the last 24 hours',
  '💬 "Exactly as described!" — recent buyer',
  '📦 Orders placed now ship within 24 hrs',
  '🏆 Top pick in this category this week',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isLightColor(color: string): boolean {
  const lightNames = ['white','ivory','cream','beige','yellow','snow','linen','wheat',
    'lightyellow','lightgray','lightgrey','silver','lavender','mintcream'];
  const lower = color.toLowerCase().replace(/\s+/g, '');
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

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:size, color: i<=Math.round(rating)?T.gold:T.creamDeep, lineHeight:1 }}>
          {i <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
// stock = -1 means "selection not made yet, hide overlays"
// stock =  0 means "genuinely sold out, show overlay"
// stock >  0 means show low-stock badge if <= 5
function Slideshow({ images, productName, stock }: {
  images:      string[];
  productName: string;
  stock:       number;   // -1 = pending selection
}) {
  const [active,      setActive]      = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction,   setDirection]   = useState<'left'|'right'>('right');
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const go = useCallback((idx: number, dir: 'left'|'right') => {
    if (isAnimating || idx === active) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => { setActive(idx); setIsAnimating(false); }, 280);
  }, [active, isAnimating]);

  const prev = () => go((active - 1 + images.length) % images.length, 'left');
  const next = () => go((active + 1) % images.length, 'right');

  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActive(a => { setDirection('right'); return (a+1) % images.length; });
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length]);

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setActive(a => (a+1) % images.length), 4000);
  };

  // Determine natural aspect ratio from image (fit to image, no whitespace)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Main image — natural aspect ratio, no fixed square */}
      <div style={{
        position:'relative', borderRadius:16, overflow:'hidden',
        background:'#fff', border:`1px solid ${T.creamDeep}`,
        boxShadow:`0 16px 48px rgba(13,27,62,0.12)`,
        lineHeight:0,   // removes bottom gap from inline img
      }}>
        <img
          key={active}
          src={images[active]}
          alt={productName}
          style={{
            width:'100%',
            height:'auto',           // natural height — no whitespace
            display:'block',         // removes inline baseline gap
            objectFit:'cover',
            transition:'opacity 0.28s ease, transform 0.28s ease',
            opacity:   isAnimating ? 0 : 1,
            transform: isAnimating
              ? `translateX(${direction === 'right' ? '24px' : '-24px'})`
              : 'translateX(0)',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/600x600/F0EAD8/0D1B3E?text=LP';
          }}
        />

        {images.length > 1 && (
          <div style={{
            position:'absolute', bottom:12, right:12,
            background:'rgba(13,27,62,0.6)', backdropFilter:'blur(6px)',
            color:'#fff', fontFamily:"'Jost',sans-serif", fontSize:10,
            fontWeight:700, borderRadius:20, padding:'4px 10px', letterSpacing:'0.5px',
          }}>
            {active+1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <>
            <button onClick={() => { prev(); resetInterval(); }} style={arrowStyle('left')}>‹</button>
            <button onClick={() => { next(); resetInterval(); }} style={arrowStyle('right')}>›</button>
          </>
        )}

        {/* FIX: only show overlays when stock is not -1 (pending selection) */}
        {stock !== -1 && stock <= 5 && stock > 0 && (
          <div style={{
            position:'absolute', top:12, left:12,
            background:T.gold, color:T.navy,
            fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:800,
            borderRadius:3, padding:'4px 10px', letterSpacing:'1.5px', textTransform:'uppercase',
          }}>
            Only {stock} left
          </div>
        )}
        {stock !== -1 && stock === 0 && (
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(13,27,62,0.6)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{
              background:'rgba(255,255,255,0.95)', color:T.navy,
              fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:10,
              padding:'7px 18px', borderRadius:3, letterSpacing:'2px', textTransform:'uppercase',
            }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { go(i, i > active ? 'right' : 'left'); resetInterval(); }}
              style={{
                width: i === active ? 20 : 6, height:6, borderRadius:3,
                border:'none',
                background: i === active ? T.gold : T.creamDeep,
                cursor:'pointer', transition:'all 0.3s ease', padding:0,
              }}
            />
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => { go(i, i > active ? 'right' : 'left'); resetInterval(); }}
              style={{
                width:60, height:60, flexShrink:0, background:'#fff',
                border:`2px solid ${i === active ? T.gold : T.creamDeep}`,
                borderRadius:8, overflow:'hidden', cursor:'pointer',
                transition:'border-color 0.2s, transform 0.15s',
                transform: i === active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <img
                src={img} alt=""
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/60x60/F0EAD8/0D1B3E?text=LP';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const arrowStyle = (side: 'left'|'right'): React.CSSProperties => ({
  position:'absolute', top:'50%', [side]:10,
  transform:'translateY(-50%)',
  background:'rgba(255,255,255,0.92)', backdropFilter:'blur(4px)',
  border:`1px solid ${T.creamDeep}`, borderRadius:'50%',
  width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:20, lineHeight:1, cursor:'pointer', color:T.navy,
  transition:'background 0.15s, transform 0.15s', zIndex:2,
});

// ── Social Proof Badge ────────────────────────────────────────────────────────
function SocialProofBadge() {
  const [msgIdx,  setMsgIdx]  = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setMsgIdx(i => (i+1) % SOCIAL_PROOF.length); setVisible(true); }, 400);
    }, 4500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background:'rgba(200,169,81,0.08)', border:`1px solid rgba(200,169,81,0.25)`,
      borderRadius:8, padding:'10px 14px', marginBottom:20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-4px)',
      transition:'opacity 0.35s ease, transform 0.35s ease',
    }}>
      <div style={{
        width:8, height:8, borderRadius:'50%', background:'#4A9A4A',
        flexShrink:0, boxShadow:'0 0 0 3px rgba(74,154,74,0.2)', animation:'pulse 2s infinite',
      }}/>
      <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.navy, fontWeight:500, lineHeight:1.4 }}>
        {SOCIAL_PROOF[msgIdx]}
      </span>
    </div>
  );
}

// ── Variant Stock Badge ───────────────────────────────────────────────────────
function VariantStockBadge({ variant, hasVariants, selectionComplete, productStock, selectedColor, hasSizeDim }: {
  variant:           Variant | null;
  hasVariants:       boolean;
  selectionComplete: boolean;
  productStock:      number;
  selectedColor:     string;
  hasSizeDim:        boolean;
}) {
  // FIX: not done selecting yet → show contextual prompt, never "Sold Out"
  if (hasVariants && !selectionComplete) {
    return (
      <span style={{
        background:'rgba(200,169,81,0.1)', border:'1px solid rgba(200,169,81,0.3)',
        color:T.gold, borderRadius:3, padding:'4px 12px',
        fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
        letterSpacing:'1px', textTransform:'uppercase' as const,
      }}>
        {selectedColor && hasSizeDim ? 'Select a size' : 'Select options'}
      </span>
    );
  }

  // Selection complete but combo not found in DB = genuinely sold out combo
  if (hasVariants && selectionComplete && !variant) {
    return (
      <span style={{
        background:'#FDF0EE', border:'1px solid #F5C6C0', color:'#C0392B',
        borderRadius:3, padding:'4px 12px',
        fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
        letterSpacing:'1px', textTransform:'uppercase' as const,
      }}>
        Sold Out
      </span>
    );
  }

  const stock = variant ? variant.stock : productStock;

  if (stock === 0) return (
    <span style={{
      background:'#FDF0EE', border:'1px solid #F5C6C0', color:'#C0392B',
      borderRadius:3, padding:'4px 12px',
      fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      Sold Out
    </span>
  );

  if (stock <= 5) return (
    <span style={{
      background:'#FDF8EC', border:'1px solid #F6E4A0', color:'#B7791F',
      borderRadius:3, padding:'4px 12px',
      fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      Only {stock} left
    </span>
  );

  return (
    <span style={{
      background:'#EEF3EE', border:'1px solid #C8DFC8', color:'#4A7A4A',
      borderRadius:3, padding:'4px 12px',
      fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      ✓ In Stock — {stock} available
    </span>
  );
}

// ── Related Products ──────────────────────────────────────────────────────────
function RelatedProducts({ category, currentId }: { category: string; currentId: number }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axios.get('/api/products')
      .then(res => {
        const all: Product[] = res.data;
        const others  = all.filter(p => p.id !== currentId);
        const sameCat = others.filter(p =>
          (p.category ?? '').trim().toLowerCase() === (category ?? '').trim().toLowerCase()
        );
        setProducts(sameCat.length >= 1 ? sameCat.slice(0,4) : others.slice(0,4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, currentId]);

  if (loading || products.length === 0) return null;

  return (
    <div style={{ marginTop:56 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:28, height:1, background:T.gold }}/>
          <span style={{
            fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700,
            letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(200,169,81,0.8)',
          }}>
            You may also like
          </span>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.gold}44,transparent)` }}/>
        </div>
        <h2 style={{
          fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:'clamp(18px,3vw,24px)', color:T.navy,
        }}>
          Related Products
        </h2>
      </div>

      <div className="related-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12 }}>
        {products.map(p => (
          <div
            key={p.id}
            onClick={() => { navigate(`/product/${p.id}`); window.scrollTo({ top:0, behavior:'smooth' }); }}
            style={{ cursor:'pointer' }}
            className="related-card"
          >
            {/* FIX: image fills naturally, no fixed padding-bottom trick */}
            <div style={{
              width:'100%', overflow:'hidden', borderRadius:10,
              background:'#f5f5f5', border:`1px solid ${T.creamDeep}`, marginBottom:10,
              lineHeight:0,
            }}>
              <img
                src={p.image_url} alt={p.name}
                style={{
                  width:'100%', height:'auto', display:'block',
                  objectFit:'cover', transition:'transform 0.4s ease',
                }}
                className="related-img"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/300x300/F0EAD8/0D1B3E?text=LP';
                }}
              />
            </div>
            <div style={{
              fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:600,
              letterSpacing:'1.5px', textTransform:'uppercase', color:T.navy,
              marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {p.name}
            </div>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>
              KSh {Number(p.price).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────
function ReviewsSection({ productId }: { productId: number }) {
  const [open,    setOpen]    = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats,   setStats]   = useState<ReviewStats|null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    axios.get(`/api/reviews/product/${productId}`)
      .then(res => { setReviews(res.data.reviews); setStats(res.data.stats); setFetched(true); })
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
          width:'100%', background:'transparent', border:'none',
          borderTop:`1px solid ${T.creamDeep}`,
          borderBottom: open ? 'none' : `1px solid ${T.creamDeep}`,
          padding:'18px 0', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{
            fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700,
            letterSpacing:'2.5px', textTransform:'uppercase', color:T.navy,
          }}>
            Reviews
          </span>
          {stats && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Stars rating={stats.average ?? 0} size={12}/>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>
                  {Number(stats.average).toFixed(1)}
                </span>
              </div>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
                ({stats.total} review{stats.total !== 1 ? 's' : ''})
              </span>
            </>
          )}
        </div>
        <span style={{
          color:T.muted, fontSize:10, transition:'transform 0.25s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display:'inline-block',
        }}>
          ▼
        </span>
      </button>

      <div style={{ overflow:'hidden', maxHeight: open ? 3000 : 0, transition:'max-height 0.4s ease' }}>
        <div style={{
          background:T.cream, border:`1px solid ${T.creamDeep}`,
          borderTop:'none', borderRadius:'0 0 10px 10px', padding:'22px 22px 20px',
        }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.muted, fontSize:13 }}>
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
                        <span style={{ fontSize:10, fontWeight:700, color:T.muted, width:24, textAlign:'right' }}>
                          {label}
                        </span>
                        <div style={{ flex:1, height:6, background:T.creamDeep, borderRadius:3, overflow:'hidden' }}>
                          <div style={{
                            width:`${pct}%`, height:'100%', background:T.gold,
                            borderRadius:3, transition:'width 0.5s ease',
                          }}/>
                        </div>
                        <span style={{ fontSize:11, color:T.muted, width:18 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{
                height:1,
                background:'linear-gradient(90deg,transparent,rgba(200,169,81,0.25),transparent)',
                margin:'18px 0',
              }}/>
              {reviews.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', fontSize:13, color:T.muted }}>
                  No reviews yet — be the first after your purchase!
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{
                      background:'#fff', border:`1px solid ${T.creamDeep}`,
                      borderRadius:10, padding:'16px 18px',
                    }}>
                      <div style={{
                        display:'flex', alignItems:'flex-start',
                        justifyContent:'space-between', marginBottom:8,
                      }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{r.full_name}</div>
                          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{fmtDate(r.created_at)}</div>
                        </div>
                        <Stars rating={r.rating} size={14}/>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize:13, color:'rgba(13,27,62,0.75)', lineHeight:1.75, margin:0 }}>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [product,       setProduct]       = useState<Product|null>(null);
  const [variants,      setVariants]      = useState<Variant[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [qty,           setQty]           = useState(1);
  const [inCart,        setInCart]        = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [toast,         setToast]         = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [colorError,    setColorError]    = useState(false);
  const [selectedSize,  setSelectedSize]  = useState('');
  const [sizeError,     setSizeError]     = useState(false);
  const [cartCount,     setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [inWishlist,    setInWishlist]    = useState(false);

  // ── Derived variant state ──────────────────────────────────────────────────
  const hasVariants  = variants.length > 0;
  const hasColorDim  = hasVariants && variants.some(v => v.color && v.color !== '');
  const hasSizeDim   = hasVariants && variants.some(v => v.size  && v.size  !== '');

  const selectionComplete: boolean = (() => {
    if (!hasVariants) return true;
    if (hasColorDim && hasSizeDim)  return selectedColor !== '' && selectedSize !== '';
    if (hasColorDim && !hasSizeDim) return selectedColor !== '';
    if (!hasColorDim && hasSizeDim) return selectedSize  !== '';
    return true;
  })();

  const selectedVariant: Variant | null = (() => {
    if (!hasVariants || !selectionComplete) return null;
    return variants.find(v => {
      const colorMatch = hasColorDim ? v.color === selectedColor : true;
      const sizeMatch  = hasSizeDim  ? v.size  === selectedSize  : true;
      return colorMatch && sizeMatch;
    }) ?? null;
  })();

  const effectiveStock: number = (() => {
    if (!product)         return 0;
    if (!hasVariants)     return product.stock;
    if (!selectionComplete) return 0;
    return selectedVariant ? selectedVariant.stock : 0;
  })();

  const productSoldOut: boolean = hasVariants
    ? variants.every(v => v.stock === 0)
    : (product?.stock ?? 0) === 0;

  // FIX: pass -1 to slideshow when selection is pending, so no overlay shows
  const slideshowStock: number = (() => {
    if (!hasVariants) return effectiveStock;           // plain product — always show
    if (!selectionComplete) return -1;                 // pending — hide overlays
    return effectiveStock;                             // selection done — show real stock
  })();

  const isColorSoldOut = (color: string): boolean =>
    hasVariants && variants.filter(v => v.color === color).every(v => v.stock === 0);

  const isSizeSoldOut = (size: string): boolean => {
    if (!hasVariants) return false;
    if (selectedColor)
      return (variants.find(x => x.color === selectedColor && x.size === size)?.stock ?? 1) === 0;
    return variants.filter(v => v.size === size).every(v => v.stock === 0);
  };

  const getColorStock = (color: string): number | null => {
    if (!hasVariants) return null;
    if (hasSizeDim && !selectedSize) return null;
    const v = variants.find(x =>
      x.color === color && (hasSizeDim ? x.size === selectedSize : true)
    );
    return v ? v.stock : null;
  };

  const getSizeStock = (size: string): number | null => {
    if (!hasVariants) return null;
    if (hasColorDim && !selectedColor) return null;
    const v = variants.find(x =>
      x.size === size && (hasColorDim ? x.color === selectedColor : true)
    );
    return v ? v.stock : null;
  };

  const variantHint: string = (() => {
    if (!hasVariants || !selectionComplete || !selectedVariant) return '';
    if (selectedVariant.stock === 0) return 'This combination is sold out';
    if (selectedVariant.stock <= 5)  return `Only ${selectedVariant.stock} left`;
    return `${selectedVariant.stock} available`;
  })();

  // ── Cart / wishlist counts ─────────────────────────────────────────────────
  const fetchCartCount = useCallback(() => {
    axios.get('/api/cart')
      .then(res => setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0)))
      .catch(() => {});
  }, []);

  const fetchWishlistCount = useCallback(() => {
    axios.get('/api/wishlist').then(res => {
      setWishlistCount(res.data.length);
      setInWishlist(res.data.some((i: any) => i.product_id === Number(id)));
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
    window.addEventListener('focus', fetchCartCount);
    window.addEventListener('focus', fetchWishlistCount);
    return () => {
      window.removeEventListener('focus', fetchCartCount);
      window.removeEventListener('focus', fetchWishlistCount);
    };
  }, [fetchCartCount, fetchWishlistCount]);

  useEffect(() => {
    const h = () => { fetchCartCount(); fetchWishlistCount(); };
    window.addEventListener('cartUpdated', h);
    return () => window.removeEventListener('cartUpdated', h);
  }, [fetchCartCount, fetchWishlistCount]);

  // ── Load product ───────────────────────────────────────────────────────────
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
        setVariants(p.variants || []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate('/'); });
  }, [id]);

  // ── Restore selections if item already in cart ─────────────────────────────
  useEffect(() => {
    if (!id) return;
    axios.get('/api/cart').then(res => {
      const item = res.data.find((i: any) => i.product_id === Number(id));
      if (item) {
        setInCart(true);
        if (item.selected_color) setSelectedColor(item.selected_color);
        if (item.selected_size)  setSelectedSize(item.selected_size);
      } else {
        setInCart(false);
      }
    }).catch(() => {});
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const toggleWishlist = async () => {
    if (inWishlist) {
      setInWishlist(false);
      try { await axios.delete(`/api/wishlist/${product!.id}`); showToast('Removed from wishlist.'); }
      catch { setInWishlist(true); }
    } else {
      setInWishlist(true);
      try { await axios.post('/api/wishlist', { product_id: product!.id }); showToast('❤️ Added to wishlist!'); }
      catch { setInWishlist(false); }
    }
    fetchWishlistCount();
  };

  // ── Color change ───────────────────────────────────────────────────────────
  // FIX: always clear size on color change — no stale-closure conditional block
  const handleColorChange = async (color: string) => {
    setSelectedColor(color);
    setSelectedSize('');        // always reset — prevents stale "complete" state
    setColorError(false);

    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity:       cartItem.quantity,
          selected_color: color,
          selected_size:  null,   // cleared along with local state
        });
        showToast(`Colour updated to ${color}`);
      }
    } catch {}
  };

  // ── Size change ────────────────────────────────────────────────────────────
  const handleSizeChange = async (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity:       cartItem.quantity,
          selected_color: selectedColor || cartItem.selected_color,
          selected_size:  size,
        });
        showToast(`Size updated to ${size}`);
      }
    } catch {}
  };

  // ── Cart toggle ────────────────────────────────────────────────────────────
  const handleCartToggle = async () => {
    if (!inCart) {
      if (product?.colors?.length && !selectedColor) {
        setColorError(true);
        setTimeout(() => setColorError(false), 600);
        showToast('Please select a colour first.');
        return;
      }
      if (product?.sizes?.length && !selectedSize) {
        setSizeError(true);
        setTimeout(() => setSizeError(false), 600);
        showToast('Please select a size first.');
        return;
      }
      if (hasVariants && selectedVariant && selectedVariant.stock === 0) {
        showToast('This combination is sold out.');
        return;
      }
    }

    setAdding(true);
    try {
      if (inCart) {
        const cartRes  = await axios.get('/api/cart');
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
          quantity:       qty,
          selected_color: selectedColor || null,
          selected_size:  selectedSize  || null,
        });
        setInCart(true);
        showToast('🛒 Added to cart!');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch {
      showToast('Could not update cart.');
    } finally {
      setAdding(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight:'100vh', background:T.navy,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        width:38, height:38,
        border:`3px solid rgba(200,169,81,0.2)`, borderTopColor:T.gold,
        borderRadius:'50%', animation:'spin 0.8s linear infinite',
      }}/>
      <p style={{
        color:'rgba(200,169,81,0.6)', fontFamily:"'Jost',sans-serif",
        fontSize:13, letterSpacing:'1px', marginTop:16, textTransform:'uppercase',
      }}>
        Loading…
      </p>
    </div>
  );

  if (!product) return null;

  const images    = product.images.length
    ? product.images
    : ['https://placehold.co/600x600/F0EAD8/0D1B3E?text=Luku+Prime'];
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes  = Array.isArray(product.sizes)  && product.sizes.length  > 0;
  const qtyMax    = effectiveStock;

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">
      <style>{css}</style>

      {toast && <div className="lp-toast">{toast}</div>}

      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={() => { setCartCount(0); setWishlistCount(0); }}
      />

      <div className="lp-fade" style={{
        maxWidth:1100, margin:'0 auto',
        padding:'clamp(20px,4vw,48px) clamp(16px,5%,5%) 80px',
      }}>
        {/* Breadcrumb */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          marginBottom:'clamp(18px,3vw,32px)', flexWrap:'wrap',
        }}>
          <button className="lp-back" onClick={() => navigate(-1)}>← Back</button>
          <span style={{ color:T.creamDeep }}>·</span>
          <button className="lp-back" style={{ color:T.muted }} onClick={() => navigate('/')}>Home</button>
          <span style={{ color:T.creamDeep }}>·</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
            {product.category || 'Product'}
          </span>
          <span style={{ color:T.creamDeep }}>·</span>
          <span style={{
            fontFamily:"'Jost',sans-serif", fontSize:11, color:T.navy, fontWeight:600,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            maxWidth:'clamp(100px,30vw,220px)',
          }}>
            {product.name}
          </span>
        </div>

        <div className="lp-grid">

          {/* ── Slideshow ── */}
          {/* FIX: pass slideshowStock (-1 when pending) so overlays hide until selection done */}
          <Slideshow
            images={images}
            productName={product.name}
            stock={slideshowStock}
          />

          {/* ── Info panel ── */}
          <div>
            {product.category && (
              <div style={{
                display:'inline-block',
                background:'rgba(200,169,81,0.1)', border:'1px solid rgba(200,169,81,0.3)',
                color:T.gold, borderRadius:3, padding:'3px 12px',
                fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:800,
                letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:12,
              }}>
                {product.category}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <h1 style={{
                fontFamily:"'Playfair Display',serif", fontWeight:800,
                fontSize:'clamp(22px,4vw,34px)', color:T.navy,
                lineHeight:1.15, marginBottom:14, flex:1,
              }}>
                {product.name}
              </h1>
              <button
                onClick={toggleWishlist}
                style={{
                  background:'none',
                  border:`1.5px solid ${inWishlist ? '#E74C3C' : T.creamDeep}`,
                  borderRadius:'50%', width:42, height:42,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:18, flexShrink:0,
                  transition:'all 0.2s', marginTop:4,
                  color: inWishlist ? '#E74C3C' : T.muted,
                }}
              >
                {inWishlist ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Decorative divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:24, height:1, background:T.gold }}/>
              <div style={{ width:4, height:4, background:T.gold, transform:'rotate(45deg)' }}/>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${T.gold}44,transparent)` }}/>
            </div>

            {/* Price + stock badge */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
              <span style={{
                fontFamily:"'Playfair Display',serif", fontWeight:700,
                fontSize:'clamp(20px,3vw,30px)', color:T.navy,
              }}>
                KSh {Number(product.price).toLocaleString()}
              </span>
              <VariantStockBadge
                variant={selectedVariant}
                hasVariants={hasVariants}
                selectionComplete={selectionComplete}
                productStock={product.stock}
                selectedColor={selectedColor}
                hasSizeDim={hasSizeDim}
              />
            </div>

            <SocialProofBadge/>

            {product.description && (
              <div style={{ marginBottom:20 }}>
                <div style={s.lbl}>Description</div>
                <p style={{
                  fontFamily:"'Jost',sans-serif", fontSize:14,
                  color:'rgba(13,27,62,0.75)', lineHeight:1.8,
                }}>
                  {product.description}
                </p>
              </div>
            )}

            {product.features?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={s.lbl}>Features</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {product.features.map((f, i) => (
                    <div key={i} style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      background:'rgba(200,169,81,0.08)', border:'1px solid rgba(200,169,81,0.22)',
                      borderRadius:20, padding:'6px 12px',
                      fontFamily:"'Jost',sans-serif", fontSize:12, color:T.navy, fontWeight:500,
                    }}>
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
                      {inCart && (
                        <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Colour swatches */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:14 }}>
                  {product.colors.map((color, i) => {
                    const active     = selectedColor === color;
                    const light      = isLightColor(color);
                    const soldOut    = isColorSoldOut(color);
                    const colorStock = getColorStock(color);
                    return (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, width:54 }}>
                        <button
                          title={soldOut
                            ? `${color} — sold out`
                            : colorStock !== null
                              ? `${color} — ${colorStock} available`
                              : color}
                          onClick={() => !soldOut && handleColorChange(color)}
                          style={{
                            width:38, height:38, borderRadius:'50%', background:color,
                            border: active
                              ? `3px solid ${T.gold}`
                              : `2px solid ${light ? T.creamDeep : 'rgba(0,0,0,0.12)'}`,
                            boxShadow: active
                              ? `0 0 0 2px #fff, 0 0 0 5px ${T.gold}`
                              : '0 2px 6px rgba(0,0,0,0.15)',
                            cursor: soldOut ? 'not-allowed' : 'pointer',
                            opacity: soldOut ? 0.35 : 1,
                            transition:'all 0.18s', flexShrink:0, position:'relative', padding:0,
                          }}
                          aria-label={`${color}${soldOut ? ' (sold out)' : colorStock !== null ? ` (${colorStock} available)` : ''}`}
                          aria-pressed={active}
                        >
                          {active && !soldOut && (
                            <span style={{
                              position:'absolute', inset:0,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:14, fontWeight:800, color: light ? T.navy : '#fff',
                            }}>✓</span>
                          )}
                          {soldOut && (
                            <span style={{
                              position:'absolute', inset:0,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12, color: light ? T.navy : '#fff',
                            }}>✕</span>
                          )}
                        </button>
                        {colorStock !== null && (
                          <span style={{
                            fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700,
                            textAlign:'center', lineHeight:1.2,
                            color: soldOut
                              ? T.muted
                              : colorStock === 0
                                ? '#C0392B'
                                : colorStock <= 5
                                  ? '#B7791F'
                                  : '#4A7A4A',
                          }}>
                            {soldOut || colorStock === 0
                              ? 'Sold out'
                              : colorStock <= 5
                                ? `${colorStock} left`
                                : `${colorStock}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Colour dropdown */}
                <div className={colorError ? 'lp-shake' : ''}>
                  <div style={{ position:'relative' }}>
                    {selectedColor && (
                      <div style={{
                        position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
                        width:14, height:14, borderRadius:'50%', background:selectedColor,
                        border:`1.5px solid ${T.creamDeep}`, pointerEvents:'none', zIndex:1,
                        boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
                      }}/>
                    )}
                    <select
                      value={selectedColor}
                      onChange={e => handleColorChange(e.target.value)}
                      style={{
                        width:'100%', background:T.cream,
                        border:`1.5px solid ${colorError ? '#C0392B' : selectedColor ? T.gold : T.creamDeep}`,
                        borderRadius:10,
                        padding:`11px 36px 11px ${selectedColor ? '36px' : '14px'}`,
                        fontFamily:"'Jost',sans-serif", fontSize:14,
                        color: selectedColor ? T.navy : T.muted,
                        outline:'none', cursor:'pointer',
                        appearance:'none', WebkitAppearance:'none',
                      }}
                    >
                      <option value="">— Choose a colour —</option>
                      {product.colors.map((color, i) => {
                        const soldOut = isColorSoldOut(color);
                        return (
                          <option key={i} value={color} disabled={soldOut}>
                            {color}{soldOut ? ' (sold out)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div style={{
                      position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
                      pointerEvents:'none', fontSize:10, color:T.muted,
                    }}>▼</div>
                  </div>
                  {colorError ? (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#C0392B', marginTop:6, fontWeight:700 }}>
                      ⚠ Please select a colour to continue
                    </div>
                  ) : selectedColor ? (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#4A7A4A', marginTop:6, fontWeight:600 }}>
                      ✓ {selectedColor} selected{inCart ? ' · saved to cart' : ''}
                    </div>
                  ) : (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:6 }}>
                      {product.colors.length} colour{product.colors.length !== 1 ? 's' : ''} available
                    </div>
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
                      {inCart && (
                        <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>
                      )}
                    </span>
                  )}
                </div>

                <div className={sizeError ? 'lp-shake' : ''} style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:10 }}>
                  {product.sizes
                    .filter(size =>
                      // FIX: only show sizes that exist for the selected color (or all if no color chosen)
                      selectedColor
                        ? variants.some(v => v.color === selectedColor && v.size === size)
                        : variants.some(v => v.size === size)
                    )
                    .map((size, i) => {
                      const active    = selectedSize === size;
                      const soldOut   = isSizeSoldOut(size);
                      const sizeStock = getSizeStock(size);
                      return (
                        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:52 }}>
                          <button
                            onClick={() => !soldOut && handleSizeChange(size)}
                            title={soldOut
                              ? `${size} — sold out`
                              : sizeStock !== null
                                ? `${size} — ${sizeStock} available`
                                : size}
                            style={{
                              width:'100%', padding:'8px 14px', borderRadius:8,
                              border: active ? `2px solid ${T.gold}` : `1.5px solid ${T.creamDeep}`,
                              background: soldOut ? T.creamMid : active ? 'rgba(200,169,81,0.12)' : '#fff',
                              fontFamily:"'Jost',sans-serif", fontSize:13,
                              fontWeight: active ? 700 : 500,
                              color: soldOut ? T.muted : active ? T.navy : T.muted,
                              cursor: soldOut ? 'not-allowed' : 'pointer',
                              opacity: soldOut ? 0.5 : 1,
                              transition:'all 0.15s',
                              textDecoration: soldOut ? 'line-through' : 'none',
                              position:'relative',
                            }}
                          >
                            {size}
                            {!soldOut && sizeStock !== null && sizeStock > 0 && sizeStock <= 5 && (
                              <span style={{
                                position:'absolute', top:4, right:4,
                                width:5, height:5, borderRadius:'50%', background:'#B7791F',
                              }}/>
                            )}
                          </button>
                          {sizeStock !== null && (
                            <span style={{
                              fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700,
                              textAlign:'center', lineHeight:1.2,
                              color: soldOut
                                ? T.muted
                                : sizeStock === 0
                                  ? '#C0392B'
                                  : sizeStock <= 5
                                    ? '#B7791F'
                                    : '#4A7A4A',
                            }}>
                              {soldOut || sizeStock === 0
                                ? 'Sold out'
                                : sizeStock <= 5
                                  ? `${sizeStock} left`
                                  : `${sizeStock}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>

                {sizeError ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#C0392B', fontWeight:700 }}>
                    ⚠ Please select a size to continue
                  </div>
                ) : variantHint ? (
                  <div style={{
                    fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:600,
                    color: variantHint.includes('sold out') || variantHint.includes('Sold')
                      ? '#C0392B'
                      : variantHint.includes('Only')
                        ? '#B7791F'
                        : '#4A7A4A',
                  }}>
                    {variantHint.includes('sold out') ? '✕' : variantHint.includes('Only') ? '⚠' : '✓'} {variantHint}
                  </div>
                ) : selectedSize ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#4A7A4A', fontWeight:600 }}>
                    ✓ Size {selectedSize} selected{inCart ? ' · saved to cart' : ''}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
                    {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''} available — pick one above
                  </div>
                )}
              </div>
            )}

            {/* ── QUANTITY ── */}
            {!productSoldOut && effectiveStock > 0 && (
              <div style={{ marginBottom:22 }}>
                <div style={s.lbl}>Quantity</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <button className="lp-qty" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span style={{
                    fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20,
                    color:T.navy, minWidth:24, textAlign:'center',
                  }}>
                    {qty}
                  </span>
                  <button className="lp-qty" onClick={() => setQty(q => Math.min(qtyMax, q+1))}>+</button>
                  <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
                    {qtyMax} available
                  </span>
                </div>
              </div>
            )}

            {/* ── CART BUTTON ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {productSoldOut ? (
                <button className="lp-btn" style={{ background:T.creamDeep, color:T.muted }} disabled>
                  Sold Out
                </button>
              ) : (hasVariants && selectedVariant && selectedVariant.stock === 0) ? (
                <button className="lp-btn" style={{ background:T.creamDeep, color:T.muted }} disabled>
                  This combination is Sold Out
                </button>
              ) : inCart ? (
                <>
                  <button className="lp-btn lp-btn-green" onClick={() => navigate('/cart')}>
                    ✓ In Cart — View Cart
                  </button>
                  <button className="lp-btn lp-btn-outline" onClick={handleCartToggle} disabled={adding}>
                    {adding ? '⏳ Updating…' : '✕ Remove from Cart'}
                  </button>
                </>
              ) : (
                <button
                  className="lp-btn"
                  style={{ background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, color:T.navy }}
                  onClick={handleCartToggle}
                  disabled={adding || (hasVariants && !selectedVariant)}
                >
                  {adding
                    ? '⏳ Adding…'
                    : hasVariants && !selectedColor && product.colors.length > 0
                      ? 'Select a colour to add to cart'
                      : hasVariants && !selectedSize && product.sizes.length > 0
                        ? 'Select a size to add to cart'
                        : `Add to Cart — KSh ${(Number(product.price) * qty).toLocaleString()}`}
                </button>
              )}
            </div>
          </div>
        </div>

        <ReviewsSection productId={product.id}/>
        <RelatedProducts category={product.category} currentId={product.id}/>
      </div>

      <InstagramStrip handle="@lukuprime" profileUrl="https://instagram.com/lukuprime" limit={12}/>
      <Footer/>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin    { to { transform:rotate(360deg) } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 3px rgba(74,154,74,0.2)} 50%{box-shadow:0 0 0 6px rgba(74,154,74,0.05)} }

  .lp-fade  { animation:fadeUp 0.45s ease forwards }
  .lp-shake { animation:shake 0.45s ease both }

  .lp-toast {
    position:fixed; top:18px; left:50%; transform:translateX(-50%);
    background:#0D1B3E; color:#DEC06A;
    font-family:'Jost',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px;
    border-radius:8px; padding:12px 24px; z-index:9999;
    box-shadow:0 8px 28px rgba(13,27,62,0.3); border:1px solid rgba(200,169,81,0.25);
    animation:slideIn 0.3s ease forwards; max-width:calc(100vw - 32px); text-align:center;
  }
  .lp-back {
    background:none; border:none; cursor:pointer;
    font-family:'Jost',sans-serif; font-size:10px; font-weight:700;
    color:rgba(200,169,81,0.7); display:flex; align-items:center; gap:5px;
    padding:0; transition:color 0.15s; letter-spacing:1px; text-transform:uppercase; white-space:nowrap;
  }
  .lp-back:hover { color:#C8A951 }
  .lp-qty {
    background:rgba(200,169,81,0.08); border:1px solid rgba(200,169,81,0.25);
    border-radius:6px; width:36px; height:36px; font-size:18px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; color:#0D1B3E; flex-shrink:0;
  }
  .lp-qty:hover { background:rgba(200,169,81,0.18) }
  .lp-btn {
    border:none; border-radius:6px; padding:14px 16px;
    font-family:'Jost',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:2px; text-transform:uppercase; cursor:pointer; transition:all 0.25s; width:100%;
  }
  .lp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(200,169,81,0.3) }
  .lp-btn:disabled { opacity:0.6; cursor:not-allowed }
  .lp-btn-green   { background:linear-gradient(135deg,#2E6B2E,#3E8A3E); color:#fff }
  .lp-btn-outline { background:transparent !important; border:1.5px solid rgba(200,169,81,0.4); color:#0D1B3E }
  .lp-btn-outline:hover:not(:disabled) { border-color:#C8A951; background:rgba(200,169,81,0.05) !important }

  .lp-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(24px,4vw,56px); align-items:start }
  @media(max-width:768px) { .lp-grid { grid-template-columns:1fr; gap:24px } }

  /* Related card — image scales naturally, hover lifts it */
  .related-card:hover .related-img { transform:scale(1.04) }
  .related-img { transition:transform 0.4s ease !important }
  @media(min-width:640px) {
    .related-grid { grid-template-columns:repeat(4,1fr) !important; gap:20px !important }
  }
`;

const s: Record<string, React.CSSProperties> = {
  lbl: {
    fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700,
    letterSpacing:'2.5px', color:'rgba(200,169,81,0.8)',
    textTransform:'uppercase', marginBottom:10,
  },
};