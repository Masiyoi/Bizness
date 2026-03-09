import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
  category: string;
  stock: number;
  images: string[];
  image_url: string;
}

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [product, setProduct]     = useState<Product | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]             = useState(1);
  const [inCart, setInCart]       = useState(false);
  const [adding, setAdding]       = useState(false);
  const [toast, setToast]         = useState('');

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(res => {
        const p = res.data;
        // normalise images field
        if (!p.images || p.images.length === 0) {
          p.images = p.image_url ? [p.image_url] : [];
        }
        if (typeof p.images === 'string') p.images = JSON.parse(p.images);
        if (typeof p.features === 'string') p.features = JSON.parse(p.features || '[]');
        setProduct(p);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate('/'); });
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const handleAddToCart = async () => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    setAdding(true);
    try {
      await axios.post('/api/cart', { product_id: product!.id, quantity: qty }, authHeaders());
      setInCart(true);
      showToast('Added to cart!');
    } catch {
      showToast('Could not add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.loadWrap}>
        <div style={s.spinner} />
        <p style={{ color: '#9C7A60', fontFamily: 'DM Sans,sans-serif', marginTop: 16 }}>Loading product…</p>
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images.length ? product.images : ['https://placehold.co/600x600/F5EDE3/9C7A60?text=No+Image'];

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,500&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .thumb { cursor: pointer; border-radius: 12px; overflow: hidden; border: 2px solid transparent; transition: border-color 0.2s, transform 0.15s; }
        .thumb:hover { transform: scale(1.04); }
        .thumb.active { border-color: #C4703A; }

        .add-btn { border: none; border-radius: 14px; padding: 16px 32px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition: filter 0.2s, transform 0.15s; display:flex; align-items:center; justify-content:center; gap:10px; }
        .add-btn:hover:not(:disabled) { filter:brightness(0.92); transform:translateY(-2px); }
        .add-btn:disabled { opacity:0.65; cursor:not-allowed; }

        .qty-btn { background:#FBF6F0; border:1px solid #EDE3D9; border-radius:8px; width:36px; height:36px; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; font-family:'DM Sans',sans-serif; color:#2C1A0E; }
        .qty-btn:hover { background:#EDE3D9; }

        .back-link { background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; color:#9C7A60; display:flex; align-items:center; gap:6px; padding:0; transition:color 0.15s; }
        .back-link:hover { color:#C4703A; }

        .feature-pill { display:inline-flex; align-items:center; gap:6px; background:#FBF6F0; border:1px solid #EDE3D9; border-radius:20px; padding:6px 14px; font-family:'DM Sans',sans-serif; font-size:13px; color:#5C3D1E; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }

        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .toast { animation: slideIn 0.3s ease forwards; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={s.toast}>{toast}</div>
      )}

      <div style={s.container} className="fade-up">

        {/* Breadcrumb */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-link" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span style={{ color: '#EDE3D9' }}>·</span>
          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#BEA898' }}>
            {product.category || 'Product'}
          </span>
          <span style={{ color: '#EDE3D9' }}>·</span>
          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#9C7A60', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
            {product.name}
          </span>
        </div>

        <div style={s.grid}>
          {/* ── IMAGE GALLERY ──────────────────────────────── */}
          <div style={s.galleryCol}>
            {/* Main image */}
            <div style={s.mainImgWrap}>
              <img
                src={images[activeImg]}
                alt={product.name}
                style={s.mainImg}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/F5EDE3/9C7A60?text=No+Image'; }}
              />
              {product.stock <= 5 && product.stock > 0 && (
                <div style={s.stockBadge}>Only {product.stock} left!</div>
              )}
              {product.stock === 0 && (
                <div style={{ ...s.stockBadge, background: '#C0392B' }}>Out of Stock</div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={s.thumbRow}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`thumb ${i === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    style={{ width: 72, height: 72, flexShrink: 0 }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/72x72/F5EDE3/9C7A60?text=📦'; }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PRODUCT INFO ───────────────────────────────── */}
          <div style={s.infoCol}>
            {product.category && (
              <div style={s.categoryTag}>{product.category}</div>
            )}

            <h1 style={s.productName}>{product.name}</h1>

            <div style={s.priceRow}>
              <span style={s.price}>KSh {Number(product.price).toLocaleString()}</span>
              {product.stock > 0
                ? <span style={s.inStockBadge}>✓ In Stock</span>
                : <span style={{ ...s.inStockBadge, background: '#FDF0EE', color: '#C0392B', border: '1px solid #F5C6C0' }}>Out of Stock</span>
              }
            </div>

            {/* Description */}
            {product.description && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Description</h3>
                <p style={s.descText}>{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Features</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {product.features.map((f, i) => (
                    <div key={i} className="feature-pill">
                      <span style={{ color: '#C4703A' }}>✦</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {product.stock > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Quantity</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span style={{ fontFamily: 'Lora,serif', fontWeight: 700, fontSize: 20, color: '#2C1A0E', minWidth: 24, textAlign: 'center' as const }}>
                    {qty}
                  </span>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                  <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#9C7A60' }}>
                    {product.stock} available
                  </span>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginTop: 28 }}>
              {inCart ? (
                <button
                  className="add-btn"
                  style={{ background: 'linear-gradient(135deg,#5A8A5A,#3E6B3E)', color: '#fff', width: '100%' }}
                  onClick={() => navigate('/cart')}
                >
                  ✓ In Cart — View Cart
                </button>
              ) : (
                <button
                  className="add-btn"
                  style={{ background: product.stock === 0 ? '#EDE3D9' : 'linear-gradient(135deg,#C4703A,#E8944A)', color: product.stock === 0 ? '#9C7A60' : '#fff', width: '100%' }}
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                >
                  {adding ? '⏳ Adding…' : product.stock === 0 ? 'Out of Stock' : `🛒 Add to Cart — KSh ${(Number(product.price) * qty).toLocaleString()}`}
                </button>
              )}

              <button
                className="add-btn"
                style={{ background: '#FBF6F0', border: '1px solid #EDE3D9', color: '#2C1A0E', width: '100%' }}
                onClick={() => { handleAddToCart().then(() => navigate('/checkout')); }}
                disabled={product.stock === 0}
              >
                ⚡ Buy Now
              </button>
            </div>

            {/* Trust row */}
            <div style={s.trustRow}>
              {['🔒 Secure Payment', '📱 M-Pesa Ready', '🚚 Fast Delivery'].map(t => (
                <span key={t} style={s.trustItem}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#FBF6F0',
    fontFamily: "'DM Sans', sans-serif",
  },
  loadWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
  },
  spinner: {
    width: 36, height: 36, border: '3px solid #EDE3D9',
    borderTopColor: '#C4703A', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  container: {
    maxWidth: 1100, margin: '0 auto',
    padding: '40px 24px 80px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 48, alignItems: 'start',
  },
  galleryCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  mainImgWrap: {
    position: 'relative', borderRadius: 20, overflow: 'hidden',
    background: '#fff', border: '1px solid #EDE3D9',
    aspectRatio: '1', boxShadow: '0 8px 32px rgba(44,26,14,0.10)',
  },
  mainImg: {
    width: '100%', height: '100%', objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  stockBadge: {
    position: 'absolute', top: 14, right: 14,
    background: '#C4703A', color: '#fff',
    fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700,
    borderRadius: 20, padding: '5px 12px',
  },
  thumbRow: {
    display: 'flex', gap: 10, overflowX: 'auto' as const,
    paddingBottom: 4,
  },
  infoCol: { display: 'flex', flexDirection: 'column', gap: 0 },
  categoryTag: {
    display: 'inline-block',
    background: '#FDF0E6', border: '1px solid #F5D5B8',
    color: '#C4703A', borderRadius: 20, padding: '4px 14px',
    fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.5px', marginBottom: 14,
    textTransform: 'uppercase' as const,
  },
  productName: {
    fontFamily: 'Lora,serif', fontWeight: 700,
    fontSize: 32, color: '#2C1A0E', lineHeight: 1.2, marginBottom: 16,
  },
  priceRow: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
  },
  price: {
    fontFamily: 'Lora,serif', fontWeight: 700,
    fontSize: 28, color: '#C4703A',
  },
  inStockBadge: {
    background: '#EEF5EE', border: '1px solid #C8DFC8',
    color: '#5A8A5A', borderRadius: 20, padding: '5px 14px',
    fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: 'DM Sans,sans-serif', fontWeight: 700,
    fontSize: 12, color: '#8C6A50', letterSpacing: '1.5px',
    textTransform: 'uppercase' as const, marginBottom: 10,
  },
  descText: {
    fontFamily: 'DM Sans,sans-serif', fontSize: 15,
    color: '#5C3D1E', lineHeight: 1.7,
  },
  trustRow: {
    display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 20,
    paddingTop: 20, borderTop: '1px solid #EDE3D9',
  },
  trustItem: {
    fontFamily: 'DM Sans,sans-serif', fontSize: 12,
    color: '#8C6A50', background: '#FBF6F0',
    border: '1px solid #EDE3D9', borderRadius: 20, padding: '5px 12px',
  },
  toast: {
    position: 'fixed', top: 24, left: '50%',
    transform: 'translateX(-50%)',
    background: '#2C1A0E', color: '#fff',
    fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 600,
    borderRadius: 12, padding: '12px 24px',
    zIndex: 9999, boxShadow: '0 8px 24px rgba(44,26,14,0.25)',
  },
};