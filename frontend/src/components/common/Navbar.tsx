// src/components/common/Navbar.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation }  from 'react-router-dom';
import axios            from 'axios';
import { ANNOUNCEMENTS, getInitials, readUser } from '../../constants/theme';
import type { User } from '../../constants/theme';

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
  onLogout?: () => void;
  categories?: string[];
  activeCategory?: string;
  onCategorySelect?: (cat: string) => void;
  transparentOnTop?: boolean;
}

export default function Navbar({
  cartCount: cartCountProp,
  wishlistCount: wishlistCountProp,
  onLogout,
  categories = [],
  activeCategory = 'All',
  onCategorySelect,
  transparentOnTop = true,
}: NavbarProps) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const menuRef     = useRef<HTMLDivElement>(null);
  const shopMenuRef = useRef<HTMLDivElement>(null);

  const [user,           setUser]           = useState<User | null>(readUser);
  const [showMenu,       setShowMenu]       = useState(false);
  const [showShopMenu,   setShowShopMenu]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [cartCount,      setCartCount]      = useState(cartCountProp ?? 0);
  const [wishlistCount,  setWishlistCount]  = useState(wishlistCountProp ?? 0);
  const [navCategories,  setNavCategories]  = useState<string[]>(categories);

  const [lang, setLang] = useState(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (!match) return 'EN';
    const LANGS_MAP: Record<string,string> = { sw:'SW', fr:'FR', ar:'AR', 'zh-CN':'ZH' };
    return LANGS_MAP[match[1]] || 'EN';
  });
  const [showLang,       setShowLang]       = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const langRef          = useRef<HTMLDivElement>(null);

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!transparentOnTop) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentOnTop]);

  // Transparent ONLY on homepage: prop enabled, on home route, not scrolled, no overlays open
  const isOnHomepage = location.pathname === '/';
  const isTransparent = transparentOnTop && isOnHomepage && !scrolled && !mobileMenuOpen && !showSearch && !showMenu;

  // ── Outside-click closers ─────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target as Node)) setShowShopMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Re-read user from localStorage when AuthPopup (or any tab) updates it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') setUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Also poll on window focus (same-tab logins don't fire storage events)
  useEffect(() => {
    const onFocus = () => setUser(readUser());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => { if (cartCountProp     !== undefined) setCartCount(cartCountProp);         }, [cartCountProp]);
  useEffect(() => { if (wishlistCountProp !== undefined) setWishlistCount(wishlistCountProp); }, [wishlistCountProp]);

  useEffect(() => {
    if (categories.length > 0) { setNavCategories(categories); return; }
    axios.get('/api/products')
      .then(res => {
        const cats = Array.from(
          new Set((res.data as any[]).map((p: any) => p.category).filter(Boolean))
        ).sort() as string[];
        setNavCategories(cats);
      }).catch(() => {});
  }, [categories.length]);

  const fetchCounts = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role === 'admin') return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    axios.get('/api/cart',     h).then(r => setCartCount(r.data.reduce((s: number, i: any) => s + i.quantity, 0))).catch(() => {});
    axios.get('/api/wishlist', h).then(r => setWishlistCount(r.data.length)).catch(() => {});
  }, [user?.id]);

  useEffect(() => { if (cartCountProp === undefined) fetchCounts(); }, [fetchCounts, cartCountProp]);
  useEffect(() => {
    window.addEventListener('focus', fetchCounts);
    return () => window.removeEventListener('focus', fetchCounts);
  }, [fetchCounts]);

  // Load Google Translate once
  useEffect(() => {
    if (document.querySelector('script[data-gt]')) return;
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: 'en', layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE },
        'google_translate_element'
      );
    };
    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.setAttribute('data-gt', 'true');
    document.body.appendChild(s);
  }, []);

  const LANGS = [
    { code: 'EN', label: 'English',   gtCode: '',      flag: '🇬🇧' },
    { code: 'SW', label: 'Kiswahili', gtCode: 'sw',    flag: '🇰🇪' },
    { code: 'FR', label: 'Français',  gtCode: 'fr',    flag: '🇫🇷' },
    { code: 'AR', label: 'العربية',   gtCode: 'ar',    flag: '🇸🇦' },
    { code: 'ZH', label: '中文',       gtCode: 'zh-CN', flag: '🇨🇳' },
  ];

  const applyLang = (gtCode: string, code: string) => {
    setLang(code); setShowLang(false);
    if (!gtCode) {
      // Reset to English — remove the GT cookie and reload
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      window.location.reload();
      return;
    }
    const val = '/en/' + gtCode;
    document.cookie = 'googtrans=' + val + '; path=/';
    document.cookie = 'googtrans=' + val + '; path=/; domain=' + window.location.hostname;
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); setCartCount(0); setWishlistCount(0);
    setShowMenu(false); setMobileMenuOpen(false);
    onLogout?.();
    navigate('/');
  };

  const go = (path: string) => { navigate(path); setShowMenu(false); setMobileMenuOpen(false); };

  const categorySlugMap: Record<string, string> = {
    'Dresses': 'dresses', 'New Arrivals': 'new-arrivals', 'Sneakers': 'sneakers',
    'Bags': 'bags', 'Best Sellers': 'best-sellers', 'Designer Wear': 'designer-wear',
    'Shoes': 'shoes', 'Heels': 'heels',
  };

  const goCategory = (cat: string) => {
    onCategorySelect?.(cat);
    if (cat === 'All') navigate('/');
    else {
      const slug = categorySlugMap[cat] ?? cat.toLowerCase().replace(/\s+/g, '-');
      navigate(`/categories/${slug}`);
    }
    setShowShopMenu(false);
    setMobileMenuOpen(false);
  };

  // ── Colour tokens ─────────────────────────────────────────────────────────
  const ink       = isTransparent ? '#fff'                  : '#111';
  const inkFaint  = isTransparent ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';
  const badgeBg   = isTransparent ? 'rgba(255,255,255,0.9)' : '#111';
  const badgeFg   = isTransparent ? '#111'                  : '#fff';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        .nav-link {
          font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400;
          letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; text-decoration: none; position: relative;
          transition: opacity 0.2s, color 0.3s;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0;
          width: 0; height: 1px; transition: width 0.25s ease;
        }
        .nav-link:hover::after { width: 100%; }
        .nav-link:hover { opacity: 0.6; }

        .nav-icon-btn {
          background: none; border: none; cursor: pointer; padding: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s;
        }
        .nav-icon-btn:hover { opacity: 0.5; }

        .mitem {
          display: flex; align-items: center; gap: 8px; padding: 9px 14px;
          font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1px;
          color: #333; cursor: pointer; border-radius: 8px; transition: background 0.15s;
          width: 100%; background: none; border: none; text-align: left;
        }
        .mitem:hover { background: rgba(0,0,0,0.04); }
        .mitem-danger { color: #dc2626; }
        .mitem-danger:hover { background: rgba(220,38,38,0.06); }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Announcement marquee ── */}
      <div style={{ background: '#000', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 101 }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '3px', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
          Get 10% off on your first order
        </span>
      </div>

      {/* ── Main navbar ── */}
      <nav style={{
        position: 'fixed', top: 32, left: 0, right: 0, zIndex: 100,
        background: isTransparent ? 'transparent' : '#fff',
        borderBottom: isTransparent ? 'none' : '1px solid rgba(0,0,0,0.09)',
        transition: 'background 0.4s ease, border-color 0.4s ease',
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
      }}>

        <div style={{ padding: '0 5%', height: 64, display: 'flex', alignItems: 'center', position: 'relative' }}>

          {/* ── LEFT ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Desktop: Shop dropdown + nav links */}
            <div className="hidden md:flex items-center gap-8">
              {navCategories.length > 0 ? (
                <div ref={shopMenuRef} style={{ position: 'relative' }}>
                  <span className="nav-link flex items-center gap-1" style={{ color: ink }}
                    onClick={() => setShowShopMenu(s => !s)}>
                    Shop
                    <svg width="7" height="4" viewBox="0 0 7 4" fill="none"
                      style={{ transition: 'transform 0.2s', transform: showShopMenu ? 'rotate(180deg)' : 'none' }}>
                      <path d="M1 1l2.5 2L6 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {showShopMenu && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 16px)', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 8, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, animation: 'fadeInDown 0.15s ease' }}>
                      <button className="mitem" style={{ fontWeight: activeCategory === 'All' ? 600 : undefined }} onClick={() => goCategory('All')}>
                        All Products {activeCategory === 'All' && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
                      </button>
                      <div style={{ margin: '4px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }} />
                      {navCategories.map(cat => (
                        <button key={cat} className="mitem" style={{ fontWeight: activeCategory === cat ? 600 : undefined }} onClick={() => goCategory(cat)}>
                          {cat} {activeCategory === cat && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="nav-link" style={{ color: ink }} onClick={() => navigate('/')}>Shop</span>
              )}
              <span className="nav-link" style={{ color: ink }} onClick={() => navigate('/members-club')}>Members Club</span>
              <span className="nav-link" style={{ color: ink }} onClick={() => navigate('/sale')}>Sale</span>
            </div>

            {/* Mobile: hamburger THEN lang */}
            <div className="flex md:hidden" style={{ alignItems: 'center', gap: 6 }}>
            <div>
              <button className="nav-icon-btn" style={{ color: ink }} onClick={() => setMobileMenuOpen(x => !x)}>
                {mobileMenuOpen
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                }
              </button>
            </div>

              {/* Mobile lang picker — after hamburger */}
              <div ref={langRef} style={{ position: 'relative' }}>
                <button
                  className="nav-icon-btn"
                  style={{ color: ink, fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px' }}
                  onClick={() => setShowLang(x => !x)}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{LANGS.find(l => l.code === lang)?.flag ?? '🌐'}</span>
                  <svg width="6" height="4" viewBox="0 0 6 4" fill="none">
                    <path d="M1 1l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showLang && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 6, minWidth: 148, boxShadow: '0 8px 28px rgba(0,0,0,0.11)', zIndex: 300, animation: 'fadeInDown 0.15s ease' }}>
                    {LANGS.map(l => (
                      <button key={l.code} className="mitem" style={{ fontWeight: lang === l.code ? 600 : undefined, fontSize: 12 }} onClick={() => applyLang(l.gtCode, l.code)}>
                        <span style={{ fontSize: 18, lineHeight: 1, minWidth: 24 }}>{l.flag}</span>
                        {l.label}
                        {lang === l.code && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CENTER: Brand ── */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/')}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, letterSpacing: '6px', textTransform: 'uppercase', color: ink, lineHeight: 1, transition: 'color 0.4s ease' }}>
              Luku Prime
            </span>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>

            {/* ── Language picker ── */}
            <div ref={langRef} className="hidden md:block" style={{ position: 'relative' }}>
              <button
                className="nav-icon-btn"
                style={{ color: ink, fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px' }}
                onClick={() => setShowLang(x => !x)}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{LANGS.find(l => l.code === lang)?.flag ?? '🌐'}</span>
                <svg width="6" height="4" viewBox="0 0 6 4" fill="none" style={{ transition: 'transform 0.2s', transform: showLang ? 'rotate(180deg)' : 'none' }}>
                  <path d="M1 1l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showLang && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: 6, minWidth: 148, boxShadow: '0 8px 28px rgba(0,0,0,0.11)', zIndex: 200, animation: 'fadeInDown 0.15s ease' }}>
                  {LANGS.map(l => (
                    <button key={l.code} className="mitem" style={{ fontWeight: lang === l.code ? 600 : undefined, fontSize: 12 }} onClick={() => applyLang(l.gtCode, l.code)}>
                      <span style={{ opacity: 0.45, fontSize: 10, fontWeight: 700, letterSpacing: '1px', minWidth: 24 }}>{l.code}</span>
                      {l.label}
                      {lang === l.code && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Hidden GT element (required by the script) */}
            <div id="google_translate_element" style={{ display: 'none' }} />

            {/* Desktop search */}
            <button className="nav-icon-btn hidden md:flex" style={{ color: ink }} onClick={() => setShowSearch(x => !x)} title="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Wishlist — desktop only */}
            {user?.role !== 'admin' && (
              <button className="nav-icon-btn relative hidden md:flex" style={{ color: ink }} onClick={() => navigate('/wishlist')} title="Wishlist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: badgeBg, color: badgeFg, borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", transition: 'background 0.3s, color 0.3s' }}>
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart — desktop + mobile */}
            {user?.role !== 'admin' && (
              <button className="nav-icon-btn relative" style={{ color: ink }} onClick={() => navigate('/cart')} title="Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span key={cartCount} style={{ position: 'absolute', top: -4, right: -4, background: badgeBg, color: badgeFg, borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif", transition: 'background 0.3s, color 0.3s' }}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile avatar / auth */}
            {user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowMenu(s => !s)}
                  title={user.full_name}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', userSelect: 'none',
                    background: user.role === 'admin' ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : (isTransparent ? 'rgba(255,255,255,0.2)' : '#111'),
                    color: '#fff',
                    fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '1px',
                    border: showMenu
                      ? (isTransparent ? '2px solid rgba(255,255,255,0.8)' : '2px solid #555')
                      : (isTransparent ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent'),
                    transition: 'background 0.3s, border-color 0.3s',
                  }}
                >
                  {getInitials(user.full_name)}
                </div>

                {showMenu && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12, padding: 8, minWidth: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, animation: 'fadeInDown 0.15s ease' }}>
                    {/* User header */}
                    <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: '#111' }}>{user.full_name}</span>
                        {user.role === 'admin' && (
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin</span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{user.email}</div>
                    </div>

                    {/* Admin */}
                    {user.role === 'admin' && (
                      <>
                        <button className="mitem" style={{ color: '#7C3AED', fontWeight: 600 }} onClick={() => go('/admin')}>Admin Dashboard</button>
                        <div style={{ margin: '6px 12px', padding: '8px 10px', borderRadius: 8, background: '#faf5ff', border: '1px solid #ede9fe' }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: '#9333ea' }}>Browsing as admin — cart disabled</span>
                        </div>
                      </>
                    )}

                    {/* Regular user account actions only */}
                    {user.role !== 'admin' && (
                      <>
                        <button className="mitem" onClick={() => go('/orders')}>My Orders</button>
                        <button className="mitem" onClick={() => go('/wishlist')}>
                          Wishlist
                          {wishlistCount > 0 && <span style={{ marginLeft: 'auto', background: '#111', color: '#fff', borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 700, fontFamily: "'Jost', sans-serif" }}>{wishlistCount}</span>}
                        </button>
                        <button className="mitem" onClick={() => go('/reviews')}>My Reviews</button>
                      </>
                    )}

                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 6, paddingTop: 6 }}>
                      <button className="mitem mitem-danger" onClick={handleLogout}>Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="nav-link hidden md:block" style={{ color: ink }} onClick={() => navigate('/login')}>Sign In</span>
                <button onClick={() => navigate('/register')}
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', padding: '8px 16px', background: isTransparent ? 'rgba(255,255,255,0.15)' : '#111', color: '#fff', border: isTransparent ? '1px solid rgba(255,255,255,0.4)' : 'none', cursor: 'pointer', transition: 'opacity 0.2s, background 0.3s', backdropFilter: isTransparent ? 'blur(4px)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Search bar (desktop) ── */}
      {showSearch && (
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.09)', padding: '12px 5%', position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 520, margin: '0 auto', borderBottom: '1px solid rgba(0,0,0,0.18)', paddingBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(0,0,0,0.35)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/?search=${search}`)}
              placeholder="Search Luku Prime…"
              autoFocus
              style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, letterSpacing: '1px', background: 'transparent', border: 'none', outline: 'none', flex: 1, color: '#111' }}
            />
            {search && <button onClick={() => setSearch('')} className="nav-icon-btn" style={{ color: 'rgba(0,0,0,0.3)', fontSize: 12 }}>✕</button>}
          </div>
        </div>
      )}

      {/* ── Mobile category menu (hamburger) — categories only ── */}
      {mobileMenuOpen && (
        <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.09)', padding: '16px 5%', position: 'fixed', top: 96, left: 0, right: 0, zIndex: 99 }}>

          {/* ── Top row: Home + Members Club side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              style={{
                fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600,
                letterSpacing: '2px', textTransform: 'uppercase',
                padding: '13px 10px', background: '#0A0A0A', color: '#fff',
                border: 'none', cursor: 'pointer', textAlign: 'center',
              }}
            >
              Home
            </button>
            <button
              onClick={() => { navigate('/members-club'); setMobileMenuOpen(false); }}
              style={{
                fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600,
                letterSpacing: '2px', textTransform: 'uppercase',
                padding: '13px 10px', background: 'transparent', color: '#111',
                border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', textAlign: 'center',
              }}
            >
              Members Club
            </button>
          </div>

          {/* ── Categories label ── */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)' }}>Shop by Category</span>
          </div>

          {/* ── All Products ── */}
          <button
            className="mitem"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', borderRadius: 0, padding: '11px 14px', fontWeight: activeCategory === 'All' ? 600 : undefined }}
            onClick={() => goCategory('All')}
          >
            All Products {activeCategory === 'All' && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
          </button>

          {/* ── Category list ── */}
          {navCategories.map(cat => (
            <button
              key={cat}
              className="mitem"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', borderRadius: 0, padding: '11px 14px', fontWeight: activeCategory === cat ? 600 : undefined }}
              onClick={() => goCategory(cat)}
            >
              {cat} {activeCategory === cat && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>✓</span>}
            </button>
          ))}

          {/* ── Visual category scroller ── */}
          {(() => {
            const CAT_IMAGES: Record<string, { img: string; label: string }> = {
              'Dresses':       { img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&q=80', label: 'Dresses' },
              'Sneakers':      { img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80', label: 'Sneakers' },
              'Bags':          { img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&q=80', label: 'Bags' },
              'Heels':         { img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80', label: 'Heels' },
              'Shoes':         { img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&q=80', label: 'Shoes' },
              'New Arrivals':  { img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=80', label: 'New In' },
              'Best Sellers':  { img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80', label: 'Best Sellers' },
              'Designer Wear': { img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80', label: 'Designer' },
            };
            const tiles = [
              { slug: 'All', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80', label: 'All' },
              ...navCategories.map(cat => ({
                slug: cat,
                img: CAT_IMAGES[cat]?.img ?? 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80',
                label: CAT_IMAGES[cat]?.label ?? cat,
              })),
            ];
            return (
              <div style={{ marginTop: 14, marginBottom: 2 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)' }}>Browse</span>
                </div>
                <div style={{
                  display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
                  scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any,
                }}>
                  {tiles.map(tile => (
                    <div
                      key={tile.slug}
                      onClick={() => goCategory(tile.slug)}
                      style={{
                        flexShrink: 0, width: 80, cursor: 'pointer',
                        outline: activeCategory === tile.slug ? '2px solid #111' : 'none',
                        outlineOffset: 2,
                      }}
                    >
                      <div style={{ width: 80, height: 96, overflow: 'hidden', position: 'relative', background: '#f0f0f0' }}>
                        <img
                          src={tile.img}
                          alt={tile.label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.78)' }}
                          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x96/f0f0f0/999?text=LP'; }}
                        />
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 55%)',
                        }} />
                        <span style={{
                          position: 'absolute', bottom: 6, left: 0, right: 0,
                          textAlign: 'center',
                          fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 700,
                          letterSpacing: '1.5px', textTransform: 'uppercase', color: '#fff',
                          lineHeight: 1.2, padding: '0 4px',
                        }}>
                          {tile.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Sign in / join for guests */}
          {!user && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <button onClick={() => go('/login')}
                style={{ flex: 1, fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', padding: 10, background: 'transparent', color: '#111', border: '1px solid rgba(0,0,0,0.25)', cursor: 'pointer' }}>
                Sign In
              </button>
              <button onClick={() => go('/register')}
                style={{ flex: 1, fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', padding: 10, background: '#111', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Join Free
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}