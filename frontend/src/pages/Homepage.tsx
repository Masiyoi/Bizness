// src/pages/Homepage.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams }      from 'react-router-dom';
import axios                                  from 'axios';

import Navbar          from '../components/common/Navbar';
import Footer          from '../components/common/Footer';
import InstagramStrip  from '../components/common/InstagramStrip';
import AuthPopup from '../components/common/AuthPopup';
import ProductCard     from '../components/home/ProductCard';
import ReviewSection   from '../components/home/ReviewSection';
import VideoCarousel, { VIDEO_TILES } from '../components/home/VideoCarousel';
import FlashSaleStrip from '../components/home/FlashSaleStrip';

import { readUser, ANNOUNCEMENTS } from '../constants/theme';
import WhatsAppLogo from '../assets/Whatsapplogo.jpg';
import type { Product, HomepageReview, User } from '../constants/theme';

const PRODUCTS_PER_PAGE = 8;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  :root {
    --ink: #0A0A0A; --paper: #FAFAFA; --mid: #888; --rule: rgba(0,0,0,0.10);
    --f-display: 'Cormorant Garamond', Georgia, serif;
    --f-sans: 'DM Sans', system-ui, sans-serif;
    --nav-h: 64px;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideL { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  @keyframes marqueeScroll { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .lp-fade-up { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.2) both }
  .lp-d1 { animation-delay: 0.05s } .lp-d2 { animation-delay: 0.15s }
  .lp-d3 { animation-delay: 0.25s } .lp-d4 { animation-delay: 0.35s }
  .lp-hero-split { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; border-bottom: 1px solid var(--rule); }
  @media(max-width:640px) { .lp-hero-split { grid-template-columns: 1fr 1fr; min-height: auto } }
  .lp-hero-panel { position: relative; overflow: hidden; min-height: 100vh; cursor: pointer; }
  @media(max-width:640px) { .lp-hero-panel { min-height: 72vw } }
  .lp-hero-panel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 7s ease; will-change: transform; filter: brightness(0.72); }
  .lp-hero-panel:hover .lp-hero-panel-img { transform: scale(1.05) }
  .lp-hero-panel-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%); pointer-events: none; }
  .lp-hero-panel + .lp-hero-panel { border-left: 1px solid rgba(255,255,255,0.08); }
  .lp-hero-panel-content { position: absolute; bottom: 0; left: 0; right: 0; padding: clamp(14px,3vw,56px); display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
  .lp-hero-panel-eyebrow { font-family: var(--f-sans); font-size: 10px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.65); }
  @media(max-width:640px) { .lp-hero-panel-eyebrow { display: none } }
  .lp-hero-panel-title { font-family: var(--f-sans); font-size: clamp(22px, 5vw, 80px); font-weight: 800; text-transform: uppercase; color: #fff; line-height: 0.92; letter-spacing: -1px; text-shadow: 0 2px 24px rgba(0,0,0,0.4); }
  .lp-hero-panel-ctas { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
  .lp-hero-cta-primary { font-family: var(--f-sans); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; background: #fff; color: #000; border: none; padding: 14px 28px; cursor: pointer; transition: background 0.2s, transform 0.15s; }
  @media(max-width:640px) { .lp-hero-cta-primary { font-size: 9px; letter-spacing: 1.5px; padding: 10px 14px } }
  .lp-hero-cta-primary:hover { background: #e5e5e5; transform: translateY(-1px) }
  .lp-hero-cta-ghost { font-family: var(--f-sans); font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.5); padding: 14px 28px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  @media(max-width:640px) { .lp-hero-cta-ghost { font-size: 9px; letter-spacing: 1.5px; padding: 10px 14px } }
  .lp-hero-cta-ghost:hover { border-color: #fff; background: rgba(255,255,255,0.08) }
  .lp-btn-primary { font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; background: var(--ink); color: #fff; border: none; padding: 16px 36px; cursor: pointer; transition: background 0.2s, transform 0.15s; }
  .lp-btn-primary:hover { background: #222; transform: translateY(-1px) }
  .lp-btn-ghost { font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; background: transparent; color: var(--ink); border: 1px solid rgba(0,0,0,0.25); padding: 16px 36px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .lp-btn-ghost:hover { border-color: var(--ink); background: rgba(0,0,0,0.03) }
  .lp-stats { display: grid; grid-template-columns: repeat(3,1fr); border-bottom: 1px solid var(--rule); }
  .lp-stat { padding: clamp(20px,3.5vw,48px) clamp(16px,3vw,40px); border-right: 1px solid var(--rule); display: flex; align-items: center; justify-content: center; gap: clamp(10px,1.5vw,20px); }
  .lp-stat:last-child { border-right: none }
  .lp-stat-icon { color: var(--ink); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .lp-stat-label { font-family: var(--f-sans); font-size: clamp(10px,1.1vw,13px); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink); line-height: 1.4; }
  @media(max-width:640px) { .lp-stat { flex-direction: column; text-align: center; gap: 8px; padding: 20px 10px } .lp-stat-icon svg { width: 28px; height: 28px } .lp-stat-label { font-size: 9px; letter-spacing: 1px } }
  .lp-section-head { display: flex; align-items: flex-end; justify-content: space-between; padding: clamp(32px,5vw,72px) clamp(20px,5%,80px) 24px; border-bottom: 1px solid var(--rule); flex-wrap: wrap; gap: 12px; }
  .lp-section-kicker { font-family: var(--f-sans); font-size: 10px; font-weight: 500; letter-spacing: 3.5px; text-transform: uppercase; color: var(--mid); margin-bottom: 8px; }
  .lp-section-title { font-family: var(--f-display); font-weight: 300; font-size: clamp(24px,4vw,48px); color: var(--ink); letter-spacing: -1px; line-height: 1.05; }
  .lp-section-title em { font-style: italic; color: var(--mid) }
  .lp-cats { display: flex; overflow-x: auto; gap: 0; border-bottom: 1px solid var(--rule); scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .lp-cats::-webkit-scrollbar { display: none }
  .lp-cat-btn { flex-shrink: 0; padding: 16px 20px; font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--mid); background: none; border: none; border-right: 1px solid var(--rule); cursor: pointer; transition: all 0.18s; white-space: nowrap; position: relative; }
  .lp-cat-btn::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--ink); transform: scaleX(0); transform-origin: left; transition: transform 0.25s cubic-bezier(.22,.68,0,1.2); }
  .lp-cat-btn:hover, .lp-cat-btn.active { color: var(--ink) }
  .lp-cat-btn.active::after, .lp-cat-btn:hover::after { transform: scaleX(1) }
  @media(max-width:640px) { .lp-cat-btn { padding: 14px 16px; font-size: 10px } }
  .lp-search-wrap { padding: 16px clamp(20px,5%,80px); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 12px; }
  .lp-search { flex: 1; background: none; border: none; outline: none; font-family: var(--f-sans); font-size: 13px; font-weight: 300; color: var(--ink); caret-color: var(--ink); }
  .lp-search::placeholder { color: var(--mid) }
  .lp-search-icon { color: var(--mid); font-size: 15px; flex-shrink:0 }
  .lp-result-count { font-family: var(--f-sans); font-size: 11px; color: var(--mid); white-space: nowrap; flex-shrink: 0; }
  .lp-grid-wrap { padding: 20px clamp(20px,5%,80px) clamp(40px,6vw,80px); overflow: hidden; }
  .lp-grid { width: 100%; box-sizing: border-box; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
  @media(max-width:1024px) { .lp-grid { grid-template-columns: repeat(3,1fr); gap: 16px 12px } }
  @media(max-width:640px) { .lp-grid { grid-template-columns: repeat(2,1fr); gap: 12px 8px } }
  .lp-editorial { display: grid; grid-template-columns: 1fr 1fr; min-height: 70vh; border-bottom: 1px solid var(--rule); overflow: hidden; }
  @media(max-width:640px) { .lp-editorial { grid-template-columns: 1fr; min-height: auto } .lp-editorial-copy { padding: 32px 24px 40px } }
  .lp-editorial-img { position: relative; overflow: hidden; background: #111; }
  .lp-editorial-img img { width: 100%; height: 100%; min-height: 320px; object-fit: cover; filter: grayscale(100%) contrast(1.08); opacity: 0.88; transition: transform 6s ease, opacity 0.4s; }
  .lp-editorial-img:hover img { transform: scale(1.05); opacity: 0.95 }
  .lp-editorial-badge { position: absolute; top: 20px; left: 20px; font-family: var(--f-sans); font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; background: #fff; color: #000; padding: 6px 14px; }
  .lp-editorial-copy { display: flex; flex-direction: column; justify-content: flex-end; padding: clamp(32px,5vw,72px); background: var(--paper); border-left: 1px solid var(--rule); }
  .lp-editorial-copy h3 { font-family: var(--f-display); font-weight: 300; font-style: italic; font-size: clamp(28px,4vw,56px); line-height: 1.05; color: var(--ink); margin-bottom: 16px; }
  .lp-editorial-copy p { font-family: var(--f-sans); font-size: 13px; font-weight: 300; color: var(--mid); line-height: 1.75; margin-bottom: 28px; max-width: 340px; }
  .lp-page-wrap { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 36px 0 0; flex-wrap: wrap; }
  .lp-page-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-family: var(--f-sans); font-size: 12px; font-weight: 500; border: 1px solid var(--rule); background: none; color: var(--mid); cursor: pointer; transition: all 0.18s; }
  .lp-page-btn:hover { border-color: var(--ink); color: var(--ink) }
  .lp-page-btn.active { background: var(--ink); color: #fff; border-color: var(--ink) }
  .lp-page-btn:disabled { opacity: 0.3; cursor: not-allowed }
  .lp-page-arrow { padding: 0 14px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; width: auto }
  @media(max-width:480px) { .lp-page-arrow span { display: none } }
  .lp-empty { text-align: center; padding: clamp(48px,8vw,96px) 24px; border-top: 1px solid var(--rule); }
  .lp-empty-title { font-family: var(--f-display); font-weight: 300; font-style: italic; font-size: clamp(26px,4vw,42px); color: var(--ink); margin-bottom: 12px; }
  .lp-empty-sub { font-family: var(--f-sans); font-size: 13px; color: var(--mid); margin-bottom: 28px; font-weight: 300; }
  .lp-skel { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: pulse 1.4s ease infinite; }
  .lp-video-wrap { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule) }
  .lp-sort { font-family: var(--f-sans); font-size: 11px; font-weight: 500; background: none; border: 1px solid var(--rule); padding: 8px 12px; color: var(--ink); cursor: pointer; outline: none; appearance: none; -webkit-appearance: none; }
  .lp-sort:hover { border-color: var(--ink) }
  .lp-wa-fab { position: fixed; bottom: 28px; right: 28px; z-index: 9999; width: 58px; height: 58px; border-radius: 50%; box-shadow: 0 4px 20px rgba(0,0,0,0.18); cursor: pointer; border: none; background: none; padding: 0; transition: transform 0.2s, box-shadow 0.2s; display: flex; align-items: center; justify-content: center; }
  .lp-wa-fab:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 8px 28px rgba(0,0,0,0.22); }
  .lp-wa-fab img { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; display: block; }
  .lp-wa-tooltip { position: fixed; bottom: 96px; right: 28px; z-index: 9999; background: #0a0a0a; color: #fff; font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 1px; padding: 7px 14px; border-radius: 4px; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(4px); transition: opacity 0.18s, transform 0.18s; }
  .lp-wa-fab:hover + .lp-wa-tooltip, .lp-wa-fab:focus + .lp-wa-tooltip { opacity: 1; transform: translateY(0); }
  @media(max-width:640px) { .lp-wa-fab { width: 50px; height: 50px; bottom: 20px; right: 20px; } .lp-wa-fab img { width: 50px; height: 50px; } .lp-wa-tooltip { display: none; } }
`;

function Hero({ onShop }: { onShop: (cat?: string) => void }) {
  const navigate = useNavigate();
  return (
    <section className="lp-hero-split">
      <div className="lp-hero-panel lp-fade-up lp-d1">
        <img src="/i1.webp" alt="New Collection" className="lp-hero-panel-img" />
        <div className="lp-hero-panel-overlay" />
        <div className="lp-hero-panel-content">
          <p className="lp-hero-panel-eyebrow">New Collection 2025</p>
          <h2 className="lp-hero-panel-title">New<br/>Arrivals</h2>
          <div className="lp-hero-panel-ctas">
            <button className="lp-hero-cta-primary" onClick={() => onShop()}>Shop Collection</button>

          </div>
        </div>
      </div>
      <div className="lp-hero-panel lp-fade-up lp-d2">
        <img src="/i2.webp" alt="Most Wanted" className="lp-hero-panel-img" />
        <div className="lp-hero-panel-overlay" />
        <div className="lp-hero-panel-content">
          <p className="lp-hero-panel-eyebrow">Top Picks</p>
          <h2 className="lp-hero-panel-title">Most<br/>Wanted</h2>
          <div className="lp-hero-panel-ctas">
            <button className="lp-hero-cta-primary" onClick={() => navigate('/categories/best-sellers')}>Shop Now</button>
          </div>
        </div>
      </div>
    </section>
  );
}

import worldwideShipping from '../assets/worldwideshipping.png';
import returnArrow from '../assets/returnarrow.png';
import shopperIcon from '../assets/shoppericon.png';
import securePayment from '../assets/securepayment.png';

function StatsBar({ productCount }: { productCount: number }) {
  const items = [
    { line1: 'WORLDWIDE', line2: 'SHIPPING', img: worldwideShipping },
    { line1: '2–3 DAY', line2: 'RETURN POLICY', img: returnArrow },
    { line1: 'OVER 25K', line2: 'CUSTOMERS', img: shopperIcon },
    { line1: 'SECURE', line2: 'PAYMENT', img: securePayment },
  ];
  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: #FFFFFF;
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0;
          }
        }
        .stat-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: clamp(16px,3vw,40px) clamp(10px,2vw,32px);
        }
        @media (max-width: 640px) {
          .stat-item {
            flex-direction: column;
            text-align: center;
            gap: 8px;
            padding: 20px 12px;
          }
        }
        .stat-img {
          width: 56px;
          height: 56px;
          object-fit: contain;
          flex-shrink: 0;
        }
        @media (max-width: 640px) {
          .stat-img {
            width: 36px;
            height: 36px;
          }
        }
        .stat-label {
          font-family: var(--f-sans);
          font-size: clamp(10px,1.1vw,13px);
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--ink);
          line-height: 1.4;
        }
        @media (max-width: 640px) {
          .stat-label {
            font-size: 9px;
            letter-spacing: 1px;
          }
        }
      `}</style>
      <div className="stats-grid">
        {items.map(({ img, line1, line2 }) => (
          <div key={line1} className="stat-item">
            <img src={img} alt={line1} className="stat-img" />
            <div className="stat-label">
              <span>{line1}</span><br/><span>{line2}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Editorial({ onShop }: { onShop: (cat: string) => void }) {
  const navigate = useNavigate();
  return (
    <section id="editorial" className="lp-editorial">
      <div className="lp-editorial-img">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80" alt="Our Story" />
        <div className="lp-editorial-badge">Est. Nairobi, Kenya</div>
      </div>
      <div className="lp-editorial-copy">
        <p style={{ fontFamily:"var(--f-sans)", fontSize:10, fontWeight:500, letterSpacing:'3px', textTransform:'uppercase', color:'var(--mid)', marginBottom:16 }}>Our Story</p>
        <h3>Born in Nairobi,<br/>Dressed for<br/>the World</h3>
        <p>Luku Prime started with a simple belief — that every person in Kenya deserves access to authentic, premium fashion without compromise. From curated thrift finds to coveted designer pieces, we source with intention, deliver with care, and dress a generation that refuses to settle.</p>
        <button className="lp-btn-primary" onClick={() => navigate('/about')}>Read About Us</button>
      </div>
    </section>
  );
}

export default function Homepage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const gridRef        = useRef<HTMLDivElement>(null);

  const [user, setUser]               = useState<User | null>(readUser);
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setCategory] = useState('All');
  const [search, setSearch]           = useState(searchParams.get('search') ?? '');
  const [currentPage, setPage]        = useState(1);
  const [cartIds, setCartIds]         = useState<number[]>([]);
  const [cartCount, setCartCount]     = useState(0);
  const [wishlist, setWishlist]       = useState<number[]>([]);
  const [reviews, setReviews]         = useState<HomepageReview[]>([]);
  const [reviewsLoading, setRLoading] = useState(true);
  const [sortBy, setSortBy]           = useState('featured');
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
  const sortBtnRef                          = useRef<HTMLDivElement>(null);
  const [flashSaleMap, setFlashSaleMap] = useState<Record<number, number>>({});
  // maps product_id → sale_price (used to hide flash items from main grid)

  const topVideo    = [VIDEO_TILES[0]];
  const bottomVideo = [VIDEO_TILES[1]];

  useEffect(() => {
    axios.get('/api/products')
      .then(r => { setProducts(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/api/reviews/homepage?limit=12')
      .then(r => { setReviews(Array.isArray(r.data) ? r.data : []); setRLoading(false); })
      .catch(() => setRLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/api/products/flash-sales?limit=100')
      .then(r => {
        const map: Record<number, number> = {};
        (r.data as { id: number; sale_price: number }[]).forEach(p => {
          map[p.id] = p.sale_price;
        });
        setFlashSaleMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q   = searchParams.get('search');
    if (cat) setCategory(decodeURIComponent(cat));
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const fetchCart = useCallback(() => {
    if (!user || user.role === 'admin') { setCartIds([]); setCartCount(0); return; }
    axios.get('/api/cart').then(r => {
      setCartIds(r.data.map((i: any) => i.product_id));
      setCartCount(r.data.reduce((s: number, i: any) => s + i.quantity, 0));
    }).catch(() => {});
  }, [user?.id]);

  const fetchWishlist = useCallback(() => {
    if (!user || user.role === 'admin') { setWishlist([]); return; }
    axios.get('/api/wishlist').then(r => setWishlist(r.data.map((i: any) => i.product_id))).catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchCart(); fetchWishlist(); }, [fetchCart, fetchWishlist]);
  useEffect(() => {
    window.addEventListener('focus', fetchCart);
    return () => window.removeEventListener('focus', fetchCart);
  }, [fetchCart]);

  const toggleCart = async (productId: number) => {
    if (!user) { navigate('/login'); return; }
    if (cartIds.includes(productId)) {
      try {
        await axios.delete(`/api/cart/${productId}`);
        setCartIds(p => p.filter(id => id !== productId));
        setCartCount(p => Math.max(0, p - 1));
      } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
    } else {
      try {
        await axios.post('/api/cart', { product_id: productId, quantity: 1 });
        setCartIds(p => [...p, productId]);
        setCartCount(p => p + 1);
      } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (!user) { navigate('/login'); return; }
    if (wishlist.includes(productId)) {
      setWishlist(p => p.filter(id => id !== productId));
      try { await axios.delete(`/api/wishlist/${productId}`); } catch { fetchWishlist(); }
    } else {
      setWishlist(p => [...p, productId]);
      try { await axios.post('/api/wishlist', { product_id: productId }); } catch { fetchWishlist(); }
    }
  };

  const handleLogout = () => { setUser(null); setCartIds([]); setCartCount(0); setWishlist([]); };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort() as string[]];

  const selectCategory = (cat: string) => {
    setCategory(cat); setSearch(''); setPage(1);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let filtered = products
    .filter(p => !(p.id in flashSaleMap))
    .filter(p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  if (sortBy === 'price_asc')  filtered = [...filtered].sort((a,b) => Number(a.price) - Number(b.price));
  if (sortBy === 'price_desc') filtered = [...filtered].sort((a,b) => Number(b.price) - Number(a.price));
  if (sortBy === 'newest')     filtered = [...filtered].sort((a,b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

  useEffect(() => { setPage(1); }, [activeCategory, search]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const pageStart  = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated  = filtered.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  const goToPage = (page: number) => {
    setPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div style={{ background:'#FAFAFA', minHeight:'100vh', color:'#0A0A0A', overflowX:'hidden' }}>
      <style>{css}</style>

      <AuthPopup onAuthSuccess={(u) => { setUser(u); fetchCart(); fetchWishlist(); }} />

      <Navbar
        transparentOnTop
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onLogout={handleLogout}
        categories={categories.filter(c => c !== 'All')}
        activeCategory={activeCategory}
        onCategorySelect={selectCategory}
      />

      <Hero onShop={(cat?: string) => selectCategory(cat ?? 'All')} />
      <StatsBar productCount={products.length} />

      <FlashSaleStrip
        cartIds={cartIds}
        wishlistIds={wishlist}
        isAdmin={user?.role === 'admin'}
        onCartToggle={toggleCart}
        onWishlistToggle={toggleWishlist}
      />

      <div className="lp-video-wrap">
        <VideoCarousel tiles={topVideo} />
      </div>

      <Editorial onShop={selectCategory} />

      <div ref={gridRef} style={{ scrollMarginTop: 80, background: '#fff' }}>
        <div className="lp-section-head">
          <div>
            <p className="lp-section-kicker">{activeCategory === 'All' ? 'The Collection' : activeCategory}</p>
            <h2 className="lp-section-title">
              {activeCategory === 'All' ? <>Featured <em>Fashion</em></> : activeCategory}
            </h2>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {filtered.length > 0 && (
              <span className="lp-result-count" style={{ fontFamily:'var(--f-sans)', fontSize:11, color:'var(--mid)' }}>
                {pageStart + 1}–{Math.min(pageStart + PRODUCTS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
            )}
            <div ref={sortBtnRef} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setSortDrawerOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--f-sans)', fontSize: 11, fontWeight: 600,
                  letterSpacing: '2px', textTransform: 'uppercase',
                  background: '#fff', color: 'var(--ink)',
                  border: '1px solid rgba(0,0,0,0.15)', padding: '9px 18px',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="5" cy="2" r="2" fill="#fff" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="0" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="11" cy="7" r="2" fill="#fff" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="4" cy="12" r="2" fill="#fff" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Filter
              </button>

              {sortDrawerOpen && (
                <>
                  <div onClick={() => setSortDrawerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 200,
                      background: '#fff',
                      border: '1px solid rgba(0,0,0,0.10)',
                      borderRadius: 10,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      zIndex: 999,
                      overflow: 'hidden',
                      animation: 'popupFadeUp 0.18s cubic-bezier(0.22,0.68,0,1.2) both',
                    }}
                  >
                    <style>{`@keyframes popupFadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>

                    <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <p style={{ fontFamily: 'var(--f-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--mid)', margin: '0 0 2px' }}>The Collection</p>
                      <p style={{ fontFamily: 'var(--f-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>Sort By</p>
                    </div>

                <button
                  onClick={() => { setSortBy('featured'); setSortDrawerOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: sortBy === 'featured' ? 'rgba(0,0,0,0.04)' : 'none',
                    border: 'none',
                    borderLeft: sortBy === 'featured' ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-sans)', fontSize: 10, fontWeight: sortBy === 'featured' ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: sortBy === 'featured' ? 'var(--ink)' : 'var(--mid)' }}>Featured</span>
                </button>
                <button
                  onClick={() => { setSortBy('price_asc'); setSortDrawerOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: sortBy === 'price_asc' ? 'rgba(0,0,0,0.04)' : 'none',
                    border: 'none',
                    borderLeft: sortBy === 'price_asc' ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-sans)', fontSize: 10, fontWeight: sortBy === 'price_asc' ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: sortBy === 'price_asc' ? 'var(--ink)' : 'var(--mid)' }}>Price: Low → High</span>
                </button>
                <button
                  onClick={() => { setSortBy('price_desc'); setSortDrawerOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: sortBy === 'price_desc' ? 'rgba(0,0,0,0.04)' : 'none',
                    border: 'none',
                    borderLeft: sortBy === 'price_desc' ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-sans)', fontSize: 10, fontWeight: sortBy === 'price_desc' ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: sortBy === 'price_desc' ? 'var(--ink)' : 'var(--mid)' }}>Price: High → Low</span>
                </button>
                <button
                  onClick={() => { setSortBy('newest'); setSortDrawerOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: sortBy === 'newest' ? 'rgba(0,0,0,0.04)' : 'none',
                    border: 'none',
                    borderLeft: sortBy === 'newest' ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-sans)', fontSize: 10, fontWeight: sortBy === 'newest' ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: sortBy === 'newest' ? 'var(--ink)' : 'var(--mid)' }}>Newest First</span>
                </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lp-cats">
          {categories.map(cat => (
            <button key={cat} className={`lp-cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => selectCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <div className="lp-search-wrap">
          <span className="lp-search-icon">⌕</span>
          <input
            className="lp-search"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <span className="lp-result-count" style={{ cursor:'pointer', fontFamily:'var(--f-sans)', fontSize:11, color:'var(--mid)' }} onClick={() => setSearch('')}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} · clear ×
            </span>
          )}
        </div>

        <div className="lp-grid-wrap">
          {loading && (
            <div className="lp-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="lp-skel" style={{ width:'100%', aspectRatio:'1' }} />
                  <div style={{ padding:'16px 14px' }}>
                    <div className="lp-skel" style={{ height:12, width:'65%', marginBottom:8 }}/>
                    <div className="lp-skel" style={{ height:10, width:'40%' }}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="lp-empty">
              <p className="lp-empty-title">Nothing found</p>
              <p className="lp-empty-sub">
                {search ? `No results for "${search}" — try a different term` : `No products in ${activeCategory} yet — check back soon`}
              </p>
              <button className="lp-btn-primary" onClick={() => { setCategory('All'); setSearch(''); }}>Browse All</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="lp-grid">
                {paginated.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inCart={cartIds.includes(product.id)}
                    inWishlist={wishlist.includes(product.id)}
                    isAdmin={user?.role === 'admin'}
                    onCartToggle={toggleCart}
                    onWishlistToggle={toggleWishlist}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="lp-page-wrap">
                  <button className="lp-page-btn lp-page-arrow" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
                  {getPages().map((p, i) =>
                    p === '...'
                      ? <span key={`e${i}`} style={{ padding:'0 6px', color:'var(--mid)', fontFamily:'var(--f-sans)', fontSize:12 }}>…</span>
                      : <button key={p} className={`lp-page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => goToPage(p as number)}>{p}</button>
                  )}
                  <button className="lp-page-btn lp-page-arrow" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
                </div>
              )}
              {totalPages > 1 && (
                <p style={{ textAlign:'center', marginTop:12, fontFamily:'var(--f-sans)', fontSize:11, color:'var(--mid)' }}>
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="lp-video-wrap">
        <VideoCarousel tiles={bottomVideo} />
      </div>

      <InstagramStrip handle="@lukuprime" profileUrl="https://instagram.com/lukuprime" limit={12} />
      <ReviewSection reviews={reviews} loading={reviewsLoading} isAdmin={user?.role === 'admin'} />
      <Footer />

      <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer" className="lp-wa-fab" aria-label="Chat with us on WhatsApp">
        <img src={WhatsAppLogo} alt="WhatsApp" />
      </a>
      <span className="lp-wa-tooltip">Chat with us on WhatsApp</span>
    </div>
  );
}
