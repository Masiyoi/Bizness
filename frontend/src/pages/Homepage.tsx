import { useEffect, useState, useRef, useCallback } from 'react';
import logo from '../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  category?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_verified: boolean;
}

const CATEGORIES = [
  { label: 'All',             icon: '🏪', color: '#C4703A', bg: '#FDF6EF', desc: 'Everything' },
  { label: 'Electronics',     icon: '⚡', color: '#7B5EA7', bg: '#F3EEF9', desc: 'Gadgets & Tech' },
  { label: 'Fashion',         icon: '👗', color: '#C4703A', bg: '#FDF0E6', desc: 'Clothes & Style' },
  { label: 'Home & Living',   icon: '🪴', color: '#5A8A5A', bg: '#EEF5EE', desc: 'For your space' },
  { label: 'Beauty & Health', icon: '🌿', color: '#D4886A', bg: '#FBF0EB', desc: 'Glow & wellness' },
  { label: 'Sports',          icon: '🏃', color: '#4A7A9B', bg: '#EBF3F8', desc: 'Active lifestyle' },
];

const BANNERS = [
  {
    tag: '🔥 Hot Deals',
    title: 'Tech that\nworks for you',
    sub: 'Latest electronics at the best prices in Kenya',
    cta: 'Shop Electronics',
    bg: 'linear-gradient(135deg, #2D1B69 0%, #4A2C8A 60%, #7B5EA7 100%)',
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=80',
  },
  {
    tag: '✨ New Season',
    title: 'Dress the way\nyou feel',
    sub: 'Fresh fashion arrivals — casual, formal & everything in between',
    cta: 'Explore Fashion',
    bg: 'linear-gradient(135deg, #7C3D12 0%, #C4703A 60%, #E8944A 100%)',
    img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80',
  },
  {
    tag: '🌿 Wellness',
    title: 'Your home,\nyour sanctuary',
    sub: 'Discover home, beauty & wellness essentials',
    cta: 'Shop Now',
    bg: 'linear-gradient(135deg, #2D5016 0%, #4A7A25 60%, #5A8A5A 100%)',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80',
  },
];

const DEALS = [
  { label: 'Flash Sale',      emoji: '⚡', ends: '02:47:33', color: '#7B5EA7', bg: '#F3EEF9' },
  { label: 'Daily Pick',      emoji: '🌅', ends: '08:12:05', color: '#C4703A', bg: '#FDF0E6' },
  { label: 'Weekend Special', emoji: '🎉', ends: '1d 04:22', color: '#5A8A5A', bg: '#EEF5EE' },
];

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const readUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

export default function Homepage() {
  const navigate = useNavigate();

  const [products, setProducts]             = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartIds, setCartIds]               = useState<number[]>([]);
  const [cartCount, setCartCount]           = useState(0);
  const [wishlist, setWishlist]             = useState<number[]>([]);
  const [currentBanner, setCurrentBanner]   = useState(0);
  const [searchQuery, setSearchQuery]       = useState('');
  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState<User | null>(readUser);
  const [showUserMenu, setShowUserMenu]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

  const syncUser = useCallback(() => {
    const fresh = readUser();
    setUser(prev => {
      if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
      return fresh;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('storage', syncUser);
    const poll = setInterval(syncUser, 1000);
    return () => {
      window.removeEventListener('storage', syncUser);
      clearInterval(poll);
    };
  }, [syncUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrentBanner(p => (p + 1) % BANNERS.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) { setCartIds([]); setCartCount(0); return; }
    let cancelled = false;
    axios.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (cancelled) return;
        setCartIds(res.data.map((i: any) => i.product_id));
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const toggleCart = async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const inCart = cartIds.includes(productId);
    try {
      if (inCart) {
        navigate('/cart');
      } else {
        await axios.post('/api/cart', { product_id: productId, quantity: 1 }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartIds(prev => [...prev, productId]);
        setCartCount(prev => prev + 1);
      }
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const toggleWishlist = (id: number) =>
    setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartIds([]);
    setCartCount(0);
    setShowUserMenu(false);
  };

  const filtered = products.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const b = BANNERS[currentBanner];

  return (
    <div style={{
      fontFamily: "'Lora', 'Georgia', serif",
      background: '#FBF6F0', minHeight: '100vh',
      color: '#2C1A0E', width: '100%', maxWidth: '100%', overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sans { font-family: 'DM Sans', sans-serif; }
        .nav-item { font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; color:#5C3D1E; cursor:pointer; transition:color 0.2s; }
        .nav-item:hover { color:#C4703A; }
        .banner-wrap { border-radius:28px; overflow:hidden; position:relative; }
        .banner-btn { font-family:'DM Sans',sans-serif; font-weight:600; font-size:14px; border:none; border-radius:40px; padding:13px 28px; cursor:pointer; transition:all 0.2s; }
        .banner-btn:hover { filter:brightness(0.9); transform:translateY(-1px); }
        .dot { cursor:pointer; border-radius:50%; transition:all 0.35s; }
        .promo-card { border-radius:18px; padding:16px 18px; display:flex; align-items:center; gap:14px; }
        .cat-card { cursor:pointer; border-radius:20px; padding:18px 16px; text-align:center; transition:all 0.25s; border:2px solid transparent; }
        .cat-card:hover { transform:translateY(-4px); box-shadow:0 10px 28px rgba(196,112,58,0.15); }
        .cat-card.active { border-color:#C4703A; }
        .deal-card { border-radius:18px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:transform 0.2s; }
        .deal-card:hover { transform:scale(1.02); }
        .p-card { background:#fff; border-radius:22px; overflow:hidden; transition:all 0.25s; box-shadow:0 2px 10px rgba(44,26,14,0.06); }
        .p-card:hover { transform:translateY(-7px); box-shadow:0 18px 40px rgba(44,26,14,0.13); }
        .cart-btn { font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; border:none; border-radius:14px; padding:11px; width:100%; cursor:pointer; transition:all 0.2s; }
        .cart-btn:hover { filter:brightness(0.9); }
        .wish-btn { border:none; background:#FBF6F0; border-radius:50%; width:34px; height:34px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; font-size:16px; }
        .wish-btn:hover { transform:scale(1.25); }
        .skel { background:linear-gradient(90deg,#EDE3D9 25%,#F5EDE3 50%,#EDE3D9 75%); background-size:200% 100%; animation:shim 1.4s infinite; border-radius:14px; }
        @keyframes shim { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .tag { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
        .cart-badge { animation:pop .3s ease; }
        @keyframes pop { 50%{transform:scale(1.5)} }
        select, input { font-family:'DM Sans',sans-serif; }
        a { text-decoration:none; color:inherit; }
        .p-img { transition:transform 0.4s; }
        .p-card:hover .p-img { transform:scale(1.06); }
        .user-menu {
          position:absolute; top:calc(100% + 10px); right:0;
          background:#FFFDF9; border:1px solid #EDE3D9;
          border-radius:16px; padding:8px; min-width:220px;
          box-shadow:0 16px 40px rgba(44,26,14,0.14);
          animation:menuIn 0.18s ease; z-index:200;
        }
        @keyframes menuIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .menu-item {
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          padding:10px 14px; border-radius:10px; cursor:pointer;
          color:#2C1A0E; transition:background 0.15s;
          display:flex; align-items:center; gap:10px;
        }
        .menu-item:hover { background:#F5EDE3; }
        .menu-item.danger { color:#C0392B; }
        .menu-item.danger:hover { background:#FDF0EE; }
        .menu-item.admin { color:#C4703A; font-weight:700; }
        .menu-item.admin:hover { background:#FDF0E6; }
        .auth-btn {
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
          border-radius:20px; padding:8px 18px;
          cursor:pointer; transition:all 0.2s;
        }
        .auth-btn:hover { filter:brightness(0.92); transform:translateY(-1px); }
        .verified-badge {
          display:inline-flex; align-items:center; gap:4px;
          font-size:10px; font-weight:700; padding:2px 8px;
          border-radius:20px; background:#EEF5EE; color:#5A8A5A;
        }
      `}</style>

      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <nav style={{
        background: '#FFFDF9', borderBottom: '1px solid #EDE3D9',
        padding: '0 5%', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 16px rgba(44,26,14,0.05)',
      }}>
        <img src={logo} alt="A&I" style={{ height: 70, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />

        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F5EDE3', borderRadius: 40,
          padding: '9px 18px', gap: 8, width: 320,
          border: '1px solid #E8D8C8',
        }}>
          <span style={{ opacity: 0.5, fontSize: 15 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products, brands…"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, width: '100%', color: '#2C1A0E' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {['Deals', 'New In', 'Sell on A&I'].map(i => (
            <span key={i} className="nav-item">{i}</span>
          ))}

          {/* Cart */}
          <div style={{ position: 'relative', cursor: 'pointer', fontSize: 22 }} onClick={() => navigate('/cart')}>
            🛒
            {cartCount > 0 && (
              <span className="cart-badge sans" key={cartCount} style={{
                position: 'absolute', top: -6, right: -6,
                background: '#C4703A', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserMenu(s => !s)}
                title={user.full_name}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: user.role === 'admin'
                    ? 'linear-gradient(135deg,#C4703A,#7B5EA7)'
                    : 'linear-gradient(135deg,#C4703A,#E8944A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'DM Sans,sans-serif', userSelect: 'none',
                  border: showUserMenu ? '2px solid #C4703A' : '2px solid transparent',
                  transition: 'border 0.2s',
                }}
              >
                {getInitials(user.full_name)}
              </div>

              {showUserMenu && (
                <div className="user-menu">
                  {/* User info header */}
                  <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid #EDE3D9', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>
                      {user.full_name}
                    </div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#9C7A60', marginTop: 2 }}>
                      {user.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      {user.is_verified
                        ? <div className="verified-badge">✓ Verified</div>
                        : <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: '#C4703A', fontWeight: 500 }}>⚠️ Please verify your email</div>
                      }
                      {user.role === 'admin' && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 20, background: '#FDF0E6', color: '#C4703A',
                        }}>
                          🛠️ Admin
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Admin Dashboard — only visible to admin ── */}
                  {user.role === 'admin' && (
                    <div
                      className="menu-item admin"
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                    >
                      🛠️ Admin Dashboard
                    </div>
                  )}

                  <div className="menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>👤 My Profile</div>
                  <div className="menu-item" onClick={() => { setShowUserMenu(false); navigate('/orders'); }}>📦 My Orders</div>
                  <div className="menu-item" onClick={() => { setShowUserMenu(false); navigate('/wishlist'); }}>
                    ❤️ Wishlist
                    {wishlist.length > 0 && (
                      <span style={{ marginLeft: 'auto', background: '#C4703A', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                        {wishlist.length}
                      </span>
                    )}
                  </div>
                  {user.role === 'seller' && (
                    <div className="menu-item" onClick={() => { setShowUserMenu(false); navigate('/seller/dashboard'); }}>🏪 Seller Dashboard</div>
                  )}

                  <div style={{ borderTop: '1px solid #EDE3D9', marginTop: 6, paddingTop: 6 }}>
                    <div className="menu-item danger" onClick={handleLogout}>🚪 Sign Out</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="auth-btn" onClick={() => navigate('/login')}
                style={{ background: 'transparent', color: '#5C3D1E', border: '1px solid #D4B89A' }}>
                Sign In
              </button>
              <button className="auth-btn" onClick={() => navigate('/register')}
                style={{ background: '#C4703A', color: '#fff', border: 'none' }}>
                Join Free
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div style={{ padding: '28px 5% 0' }}>
        <div className="banner-wrap" style={{ background: b.bg, height: 340 }}>
          <img src={b.img} alt="" style={{
            position: 'absolute', right: 0, top: 0,
            width: '48%', height: '100%', objectFit: 'cover', opacity: 0.25,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg,rgba(0,0,0,0.55) 45%,transparent)',
            padding: '0 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div className="sans" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              color: '#fff', borderRadius: 30, padding: '5px 14px',
              fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
              marginBottom: 14, width: 'fit-content',
            }}>
              {b.tag}
            </div>
            <h1 style={{
              fontFamily: 'Lora,serif', fontWeight: 700,
              fontSize: 46, color: '#fff', lineHeight: 1.15,
              whiteSpace: 'pre-line', marginBottom: 10,
            }}>
              {b.title}
            </h1>
            <p className="sans" style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 26, maxWidth: 380 }}>
              {b.sub}
            </p>
            <button className="banner-btn" style={{ background: '#fff', color: '#2C1A0E', width: 'fit-content' }}>
              {b.cta} →
            </button>
          </div>
          <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
            {BANNERS.map((_, i) => (
              <div key={i} className="dot" onClick={() => setCurrentBanner(i)}
                style={{ width: i === currentBanner ? 26 : 8, height: 8, background: i === currentBanner ? '#fff' : 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST STRIPS ──────────────────────────────────────── */}
      <div style={{ padding: '22px 5%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: '🚚', title: 'Free Delivery',   sub: 'Orders over KSh 2,000', bg: '#FDF0E6', c: '#C4703A' },
          { icon: '↩️', title: '30-Day Returns',  sub: 'No questions asked',    bg: '#EEF5EE', c: '#5A8A5A' },
          { icon: '🔒', title: 'Secure Checkout', sub: 'M-Pesa & Cards',        bg: '#EBF3F8', c: '#4A7A9B' },
          { icon: '💬', title: '24/7 Support',    sub: 'Always here to help',   bg: '#F3EEF9', c: '#7B5EA7' },
        ].map(t => (
          <div key={t.title} className="promo-card" style={{ background: t.bg }}>
            <span style={{ fontSize: 26 }}>{t.icon}</span>
            <div>
              <div className="sans" style={{ fontWeight: 600, fontSize: 13, color: t.c }}>{t.title}</div>
              <div className="sans" style={{ fontSize: 11, color: '#8C6A50', marginTop: 2 }}>{t.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CATEGORIES ────────────────────────────────────────── */}
      <div style={{ padding: '4px 5% 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div className="tag" style={{ color: '#C4703A', marginBottom: 4 }}>Shop by</div>
            <h2 style={{ fontFamily: 'Lora,serif', fontWeight: 700, fontSize: 24, color: '#2C1A0E' }}>Category</h2>
          </div>
          <span className="sans" style={{ fontSize: 13, color: '#C4703A', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14 }}>
          {CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className={`cat-card ${activeCategory === cat.label ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.label)}
              style={{
                background: activeCategory === cat.label ? cat.bg : '#fff',
                boxShadow: activeCategory === cat.label ? `0 4px 16px ${cat.color}33` : '0 2px 8px rgba(44,26,14,0.06)',
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{cat.icon}</div>
              <div className="sans" style={{ fontSize: 13, fontWeight: 600, color: activeCategory === cat.label ? cat.color : '#2C1A0E' }}>
                {cat.label}
              </div>
              <div className="sans" style={{ fontSize: 11, color: '#9C7A60', marginTop: 3 }}>{cat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEAL STRIPS ───────────────────────────────────────── */}
      <div style={{ padding: '0 5% 30px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {DEALS.map(d => (
          <div key={d.label} className="deal-card" style={{ background: d.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{d.emoji}</span>
              <div>
                <div className="sans" style={{ fontWeight: 700, fontSize: 14, color: d.color }}>{d.label}</div>
                <div className="sans" style={{ fontSize: 11, color: '#9C7A60' }}>Ends in {d.ends}</div>
              </div>
            </div>
            <div className="sans" style={{ fontSize: 12, fontWeight: 600, color: d.color }}>Shop →</div>
          </div>
        ))}
      </div>

      {/* ── PRODUCTS GRID ─────────────────────────────────────── */}
      <div style={{ padding: '0 5% 70px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
          <div>
            <div className="tag" style={{ color: '#C4703A', marginBottom: 4 }}>
              {activeCategory === 'All' ? 'Picked for you' : activeCategory}
            </div>
            <h2 style={{ fontFamily: 'Lora,serif', fontWeight: 700, fontSize: 24, color: '#2C1A0E' }}>
              {activeCategory === 'All' ? 'Featured Products' : activeCategory}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="sans" style={{ fontSize: 13, color: '#9C7A60' }}>{filtered.length} items</span>
            <select style={{
              border: '1px solid #E8D8C8', borderRadius: 12,
              padding: '8px 14px', fontSize: 13, color: '#2C1A0E',
              background: '#FFFDF9', cursor: 'pointer', outline: 'none',
            }}>
              <option>Sort: Featured</option>
              <option>Price: Low → High</option>
              <option>Price: High → Low</option>
              <option>Newest First</option>
              <option>Best Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 20 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ borderRadius: 22, overflow: 'hidden' }}>
                <div className="skel" style={{ height: 210, borderRadius: 0 }} />
                <div style={{ padding: 14, background: '#fff' }}>
                  <div className="skel" style={{ height: 14, width: '75%', marginBottom: 10 }} />
                  <div className="skel" style={{ height: 12, width: '45%', marginBottom: 14 }} />
                  <div className="skel" style={{ height: 38 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9C7A60' }}>
            <div style={{ fontSize: 52 }}>🌿</div>
            <p className="sans" style={{ fontSize: 16, fontWeight: 500, marginTop: 14 }}>No products found</p>
            <p className="sans" style={{ fontSize: 13, marginTop: 6, color: '#BEA898' }}>Try a different category or search term</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 20 }}>
            {filtered.map(product => {
              const inCart     = cartIds.includes(product.id);
              const inWishlist = wishlist.includes(product.id);
              const catObj     = CATEGORIES.find(c => c.label === product.category);
              const origPrice  = Math.round(Number(product.price) * 1.18);
              const discount   = Math.round((1 - Number(product.price) / origPrice) * 100);

              return (
                <div key={product.id} className="p-card">
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="p-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200/F5EDE3/9C7A60?text=No+Image'; }}
                      />
                    </Link>
                    <button className="wish-btn" onClick={() => toggleWishlist(product.id)}
                      style={{ position: 'absolute', top: 10, right: 10, boxShadow: '0 2px 8px rgba(44,26,14,0.12)' }}>
                      {inWishlist ? '❤️' : '🤍'}
                    </button>
                    {catObj && catObj.label !== 'All' && (
                      <div className="sans" style={{
                        position: 'absolute', top: 10, left: 10,
                        background: catObj.bg, color: catObj.color,
                        borderRadius: 8, padding: '3px 9px', fontSize: 10, fontWeight: 700,
                      }}>
                        {catObj.icon} {catObj.label}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '14px 16px 16px' }}>
                    <Link to={`/product/${product.id}`}>
                      <div style={{
                        fontFamily: 'Lora,serif', fontWeight: 600, fontSize: 14.5, color: '#2C1A0E',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5,
                      }}>
                        {product.name}
                      </div>
                    </Link>
                    <div className="sans" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <span style={{ color: '#E8944A', fontSize: 12 }}>★★★★</span>
                      <span style={{ color: '#D4C0B0', fontSize: 12 }}>☆</span>
                      <span style={{ fontSize: 11, color: '#9C7A60' }}>(42)</span>
                    </div>
                    <div className="sans" style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 13 }}>
                      <span style={{ fontWeight: 700, fontSize: 17, color: '#2C1A0E' }}>
                        KSh {Number(product.price).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: '#BEA898', textDecoration: 'line-through' }}>
                        KSh {origPrice.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: '#5A8A5A', fontWeight: 600 }}>-{discount}%</span>
                    </div>
                    <button className="cart-btn" onClick={() => toggleCart(product.id)}
                      style={{ background: inCart ? '#2C1A0E' : '#C4703A', color: '#fff' }}>
                      {inCart ? '✓ In Cart — View Cart' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <div style={{
        background: '#2C1A0E', padding: '24px 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <img src={logo} alt="A&I" style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div className="sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          © 2025 A&I · Your Favorite Store
        </div>
        <div className="sans" style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          {['Privacy', 'Terms', 'Help'].map(l => (
            <span key={l} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}