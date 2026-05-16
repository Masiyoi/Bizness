// src/components/common/Navbar.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import axios            from 'axios';
import logo             from '../../assets/logo.png';
import { T, ANNOUNCEMENTS, getInitials, readUser } from '../../constants/theme';
import type { User } from '../../constants/theme';

interface NavbarProps {
  /** Lift cart count up if the parent already manages it, otherwise Navbar fetches it */
  cartCount?: number;
  wishlistCount?: number;
  onLogout?: () => void;
}

export default function Navbar({ cartCount: cartCountProp, wishlistCount: wishlistCountProp, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const menuRef  = useRef<HTMLDivElement>(null);

  const [user,           setUser]           = useState<User | null>(readUser);
  const [showMenu,       setShowMenu]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [cartCount,      setCartCount]      = useState(cartCountProp ?? 0);
  const [wishlistCount,  setWishlistCount]  = useState(wishlistCountProp ?? 0);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync props if parent passes updated counts
  useEffect(() => { if (cartCountProp      !== undefined) setCartCount(cartCountProp);      }, [cartCountProp]);
  useEffect(() => { if (wishlistCountProp  !== undefined) setWishlistCount(wishlistCountProp); }, [wishlistCountProp]);

  // Self-fetch counts when no prop is provided
  const fetchCounts = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role === 'admin') return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    axios.get('/api/cart',     h).then(r => setCartCount(r.data.reduce((s: number, i: any) => s + i.quantity, 0))).catch(() => {});
    axios.get('/api/wishlist', h).then(r => setWishlistCount(r.data.length)).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (cartCountProp === undefined) fetchCounts();
  }, [fetchCounts, cartCountProp]);

  useEffect(() => {
    window.addEventListener('focus', fetchCounts);
    return () => window.removeEventListener('focus', fetchCounts);
  }, [fetchCounts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setShowMenu(false);
    setMobileMenuOpen(false);
    onLogout?.();
    navigate('/');
  };

  const go = (path: string) => { navigate(path); setShowMenu(false); setMobileMenuOpen(false); };

  return (
    <>
      {/* ── Announcement marquee ── */}
      <div className="bg-navy h-8 overflow-hidden flex items-center border-b border-gold/20">
        <div className="overflow-hidden w-full">
          <div className="flex gap-14 animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, r) =>
              ANNOUNCEMENTS.map((t, i) => (
                <span key={`${r}-${i}`} className="font-sans text-[9px] font-semibold tracking-[2px] text-gold/85">
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <nav
        className="bg-navy px-[5%] h-[70px] flex items-center justify-between sticky top-0 z-[100] shadow-nav border-b border-gold/25"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
     {/* Logo + Brand Name */}
<div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
  <img
    src={logo} alt="Luku Prime"
    className="h-[54px] w-auto object-contain drop-shadow-md"
  />
  <div className="flex flex-col leading-tight">
    <span
      className="text-gold font-bold tracking-[2px] uppercase text-[15px]"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      Luku Prime
    </span>
    <span className="text-white/40 font-sans text-[8px] tracking-[3px] uppercase">
      Walk prime Live Prime
    </span>
  </div>
</div>

        {/* Desktop search */}
        <div className="hidden md:flex items-center bg-white/[0.06] rounded border border-gold/20 px-3.5 py-2 gap-2 w-[300px]">
          <span className="text-gold/70 text-[13px]">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/?search=${search}`)}
            placeholder="Search Luku Prime fashion…"
            className="bg-transparent border-none outline-none text-[13px] w-full text-white/85 font-sans placeholder:text-white/30"
          />
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-5">
          <span className="nav-link" onClick={() => navigate('/new-drops')}>New Drops</span>
          <span className="nav-link" onClick={() => navigate('/sale')}>Sale</span>

          {/* Cart icon */}
          {user?.role !== 'admin' && (
            <div className="relative cursor-pointer text-white/75 text-lg" onClick={() => navigate('/cart')}>
              🛒
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="absolute -top-1.5 -right-2 bg-gold text-navy rounded-full w-4 h-4 text-[9px] font-extrabold font-sans flex items-center justify-center animate-pop"
                >
                  {cartCount}
                </span>
              )}
            </div>
          )}

          {/* User avatar / auth buttons */}
          {user ? (
            <div ref={menuRef} className="relative">
              <div
                onClick={() => setShowMenu(s => !s)}
                title={user.full_name}
                className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[12px] cursor-pointer font-sans select-none transition-all duration-200"
                style={{
                  background: user.role === 'admin'
                    ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                    : `linear-gradient(135deg,${T.gold},${T.goldLight})`,
                  color:      user.role === 'admin' ? '#fff' : T.navy,
                  border:     showMenu
                    ? user.role === 'admin' ? '2px solid #C084FC' : `2px solid ${T.goldPale}`
                    : user.role === 'admin' ? '2px solid rgba(168,85,247,0.5)' : `2px solid rgba(200,169,81,0.4)`,
                  boxShadow: user.role === 'admin' ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                {getInitials(user.full_name)}
              </div>

              {/* Dropdown */}
              {showMenu && (
                <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-cream-deep rounded-[14px] p-2 min-w-[220px] shadow-modal animate-modal-in z-[200]">
                  {/* User info */}
                  <div className="px-3.5 py-2.5 border-b border-cream-deep mb-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans font-bold text-[13px] text-navy">{user.full_name}</span>
                      {user.role === 'admin' && (
                        <span className="font-sans text-[9px] font-extrabold px-2 py-0.5 rounded-full text-white tracking-[1px] uppercase"
                          style={{ background:'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="font-sans text-[11px] text-muted">{user.email}</div>
                    <div className="mt-1.5">
                      {user.is_verified
                        ? <span className="font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF5EE] text-[#5A8A5A]">✓ Verified</span>
                        : <span className="font-sans text-[10px] font-semibold text-gold">⚠️ Verify email</span>
                      }
                    </div>
                  </div>

                  {/* Admin notice */}
                  {user.role === 'admin' && (
                    <>
                      <div className="mitem text-purple-600 font-bold" onClick={() => go('/admin')}>👑 Admin Dashboard</div>
                      <div className="mx-3 my-1.5 px-2.5 py-2 rounded-lg bg-purple-50 border border-purple-200">
                        <span className="font-sans text-[10px] text-purple-500 font-semibold">
                          👁️ Browsing as admin — cart & ordering disabled
                        </span>
                      </div>
                    </>
                  )}

                  {/* Buyer links */}
                  {user.role !== 'admin' && (
                    <>
                      <div className="mitem" onClick={() => go('/orders')}>📦 My Orders</div>
                      <div className="mitem" onClick={() => go('/wishlist')}>
                        🤍 Wishlist
                        {wishlistCount > 0 && (
                          <span className="ml-auto bg-gold text-navy rounded-[10px] px-1.5 py-px text-[10px] font-extrabold font-sans">
                            {wishlistCount}
                          </span>
                        )}
                      </div>
                      <div className="mitem" onClick={() => go('/reviews')}>⭐ My Reviews</div>
                    </>
                  )}

                  <div className="border-t border-cream-deep mt-1.5 pt-1.5">
                    <div className="mitem mitem-danger" onClick={handleLogout}>🚪 Sign Out</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => navigate('/login')}
                className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase rounded border border-gold/45 px-4 py-2 cursor-pointer transition-all hover:-translate-y-px text-gold-light bg-transparent">
                Sign In
              </button>
              <button onClick={() => navigate('/register')}
                className="font-sans text-[11px] font-bold tracking-[1.5px] uppercase rounded border-none px-4 py-2 cursor-pointer transition-all hover:-translate-y-px bg-gold text-navy">
                Join Free
              </button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3.5">
          <button className="bg-none border-none cursor-pointer text-xl text-white/80 p-1 leading-none transition-colors hover:text-gold"
            onClick={() => setShowSearch(x => !x)}>⌕</button>

          {user?.role !== 'admin' && (
            <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
              <span className="text-xl text-white/80">🛒</span>
              {cartCount > 0 && (
                <span key={cartCount} className="absolute -top-1.5 -right-1.5 bg-gold text-navy rounded-full w-[15px] h-[15px] text-[8px] font-extrabold font-sans flex items-center justify-center animate-pop">
                  {cartCount}
                </span>
              )}
            </div>
          )}

          <button className="bg-none border-none cursor-pointer text-xl text-white/80 p-1 leading-none transition-colors hover:text-gold"
            onClick={() => setMobileMenuOpen(x => !x)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="bg-navy-mid px-[5%] py-2.5 border-b border-gold/15">
          <div className="flex items-center bg-white/[0.06] rounded-md px-3.5 py-2.5 gap-2 border border-gold/20">
            <span className="text-gold/70 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/?search=${search}`)}
              placeholder="Search fashion…"
              autoFocus
              className="bg-transparent border-none outline-none text-sm w-full text-white/85 font-sans placeholder:text-white/30"
            />
            {search && (
              <button onClick={() => setSearch('')} className="bg-none border-none text-gold/60 cursor-pointer text-sm p-0">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="bg-navy border-b border-gold/20 px-[5%] py-4 flex flex-col">
          {user ? (
            <>
              <div className="py-3 border-b border-gold/10 mb-2">
                <div className="font-sans font-bold text-sm text-white">{user.full_name}</div>
                <div className="font-sans text-[11px] text-white/40 mt-0.5">{user.email}</div>
              </div>
              {[
                ['📦', 'My Orders',   '/orders'],
                ['🤍', 'Wishlist',    '/wishlist'],
                ['⭐', 'My Reviews',  '/reviews'],
              ].map(([icon, label, path]) => (
                <button key={label}
                  className="bg-none border-none cursor-pointer font-sans text-sm font-medium text-white/75 py-3 text-left w-full border-b border-gold/[0.08] transition-colors hover:text-gold flex items-center gap-2.5 last:border-b-0"
                  onClick={() => go(path)}>
                  {icon} {label}
                </button>
              ))}
              {user.role === 'admin' && (
                <button className="bg-none border-none cursor-pointer font-sans text-sm font-medium py-3 text-left w-full text-gold flex items-center gap-2.5 transition-colors hover:text-gold-light"
                  onClick={() => go('/admin')}>
                  👑 Admin Dashboard
                </button>
              )}
              <button className="bg-none border-none cursor-pointer font-sans text-sm font-medium text-red-300 py-3 mt-2 text-left w-full flex items-center gap-2.5 transition-colors hover:text-red-400"
                onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => go('/login')}
                className="flex-1 font-sans text-[11px] font-semibold tracking-[1.5px] uppercase rounded border border-gold/45 px-4 py-2.5 cursor-pointer text-gold-light bg-transparent">
                Sign In
              </button>
              <button onClick={() => go('/register')}
                className="flex-1 font-sans text-[11px] font-bold tracking-[1.5px] uppercase rounded border-none px-4 py-2.5 cursor-pointer bg-gold text-navy">
                Join Free
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
