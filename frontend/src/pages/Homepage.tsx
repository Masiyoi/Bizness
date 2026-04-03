import { useEffect, useState, useRef, useCallback } from 'react';
import logo from '../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: number; name: string; price: string; image_url: string;
  description: string; category?: string; stock?: number; created_at?: string;
}
interface User {
  id: number; full_name: string; email: string; role: string; is_verified: boolean;
}

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A', goldPale:'#F0D98A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0',
  white:'#FFFFFF', text:'#0D1B3E', muted:'#7A7A8A',
};

const CATEGORIES = [
  { label:'All',         icon:'👑', desc:'Full Collection'  },
  { label:'Clothes',     icon:'👗', desc:'Tops & Bottoms'   },
  { label:'Shoes',       icon:'👟', desc:'All Footwear'     },
  { label:'Bags',        icon:'👜', desc:'Bags & Purses'    },
  { label:'Female Wear', icon:'💃', desc:"Women's Fashion"  },
  { label:'Sneakers',    icon:'👠', desc:'Kicks & Trainers' },
  { label:'Jackets',     icon:'🧥', desc:'Outerwear'        },
  { label:'Socks',       icon:'🧦', desc:'Every Pair'       },
  { label:'Jerseys',     icon:'⚽', desc:'Team & Sport'     },
  { label:'Hoodies',     icon:'🏷️', desc:'Comfy Fleece'    },
];

const BANNERS = [
  { tag:'NEW COLLECTION', title:'Luku ni\nPrime Siku Zote', sub:'Premium fashion arrivals crafted for those who demand the finest — delivered across Kenya.', cta:'Shop Now', img:'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80' },
  { tag:'FOOTWEAR DROP',  title:'Step into\nStyle',         sub:'Exclusive sneakers and shoes that turn heads wherever you go.',                              cta:'Shop Footwear',  img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80' },
  { tag:'OUTERWEAR SEASON',title:'Piga Luku\nSafi',         sub:'Hoodies, jackets and outerwear for every mood and every weather.',                          cta:'Shop Outerwear', img:'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1200&q=80' },
];

const ANNOUNCEMENTS = [
  '✦ NAIROBI CBD DELIVERY — KSH 100','✦ NAIROBI ENVIRONS — KSH 200','✦ OTHER COUNTIES — KSH 300',
  '✦ FREE PICKUP FROM OUR SHOP','✦ NEW DROPS EVERY FRIDAY','✦ AUTHENTIC FASHION ONLY',
  '✦ KENYA\'S PREMIER FASHION STORE','✦ SECURE M-PESA CHECKOUT','✦ 30-DAY EASY RETURNS',
  '✦ WOMEN\'S COLLECTION NOW LIVE','✦ EXCLUSIVE SNEAKER DROPS',
];

const SOCIAL = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/lukuprimeshoesbagsthrift?igsh=MWxmazlvM2JseWNzeQ==',
    // Instagram gradient icon as inline SVG
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/>
      </svg>
    ),
    label: '@lukuprimeshoesbagsthrift',
    color: '#E1306C',
    hoverBg: 'rgba(225,48,108,0.12)',
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@lifewith_heels_bags',
    icon: (
      <svg width="20" height="22" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1c.4 2.2 1.7 3.7 4 4v3.5c-1.4 0-2.7-.4-4-1.2V16a7 7 0 1 1-7-7c.3 0 .6 0 .9.04V12.6a3.5 3.5 0 1 0 2.1 3.4V1h4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
    label: '@lifewith_heels_bags',
    color: '#ffffff',
    hoverBg: 'rgba(255,255,255,0.1)',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Lukuprime254',
    icon: (
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="22" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 5.5l6 3.5-6 3.5V5.5z" fill="currentColor"/>
      </svg>
    ),
    label: '@Lukuprime254',
    color: '#FF0000',
    hoverBg: 'rgba(255,0,0,0.12)',
  },
];

const isNewProduct = (createdAt?: string) =>
  createdAt ? Date.now() - new Date(createdAt).getTime() < 7*24*60*60*1000 : false;

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

const readUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export default function Homepage() {
  const navigate = useNavigate();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartIds,        setCartIds]        = useState<number[]>([]);
  const [cartCount,      setCartCount]      = useState(0);
  const [wishlist,       setWishlist]       = useState<number[]>([]);
  const [banner,         setBanner]         = useState(0);
  const [bannerFading,   setBannerFading]   = useState(false);
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(true);
  const [user,           setUser]           = useState<User | null>(readUser);
  const [showMenu,       setShowMenu]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);

  const menuRef      = useRef<HTMLDivElement>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  const syncUser = useCallback(() => {
    const f = readUser();
    setUser(p => JSON.stringify(p) === JSON.stringify(f) ? p : f);
  }, []);

  useEffect(() => {
    window.addEventListener('storage', syncUser);
    const id = setInterval(syncUser, 1000);
    return () => { window.removeEventListener('storage', syncUser); clearInterval(id); };
  }, [syncUser]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    fetch('/api/products').then(r => r.json())
      .then(d => { setProducts(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const goToBanner = (idx: number) => {
    setBannerFading(true);
    setTimeout(() => { setBanner(idx); setBannerFading(false); }, 300);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setBannerFading(true);
      setTimeout(() => { setBanner(p => (p+1)%BANNERS.length); setBannerFading(false); }, 300);
    }, 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchCart = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) { setCartIds([]); setCartCount(0); return; }
    axios.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setCartIds(res.data.map((i: any) => i.product_id));
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      }).catch(() => {});
  }, [user?.id]);

  // Fetch on every mount — this runs when user navigates BACK from /cart to /
  // (React Router unmounts Cart and mounts Homepage fresh each time)
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Fallback: re-fetch when the browser tab regains focus
  useEffect(() => {
    window.addEventListener('focus', fetchCart);
    return () => window.removeEventListener('focus', fetchCart);
  }, [fetchCart]);

  const toggleCart = async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (cartIds.includes(productId)) {
      try {
        await axios.delete(`/api/cart/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
        setCartIds(p => p.filter(id => id !== productId));
        setCartCount(p => Math.max(0, p-1));
      } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
      return;
    }
    try {
      await axios.post('/api/cart', { product_id: productId, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      setCartIds(p => [...p, productId]);
      setCartCount(p => p+1);
    } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
  };

  const toggleWishlist = (id: number) =>
    setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); setCartIds([]); setCartCount(0); setShowMenu(false); setMobileMenuOpen(false);
  };

  const setCategory = (cat: string) => {
    setActiveCategory(cat);
    if (catScrollRef.current) {
      const idx = CATEGORIES.findIndex(c => c.label === cat);
      const pill = catScrollRef.current.children[idx] as HTMLElement;
      if (pill) pill.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    }
  };

  const filtered = products.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const b = BANNERS[banner];

  return (
    <div style={{ fontFamily:"'Playfair Display','Georgia',serif", background:T.cream, minHeight:'100vh', color:T.text, overflowX:'hidden' }}>
      <style>{css}</style>

      {/* ── ANNOUNCEMENT TOPBAR ── */}
      <div style={{ background:T.navy, height:32, overflow:'hidden', display:'flex', alignItems:'center', borderBottom:`1px solid rgba(200,169,81,0.2)` }}>
        <div style={{ overflow:'hidden', width:'100%' }}>
          <div className="hp-marquee">
            {[...Array(2)].map((_,r) =>
              ANNOUNCEMENTS.map((t,i) => (
                <span key={`${r}-${i}`} className="jost" style={{ fontSize:9, fontWeight:600, letterSpacing:'2px', color:`rgba(200,169,81,0.85)` }}>{t}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ background:T.navy, padding:'0 5%', height:70, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:`0 4px 32px rgba(13,27,62,0.35)`, borderBottom:`1px solid rgba(200,169,81,0.25)` }}>

        <img src={logo} alt="Luku Prime" style={{ height:54, width:'auto', objectFit:'contain', cursor:'pointer', filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }} onClick={() => navigate('/')}/>

        {/* Desktop search */}
        <div className="hp-search-desktop" style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'8px 14px', gap:8, width:300, border:`1px solid rgba(200,169,81,0.2)` }}>
          <span style={{ fontSize:13, color:`rgba(200,169,81,0.7)` }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Luku Prime fashion…"
            style={{ background:'none', border:'none', outline:'none', fontSize:13, width:'100%', color:'rgba(255,255,255,0.85)', fontFamily:"'Jost',sans-serif" }}/>
        </div>

        {/* Desktop nav links + user */}
        <div className="hp-nav-right" style={{ display:'flex', alignItems:'center', gap:22 }}>
          {[{ label:'New Drops', path:'/new-drops' },{ label:'Sale', path:'/sale' }].map(l => (
            <span key={l.label} className="nav-link" onClick={() => navigate(l.path)}>{l.label}</span>
          ))}
          {user?.role !== 'admin' && (
            <div style={{ position:'relative', cursor:'pointer', color:'rgba(255,255,255,0.75)', fontSize:18 }} onClick={() => navigate('/cart')}>
              🛒
              {cartCount > 0 && (
                <span className="jost cbadge" key={cartCount} style={{ position:'absolute', top:-7, right:-8, background:T.gold, color:T.navy, borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {cartCount}
                </span>
              )}
            </div>
          )}
          {user ? (
            <div ref={menuRef} style={{ position:'relative' }}>
              <div onClick={() => setShowMenu(s => !s)} title={user.full_name}
                style={{ width:36, height:36, borderRadius:'50%',
                  background: user.role==='admin'
                    ? `linear-gradient(135deg,#7C3AED,#A855F7)`
                    : `linear-gradient(135deg,${T.gold},${T.goldLight})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: user.role==='admin' ? '#fff' : T.navy,
                  fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                  userSelect:'none',
                  border: showMenu
                    ? user.role==='admin' ? `2px solid #C084FC` : `2px solid ${T.goldPale}`
                    : user.role==='admin' ? `2px solid rgba(168,85,247,0.5)` : `2px solid rgba(200,169,81,0.4)`,
                  boxShadow: user.role==='admin' ? `0 0 12px rgba(124,58,237,0.4)` : 'none',
                  transition:'border 0.2s' }}>
                {getInitials(user.full_name)}
              </div>
              {showMenu && (
                <div className="umenu">
                  <div style={{ padding:'10px 14px 12px', borderBottom:`1px solid ${T.creamDeep}`, marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div className="jost" style={{ fontWeight:700, fontSize:13, color:T.navy }}>{user.full_name}</div>
                      {user.role==='admin' && (
                        <span className="jost" style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, background:'linear-gradient(135deg,#7C3AED,#A855F7)', color:'#fff', letterSpacing:'1px', textTransform:'uppercase' }}>Admin</span>
                      )}
                    </div>
                    <div className="jost" style={{ fontSize:11, color:T.muted, marginTop:2 }}>{user.email}</div>
                    <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                      {user.is_verified
                        ? <span className="jost" style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'#EEF5EE', color:'#5A8A5A' }}>✓ Verified</span>
                        : <span className="jost" style={{ fontSize:10, color:T.gold, fontWeight:600 }}>⚠️ Verify email</span>
                      }
                    </div>
                  </div>
                  {user.role==='admin' && (
                    <div className="mitem" style={{ color:'#7C3AED', fontWeight:700 }} onClick={() => { setShowMenu(false); navigate('/admin'); }}>
                      👑 Admin Dashboard
                    </div>
                  )}
                  {user.role==='admin' && (
                    <div style={{ margin:'4px 12px 8px', padding:'8px 10px', background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:8 }}>
                      <div className="jost" style={{ fontSize:10, color:'#A855F7', fontWeight:600, letterSpacing:'0.5px' }}>
                        👁️ You're browsing as admin — cart & ordering disabled
                      </div>
                    </div>
                  )}
                  {user.role!=='admin' && <div className="mitem" onClick={() => { setShowMenu(false); navigate('/orders'); }}>📦 My Orders</div>}
                  {user.role!=='admin' && (
                    <div className="mitem" onClick={() => { setShowMenu(false); navigate('/wishlist'); }}>
                      🤍 Wishlist {wishlist.length>0 && <span style={{ marginLeft:'auto', background:T.gold, color:T.navy, borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:800, fontFamily:"'Jost',sans-serif" }}>{wishlist.length}</span>}
                    </div>
                  )}
                  <div style={{ borderTop:`1px solid ${T.creamDeep}`, marginTop:6, paddingTop:6 }}>
                    <div className="mitem danger" onClick={handleLogout}>🚪 Sign Out</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button className="auth-btn" onClick={() => navigate('/login')} style={{ background:'transparent', color:T.goldLight, border:`1px solid rgba(200,169,81,0.45)` }}>Sign In</button>
              <button className="auth-btn" onClick={() => navigate('/register')} style={{ background:T.gold, color:T.navy, border:'none', fontWeight:700 }}>Join Free</button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="hp-mobile-controls">
          <button className="hp-icon-btn" onClick={() => setShowSearch(x => !x)}>⌕</button>
          {user?.role !== 'admin' && (
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => navigate('/cart')}>
              <span style={{ fontSize:20, color:'rgba(255,255,255,0.8)' }}>🛒</span>
              {cartCount > 0 && <span className="jost cbadge" key={cartCount} style={{ position:'absolute', top:-6, right:-6, background:T.gold, color:T.navy, borderRadius:'50%', width:15, height:15, fontSize:8, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>}
            </div>
          )}
          <button className="hp-icon-btn" onClick={() => setMobileMenuOpen(x => !x)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile search bar */}
      {showSearch && (
        <div style={{ background:T.navyMid, padding:'10px 5%', borderBottom:`1px solid rgba(200,169,81,0.15)` }}>
          <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.06)', borderRadius:6, padding:'9px 14px', gap:8, border:`1px solid rgba(200,169,81,0.2)` }}>
            <span style={{ color:`rgba(200,169,81,0.7)`, fontSize:14 }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fashion…" autoFocus
              style={{ background:'none', border:'none', outline:'none', fontSize:14, width:'100%', color:'rgba(255,255,255,0.85)', fontFamily:"'Jost',sans-serif" }}/>
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:`rgba(200,169,81,0.6)`, cursor:'pointer', fontSize:14, padding:0 }}>✕</button>}
          </div>
        </div>
      )}

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div style={{ background:T.navy, borderBottom:`1px solid rgba(200,169,81,0.2)`, padding:'16px 5%', display:'flex', flexDirection:'column', gap:0 }}>
          {user ? (
            <>
              <div style={{ padding:'12px 0', borderBottom:`1px solid rgba(200,169,81,0.1)`, marginBottom:8 }}>
                <div className="jost" style={{ fontWeight:700, fontSize:14, color:'#fff' }}>{user.full_name}</div>
                <div className="jost" style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{user.email}</div>
              </div>
              {[['📦','My Orders','/orders'],['🤍','Wishlist','/wishlist'],['👤','Profile','/profile']].map(([icon,label,path]) => (
                <button key={label} className="hp-menu-item" onClick={() => { navigate(path); setMobileMenuOpen(false); }}>{icon} {label}</button>
              ))}
              {user.role==='admin' && <button className="hp-menu-item" style={{ color:T.gold }} onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>👑 Admin Dashboard</button>}
              <button className="hp-menu-item" style={{ color:'#fca5a5', marginTop:8 }} onClick={handleLogout}>🚪 Sign Out</button>
            </>
          ) : (
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button className="auth-btn" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} style={{ flex:1, background:'transparent', color:T.goldLight, border:`1px solid rgba(200,169,81,0.45)` }}>Sign In</button>
              <button className="auth-btn" onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} style={{ flex:1, background:T.gold, color:T.navy, border:'none', fontWeight:700 }}>Join Free</button>
            </div>
          )}
        </div>
      )}

      {/* ── HERO BANNER ── */}
      <div style={{ padding:'clamp(12px,2vw,28px) 5% 0' }}>
        <div style={{ borderRadius:'clamp(12px,2vw,20px)', overflow:'hidden', position:'relative', height:'clamp(260px,50vw,490px)', background:T.navy }}>
          <img src={b.img} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:bannerFading?0:0.3, transition:'opacity 0.3s ease' }}/>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(105deg,${T.navy} 40%,rgba(13,27,62,0.6) 75%,transparent)` }}/>
          <div className={`banner-content ${bannerFading?'fading':''}`}
            style={{ position:'absolute', inset:0, padding:'0 clamp(20px,5%,60px)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'clamp(10px,2vw,18px)' }}>
              <div style={{ width:20, height:1, background:T.gold }}/>
              <span className="jost" style={{ fontSize:'clamp(8px,1.5vw,10px)', fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>{b.tag}</span>
              <div style={{ width:20, height:1, background:T.gold }}/>
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(26px,5vw,48px)', color:T.white, lineHeight:1.05, whiteSpace:'pre-line', marginBottom:'clamp(10px,2vw,18px)' }}>
              {b.title}
            </h1>
            <p className="jost" style={{ fontSize:'clamp(12px,1.8vw,14px)', color:'rgba(255,255,255,0.6)', marginBottom:'clamp(18px,3vw,36px)', maxWidth:420, lineHeight:1.75, fontWeight:300, display:'block' }}>
              {b.sub}
            </p>
            <button className="banner-cta" style={{ background:T.gold, color:T.navy, width:'fit-content' }}>
              {b.cta} →
            </button>
          </div>
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', gap:8, alignItems:'center' }}>
            {BANNERS.map((_,i) => (
              <div key={i} onClick={() => goToBanner(i)} style={{ width:i===banner?24:5, height:3, borderRadius:2, background:i===banner?T.gold:'rgba(255,255,255,0.25)', cursor:'pointer', transition:'all 0.3s' }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST STRIP ── */}
      <div style={{ padding:'clamp(12px,2vw,20px) 5%' }}>
        <div className="hp-trust-grid">
          {[
            { icon:'🚚', label:'Delivery Fees',    sub:'CBD 100 · Environs 200 · Counties 300' },
            { icon:'🏪', label:'Free Shop Pickup', sub:'Collect at no extra charge'             },
            { icon:'🔒', label:'Secure Checkout',  sub:'M-Pesa & Cards'                         },
            { icon:'↩️', label:'30-Day Returns',   sub:'Hassle-free exchanges'                  },
          ].map(t => (
            <div key={t.label} style={{ background:'#fff', border:`1px solid ${T.creamDeep}`, borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
              <div>
                <div className="jost" style={{ fontWeight:700, fontSize:12, color:T.navy }}>{t.label}</div>
                <div className="jost" style={{ fontSize:10, color:T.muted, marginTop:1 }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div style={{ padding:'4px 5% clamp(20px,3vw,32px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
          <div>
            <div className="ornament">
              <div className="ornament-line"/><div className="ornament-diamond"/>
              <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>Browse Fashion</span>
              <div className="ornament-diamond"/><div className="ornament-line"/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(18px,3vw,26px)', color:T.navy }}>Shop by Category</h2>
          </div>
          <span className="jost" style={{ fontSize:11, color:T.gold, fontWeight:600, cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase', whiteSpace:'nowrap' }}>View All →</span>
        </div>
        <div ref={catScrollRef} className="cat-scroll">
          {CATEGORIES.map(cat => (
            <div key={cat.label} className={`cat-pill ${activeCategory===cat.label?'on':''}`} onClick={() => setCategory(cat.label)}>
              <span style={{ fontSize:16 }}>{cat.icon}</span>
              <div>
                <div className="jost" style={{ fontSize:11, fontWeight:600, color:activeCategory===cat.label?T.goldLight:T.navy, lineHeight:1.2 }}>{cat.label}</div>
                <div className="jost" style={{ fontSize:9, color:activeCategory===cat.label?'rgba(255,255,255,0.5)':T.muted, lineHeight:1.2 }}>{cat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEAL STRIPS ── */}
      <div style={{ padding:'0 5% clamp(20px,3vw,36px)' }}>
        <div className="hp-deal-grid">
          {[
            { label:'Sneaker Drop',     icon:'👟', ends:'02:47:33', accent:T.navy   },
            { label:'Style of the Day', icon:'👗', ends:'08:12:05', accent:T.gold   },
            { label:'Weekend Sale',     icon:'🏷️', ends:'1d 04:22', accent:'#3A6EA8' },
          ].map(d => (
            <div key={d.label} className="deal">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                  background: d.accent===T.gold ? `rgba(200,169,81,0.12)` : d.accent===T.navy ? T.creamMid : '#EEF3FA' }}>
                  {d.icon}
                </div>
                <div>
                  <div className="jost" style={{ fontWeight:700, fontSize:13, color:T.navy }}>{d.label}</div>
                  <div className="jost" style={{ fontSize:11, color:T.muted, marginTop:2 }}>Ends in {d.ends}</div>
                </div>
              </div>
              <span className="jost" style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' as const,
                color: d.accent===T.gold ? T.gold : T.navy }}>Shop →</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div style={{ padding:`0 5% clamp(40px,6vw,80px)` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, gap:12, flexWrap:'wrap' }}>
          <div>
            <div className="ornament">
              <div className="ornament-line"/><div className="ornament-diamond"/>
              <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>
                {activeCategory==='All'?'Curated for You':activeCategory}
              </span>
              <div className="ornament-diamond"/><div className="ornament-line"/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(18px,3vw,26px)', color:T.navy }}>
              {activeCategory==='All'?'Featured Fashion':activeCategory}
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="jost" style={{ fontSize:11, color:T.muted }}>{filtered.length} items</span>
            <select className="jost" style={{ border:`1px solid ${T.creamDeep}`, borderRadius:6, padding:'7px 12px', fontSize:11, color:T.navy, background:'#fff', cursor:'pointer', outline:'none' }}>
              <option>Featured</option>
              <option>Price: Low → High</option>
              <option>Price: High → Low</option>
              <option>Newest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="hp-product-grid">
            {[...Array(8)].map((_,i) => (
              <div key={i} style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${T.creamDeep}` }}>
                <div className="skel" style={{ height:240, borderRadius:0 }}/>
                <div style={{ padding:14, background:'#fff' }}>
                  <div className="skel" style={{ height:12, width:'70%', marginBottom:8 }}/>
                  <div className="skel" style={{ height:10, width:'40%', marginBottom:12 }}/>
                  <div className="skel" style={{ height:34 }}/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>👗</div>
            <p className="jost" style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:8 }}>Nothing here yet</p>
            <p className="jost" style={{ fontSize:13, color:T.muted, marginBottom:24, lineHeight:1.7 }}>
              {search ? `No results for "${search}".` : `We haven't stocked ${activeCategory} yet — check back soon!`}
            </p>
            <button onClick={() => { setActiveCategory('All'); setSearch(''); }} className="jost"
              style={{ background:T.gold, color:T.navy, border:'none', borderRadius:8, padding:'11px 28px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>
              Browse All Fashion →
            </button>
          </div>
        ) : (
          <div className="hp-product-grid">
            {filtered.map(product => {
              const inCart     = cartIds.includes(product.id);
              const inWishlist = wishlist.includes(product.id);
              const stock      = product.stock ?? 0;
              const isNew      = isNewProduct(product.created_at);
              return (
                <div key={product.id} className="pcard">
                  <div className="pimg-wrap" style={{ position:'relative', height:240, overflow:'hidden', background:T.creamMid }}>
                    <Link to={`/product/${product.id}`}>
                      <img src={product.image_url} alt={product.name} className="pimg"
                        onError={e => { (e.target as HTMLImageElement).src=`https://placehold.co/300x240/${T.creamMid.replace('#','')}/${T.navy.replace('#','')}?text=Luku+Prime`; }}/>
                    </Link>
                    {isNew && stock>0 && <div className="new-badge">NEW</div>}
                    {product.category && !isNew && (
                      <div className="jost" style={{ position:'absolute', top:10, left:10, background:T.navy, color:T.gold, borderRadius:3, padding:'3px 8px', fontSize:8, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' }}>{product.category}</div>
                    )}
                    {user?.role !== 'admin' && (
                      <button className="wish" style={{ position:'absolute', top:10, right:10 }} onClick={() => toggleWishlist(product.id)}>
                        {inWishlist?'❤️':'🤍'}
                      </button>
                    )}
                    {stock===0 && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span className="jost" style={{ background:'rgba(255,255,255,0.95)', color:T.navy, fontWeight:700, fontSize:9, padding:'5px 14px', borderRadius:3, letterSpacing:'2px', textTransform:'uppercase' }}>Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'12px 14px 14px' }}>
                    <Link to={`/product/${product.id}`}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:14, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:6 }}>{product.name}</div>
                    </Link>
                    <div style={{ marginBottom:8 }}>
                      {stock===0 ? <span className="jost" style={{ fontSize:9, fontWeight:700, color:'#C0392B', background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:3, padding:'2px 7px' }}>Out of stock</span>
                        : stock<=5 ? <span className="jost" style={{ fontSize:9, fontWeight:700, color:'#8A6A20', background:`rgba(200,169,81,0.1)`, border:`1px solid rgba(200,169,81,0.3)`, borderRadius:3, padding:'2px 7px' }}>⚠ Only {stock} left</span>
                        : <span className="jost" style={{ fontSize:9, fontWeight:600, color:'#4A7A4A', background:'#EEF3EE', border:'1px solid #C8DFC8', borderRadius:3, padding:'2px 7px' }}>✓ In Stock</span>
                      }
                    </div>
                    <div className="jost" style={{ fontWeight:700, fontSize:15, color:T.navy, marginBottom:10 }}>
                      KSh {Number(product.price).toLocaleString()}
                    </div>
                    {user?.role === 'admin' ? (
                      <button className="add-btn"
                        onClick={() => navigate(`/product/${product.id}`)}
                        style={{ background:T.navyLight, color:'rgba(255,255,255,0.85)', border:'none' }}>
                        👁️ View Details
                      </button>
                    ) : (
                      <button className="add-btn" disabled={stock===0} onClick={() => stock>0 && toggleCart(product.id)}
                        style={{ background:stock===0?T.creamMid:inCart?'#FDF0EE':T.gold, color:stock===0?T.muted:inCart?'#C0392B':T.navy, border:inCart?'1.5px solid #F5C6C0':'none' }}>
                        {stock===0?'Sold Out':inCart?'✕ Remove':'Add to Cart'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background:T.navy, borderTop:`1px solid rgba(200,169,81,0.2)` }}>
        <div style={{ height:2, background:`linear-gradient(90deg,transparent 0%,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent 100%)` }}/>

        {/* ── Social strip ── */}
        <div style={{ borderBottom:`1px solid rgba(200,169,81,0.12)`, padding:'28px 5%' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:32, height:1, background:`rgba(200,169,81,0.4)` }}/>
              <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:`rgba(200,169,81,0.6)`, textTransform:'uppercase' }}>Follow Us</span>
              <div style={{ width:32, height:1, background:`rgba(200,169,81,0.4)` }}/>
            </div>
            <p className="jost" style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:300, textAlign:'center', letterSpacing:'0.3px' }}>
              Stay in the loop — new drops, style inspo & exclusive deals
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
              {SOCIAL.map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill"
                  style={{ '--social-hover-bg': s.hoverBg, '--social-color': s.color } as React.CSSProperties}
                >
                  <span className="social-icon" style={{ color: s.color }}>
                    {s.icon}
                  </span>
                  <div>
                    <div className="jost" style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.3px' }}>{s.name}</div>
                    <div className="jost" style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1 }}>{s.label}</div>
                  </div>
                  <span className="jost" style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.3)', letterSpacing:'0.5px' }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ padding:'clamp(20px,3vw,30px) 5%', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <img src={logo} alt="Luku Prime" style={{ height:44, objectFit:'contain' }}/>
          <div style={{ textAlign:'center' }}>
            <div className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:`rgba(200,169,81,0.7)`, textTransform:'uppercase', marginBottom:4 }}>Dress the Finest</div>
            <div className="jost" style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>© 2025 Luku Prime · All rights reserved</div>
          </div>
          <div style={{ display:'flex', gap:18 }}>
            {['Privacy','Terms','Help'].map(l => (
              <span key={l} className="jost" style={{ cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:11, letterSpacing:'1px', textTransform:'uppercase', transition:'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color=T.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.35)')}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#F9F5EC}
  .jost{font-family:'Jost',sans-serif}
  a{text-decoration:none;color:inherit}

  .hp-marquee{display:flex;gap:56px;animation:marquee 32s linear infinite;white-space:nowrap}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

  .nav-link{font-family:'Jost',sans-serif;font-size:12px;font-weight:500;color:rgba(255,255,255,0.7);cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;transition:color 0.2s;padding:4px 0;position:relative}
  .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#C8A951;transition:width 0.25s}
  .nav-link:hover{color:#DEC06A}
  .nav-link:hover::after{width:100%}

  .banner-cta{font-family:'Jost',sans-serif;font-weight:700;font-size:10px;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;padding:12px 28px;transition:all 0.3s;border-radius:3px}
  .banner-cta:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(200,169,81,0.4)}
  .banner-content{transition:opacity 0.3s ease}
  .banner-content.fading{opacity:0}

  .cat-scroll{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scroll-behavior:smooth}
  .cat-scroll::-webkit-scrollbar{height:3px}
  .cat-scroll::-webkit-scrollbar-thumb{background:#E4D9C0;border-radius:2px}
  .cat-pill{cursor:pointer;transition:all 0.2s;border:1.5px solid #E4D9C0;background:#fff;border-radius:50px;padding:8px 16px;white-space:nowrap;display:flex;align-items:center;gap:8px;flex-shrink:0}
  .cat-pill:hover{border-color:#C8A951;transform:translateY(-1px)}
  .cat-pill.on{border-color:#C8A951;background:#0D1B3E;color:#fff}

  .pcard{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E4D9C0;transition:all 0.3s;cursor:pointer}
  .pcard:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(13,27,62,0.13);border-color:#C8A951}
  .pcard:hover .pimg{transform:scale(1.05)}
  .pimg{transition:transform 0.5s ease;width:100%;height:100%;object-fit:cover}

  .add-btn{font-family:'Jost',sans-serif;font-weight:600;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:8px;padding:10px;width:100%;cursor:pointer;transition:all 0.2s}
  .add-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
  .add-btn:disabled{cursor:not-allowed}
  .wish{border:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;transition:transform 0.2s;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px)}
  .wish:hover{transform:scale(1.2)}

  .new-badge{position:absolute;top:10px;left:10px;background:#C8A951;color:#0D1B3E;font-family:'Jost',sans-serif;font-size:8px;font-weight:800;letter-spacing:2px;padding:3px 8px;border-radius:3px;text-transform:uppercase;z-index:2}

  .auth-btn{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px;padding:8px 18px;cursor:pointer;transition:all 0.2s}
  .auth-btn:hover{transform:translateY(-1px)}

  .umenu{position:absolute;top:calc(100% + 10px);right:0;background:#fff;border:1px solid #E4D9C0;border-radius:14px;padding:8px;min-width:220px;box-shadow:0 24px 60px rgba(13,27,62,0.16);animation:mIn 0.18s ease;z-index:200}
  @keyframes mIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .mitem{font-family:'Jost',sans-serif;font-size:13px;font-weight:500;padding:9px 12px;border-radius:9px;cursor:pointer;color:#0D1B3E;transition:background 0.15s;display:flex;align-items:center;gap:10px}
  .mitem:hover{background:#F9F5EC}
  .mitem.danger{color:#C0392B}
  .mitem.danger:hover{background:#FDF0EE}

  .ornament{display:flex;align-items:center;gap:12px;margin-bottom:6px}
  .ornament-line{flex:0 0 28px;height:1px;background:#C8A951}
  .ornament-diamond{width:4px;height:4px;background:#C8A951;transform:rotate(45deg);flex-shrink:0}

  .skel{background:linear-gradient(90deg,#F0EAD8 25%,#F9F5EC 50%,#F0EAD8 75%);background-size:200% 100%;animation:sk 1.4s infinite;border-radius:6px}
  @keyframes sk{0%{background-position:-200% 0}100%{background-position:200% 0}}

  .cbadge{animation:pop .3s ease}
  @keyframes pop{50%{transform:scale(1.5)}}

  /* ── Deal strip ── */
  .hp-deal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
  .deal{border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border:1px solid #E4D9C0;background:#fff;transition:all 0.2s;cursor:pointer}
  .deal:hover{border-color:#C8A951;transform:translateY(-2px);box-shadow:0 8px 20px rgba(13,27,62,0.08)}

  /* ── Mobile icon buttons ── */
  .hp-icon-btn{background:none;border:none;cursor:pointer;font-size:20px;color:rgba(255,255,255,0.8);padding:4px;line-height:1;transition:color 0.2s}
  .hp-icon-btn:hover{color:#C8A951}

  /* ── Mobile menu items ── */
  .hp-menu-item{background:none;border:none;cursor:pointer;font-family:'Jost',sans-serif;font-size:14px;font-weight:500;color:rgba(255,255,255,0.75);padding:12px 0;text-align:left;width:100%;border-bottom:1px solid rgba(200,169,81,0.08);transition:color 0.2s;display:flex;align-items:center;gap:10px}
  .hp-menu-item:hover{color:#C8A951}
  .hp-menu-item:last-child{border-bottom:none}

  /* ── Social pills ── */
  .social-pill{
    display:flex;align-items:center;gap:12px;
    padding:12px 18px;border-radius:12px;
    border:1px solid rgba(255,255,255,0.1);
    background:rgba(255,255,255,0.04);
    min-width:220px;
    transition:all 0.22s;
    cursor:pointer;
    text-decoration:none;
  }
  .social-pill:hover{
    background:var(--social-hover-bg);
    border-color:rgba(255,255,255,0.2);
    transform:translateY(-2px);
    box-shadow:0 8px 24px rgba(0,0,0,0.2);
  }
  .social-icon{display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.22s}
  .social-pill:hover .social-icon{transform:scale(1.15)}

  /* ── Responsive grids ── */
  .hp-trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .hp-product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}

  /* Desktop nav elements — hidden on mobile */
  .hp-search-desktop{display:flex}
  .hp-nav-right{display:flex}
  .hp-mobile-controls{display:none}

  /* ── MOBILE BREAKPOINT ── */
  @media(max-width:768px){
    .hp-search-desktop{display:none !important}
    .hp-nav-right{display:none !important}
    .hp-mobile-controls{display:flex !important;align-items:center;gap:14px}

    .hp-trust-grid{grid-template-columns:repeat(2,1fr)}
    .hp-deal-grid{grid-template-columns:1fr;gap:8px}
    .hp-product-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px}

    .pimg-wrap{height:175px !important}
    .pcard > div:last-child{padding:10px 10px 12px !important}
    .pcard > div:last-child > a > div{font-size:12px !important}

    .umenu{right:auto;left:0;min-width:200px}

    /* Social pills: full width on mobile */
    .social-pill{min-width:0;width:100%}
  }

  @media(max-width:360px){
    .hp-product-grid{gap:8px !important}
  }
`;