// src/pages/Homepage.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams }      from 'react-router-dom';
import axios                                  from 'axios';

import Navbar          from '../components/common/Navbar';
import Footer          from '../components/common/Footer';
import InstagramStrip  from '../components/common/InstagramStrip';
import ProductCard     from '../components/home/ProductCard';
import ReviewSection   from '../components/home/ReviewSection';
import VideoCarousel, { VIDEO_TILES } from '../components/home/VideoCarousel';

import { readUser } from '../constants/theme';
import type { Product, HomepageReview, User } from '../constants/theme';

const PRODUCTS_PER_PAGE = 8;

/* ─── Inline CSS ─────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

  :root {
    --ink:   #0A0A0A;
    --paper: #FAFAFA;
    --mid:   #888;
    --rule:  rgba(0,0,0,0.10);
    --f-display: 'Cormorant Garamond', Georgia, serif;
    --f-sans:    'DM Sans', system-ui, sans-serif;
    --nav-h: 96px; /* announcement (32px) + nav (64px) */
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideL { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .lp-fade-up { animation: fadeUp 0.6s cubic-bezier(.22,.68,0,1.2) both }
  .lp-d1 { animation-delay: 0.05s }
  .lp-d2 { animation-delay: 0.15s }
  .lp-d3 { animation-delay: 0.25s }
  .lp-d4 { animation-delay: 0.35s }

  /* ── Hero — pulls up behind the sticky navbar ── */
  .lp-hero {
    min-height: 100vh;
    /* negative margin pulls section up by the total navbar height so image
       bleeds underneath the transparent nav; padding-top compensates so
       text content stays below the nav bar */
    margin-top: calc(-1 * var(--nav-h));
    padding-top: var(--nav-h);
    display: grid; grid-template-columns: 1fr 1fr;
    position: relative; overflow: hidden;
    border-bottom: 1px solid var(--rule);
  }
  .lp-hero-left {
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: clamp(36px,6vw,96px);
    background: var(--paper);
    position: relative; z-index: 1;
  }
  .lp-hero-right {
    position: relative; overflow: hidden; background: var(--ink);
  }
  .lp-hero-right img {
    width: 100%; height: 100%; object-fit: cover;
    filter: grayscale(100%) contrast(1.1);
    opacity: 0.85; transition: transform 8s ease;
  }
  .lp-hero-right:hover img { transform: scale(1.04) }

  /* Mobile hero — image behind text, full bleed */
  @media(max-width:768px) {
    .lp-hero {
      grid-template-columns: 1fr;
      min-height: 100vh;
    }
    .lp-hero-right {
      position: absolute; inset: 0; z-index: 0;
    }
    .lp-hero-right img { opacity: 0.38; }
    .lp-hero-left {
      position: relative; z-index: 1;
      justify-content: flex-end;
      min-height: 100vh;
      padding: 32px 24px 56px;
      background: transparent;
    }
  }

  .lp-hero-eyebrow {
    font-family: var(--f-sans); font-size: 10px; font-weight: 500;
    letter-spacing: 4px; text-transform: uppercase;
    color: var(--mid); margin-bottom: 20px;
    display: flex; align-items: center; gap: 12px;
  }
  .lp-hero-eyebrow::before { content: ''; width: 32px; height: 1px; background: var(--mid) }
  @media(max-width:768px) {
    .lp-hero-eyebrow { color: rgba(255,255,255,0.7) }
    .lp-hero-eyebrow::before { background: rgba(255,255,255,0.5) }
  }
  .lp-hero-title {
    font-family: var(--f-display); font-weight: 300;
    font-size: clamp(52px, 11vw, 108px); line-height: 0.95;
    color: var(--ink); letter-spacing: -2px;
    margin-bottom: 24px;
  }
  .lp-hero-title em { font-style: italic; color: var(--mid) }
  @media(max-width:768px) {
    .lp-hero-title { color: #fff; letter-spacing: -1px }
    .lp-hero-title em { color: rgba(255,255,255,0.6) }
  }
  .lp-hero-sub {
    font-family: var(--f-sans); font-size: 14px; font-weight: 300;
    color: var(--mid); line-height: 1.7; max-width: 380px;
    margin-bottom: 36px;
  }
  @media(max-width:768px) { .lp-hero-sub { color: rgba(255,255,255,0.75); font-size: 13px } }
  .lp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; align-items: center }
  @media(max-width:768px) {
    .lp-hero-ctas { flex-direction: column; align-items: stretch }
    .lp-hero-ctas button { text-align: center; width: 100% }
  }
  .lp-btn-primary {
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    letter-spacing: 3px; text-transform: uppercase;
    background: var(--ink); color: #fff;
    border: none; padding: 16px 36px; cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  @media(max-width:768px) { .lp-btn-primary { background: #fff; color: #000 } }
  .lp-btn-primary:hover { background: #222; transform: translateY(-1px) }
  .lp-btn-ghost {
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    letter-spacing: 3px; text-transform: uppercase;
    background: transparent; color: var(--ink);
    border: 1px solid rgba(0,0,0,0.25); padding: 16px 36px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  @media(max-width:768px) { .lp-btn-ghost { color: #fff; border-color: rgba(255,255,255,0.4) } }
  .lp-btn-ghost:hover { border-color: var(--ink); background: rgba(0,0,0,0.03) }
  .lp-hero-counter {
    position: absolute; bottom: clamp(48px,6vw,96px); right: clamp(48px,6vw,96px);
    font-family: var(--f-sans); font-size: 10px; font-weight: 500;
    letter-spacing: 2px; color: rgba(255,255,255,0.5);
    display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
  }
  @media(max-width:768px) { .lp-hero-counter { display: none } }
  .lp-hero-counter-line {
    width: 48px; height: 1px; background: rgba(255,255,255,0.3);
    position: relative; overflow: hidden;
  }
  .lp-hero-counter-line::after {
    content: ''; position: absolute; left: 0; top: 0;
    width: 40%; height: 100%; background: rgba(255,255,255,0.8);
  }

  /* ── Stats bar ── */
  .lp-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    border-bottom: 1px solid var(--rule);
  }
  .lp-stat {
    padding: clamp(24px,4vw,56px) clamp(20px,4vw,48px);
    border-right: 1px solid var(--rule); text-align: center;
  }
  .lp-stat:last-child { border-right: none }
  .lp-stat-num {
    font-family: var(--f-display); font-weight: 300;
    font-size: clamp(36px,6vw,72px); color: var(--ink); line-height: 1;
    margin-bottom: 6px;
  }
  .lp-stat-label {
    font-family: var(--f-sans); font-size: 10px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase; color: var(--mid);
  }
  @media(max-width:400px) { .lp-stat-label { font-size: 9px; letter-spacing: 1px } }

  /* ── Section header ── */
  .lp-section-head {
    display: flex; align-items: flex-end;
    justify-content: space-between;
    padding: clamp(32px,5vw,72px) clamp(20px,5%,80px) 24px;
    border-bottom: 1px solid var(--rule);
    flex-wrap: wrap; gap: 12px;
  }
  .lp-section-kicker {
    font-family: var(--f-sans); font-size: 10px; font-weight: 500;
    letter-spacing: 3.5px; text-transform: uppercase; color: var(--mid);
    margin-bottom: 8px;
  }
  .lp-section-title {
    font-family: var(--f-display); font-weight: 300;
    font-size: clamp(24px,4vw,48px); color: var(--ink);
    letter-spacing: -1px; line-height: 1.05;
  }
  .lp-section-title em { font-style: italic; color: var(--mid) }

  /* ── Category strip ── */
  .lp-cats {
    display: flex; overflow-x: auto; gap: 0;
    border-bottom: 1px solid var(--rule);
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
  }
  .lp-cats::-webkit-scrollbar { display: none }
  .lp-cat-btn {
    flex-shrink: 0; padding: 16px 20px;
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase;
    color: var(--mid); background: none; border: none;
    border-right: 1px solid var(--rule);
    cursor: pointer; transition: all 0.18s; white-space: nowrap;
    position: relative;
  }
  .lp-cat-btn::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; background: var(--ink);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.25s cubic-bezier(.22,.68,0,1.2);
  }
  .lp-cat-btn:hover, .lp-cat-btn.active { color: var(--ink) }
  .lp-cat-btn.active::after, .lp-cat-btn:hover::after { transform: scaleX(1) }
  @media(max-width:640px) { .lp-cat-btn { padding: 14px 16px; font-size: 10px } }

  /* ── Search bar ── */
  .lp-search-wrap {
    padding: 16px clamp(20px,5%,80px);
    border-bottom: 1px solid var(--rule);
    display: flex; align-items: center; gap: 12px;
  }
  .lp-search {
    flex: 1; background: none; border: none; outline: none;
    font-family: var(--f-sans); font-size: 13px; font-weight: 300;
    color: var(--ink); caret-color: var(--ink);
  }
  .lp-search::placeholder { color: var(--mid) }
  .lp-search-icon { color: var(--mid); font-size: 15px; flex-shrink:0 }
  .lp-result-count {
    font-family: var(--f-sans); font-size: 11px; color: var(--mid);
    white-space: nowrap; flex-shrink: 0;
  }

  /* ── Product grid ── */
  .lp-grid-wrap { padding: 20px clamp(20px,5%,80px) clamp(40px,6vw,80px); overflow: hidden; }
  .lp-grid { width: 100%; box-sizing: border-box; }
  .lp-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 28px 20px;
  }
  @media(max-width:1024px) { .lp-grid { grid-template-columns: repeat(3,1fr); gap: 24px 16px } }
  @media(max-width:640px)  { .lp-grid { grid-template-columns: repeat(2,1fr); gap: 20px 12px } }

  /* ── Featured editorial ── */
  .lp-editorial {
    display: grid; grid-template-columns: 1fr 1fr;
    min-height: 70vh; border-bottom: 1px solid var(--rule);
    overflow: hidden;
  }
  @media(max-width:640px) {
    .lp-editorial { grid-template-columns: 1fr; min-height: auto }
    .lp-editorial-copy { padding: 32px 24px 40px }
  }
  .lp-editorial-img { position: relative; overflow: hidden; background: #111; }
  .lp-editorial-img img {
    width: 100%; height: 100%; min-height: 320px;
    object-fit: cover; filter: grayscale(100%) contrast(1.08);
    opacity: 0.88; transition: transform 6s ease, opacity 0.4s;
  }
  .lp-editorial-img:hover img { transform: scale(1.05); opacity: 0.95 }
  .lp-editorial-badge {
    position: absolute; top: 20px; left: 20px;
    font-family: var(--f-sans); font-size: 9px; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    background: #fff; color: #000; padding: 6px 14px;
  }
  .lp-editorial-copy {
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: clamp(32px,5vw,72px); background: var(--paper);
    border-left: 1px solid var(--rule);
  }
  .lp-editorial-copy h3 {
    font-family: var(--f-display); font-weight: 300; font-style: italic;
    font-size: clamp(28px,4vw,56px); line-height: 1.05;
    color: var(--ink); margin-bottom: 16px;
  }
  .lp-editorial-copy p {
    font-family: var(--f-sans); font-size: 13px; font-weight: 300;
    color: var(--mid); line-height: 1.75; margin-bottom: 28px; max-width: 340px;
  }

  /* ── Pagination ── */
  .lp-page-wrap {
    display: flex; align-items: center; justify-content: center;
    gap: 4px; padding: 36px 0 0; flex-wrap: wrap;
  }
  .lp-page-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--f-sans); font-size: 12px; font-weight: 500;
    border: 1px solid var(--rule); background: none;
    color: var(--mid); cursor: pointer; transition: all 0.18s;
  }
  .lp-page-btn:hover { border-color: var(--ink); color: var(--ink) }
  .lp-page-btn.active { background: var(--ink); color: #fff; border-color: var(--ink) }
  .lp-page-btn:disabled { opacity: 0.3; cursor: not-allowed }
  .lp-page-arrow { padding: 0 14px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; width: auto }
  @media(max-width:480px) { .lp-page-arrow span { display: none } }

  /* ── Empty state ── */
  .lp-empty {
    text-align: center; padding: clamp(48px,8vw,96px) 24px;
    border-top: 1px solid var(--rule);
  }
  .lp-empty-title {
    font-family: var(--f-display); font-weight: 300; font-style: italic;
    font-size: clamp(26px,4vw,42px); color: var(--ink); margin-bottom: 12px;
  }
  .lp-empty-sub {
    font-family: var(--f-sans); font-size: 13px; color: var(--mid);
    margin-bottom: 28px; font-weight: 300;
  }

  /* ── Skeleton ── */
  .lp-skel {
    background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: pulse 1.4s ease infinite;
  }

  /* ── Video section ── */
  .lp-video-wrap { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule) }

  /* ── Sort select ── */
  .lp-sort {
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    background: none; border: 1px solid var(--rule);
    padding: 8px 12px; color: var(--ink); cursor: pointer;
    outline: none; appearance: none; -webkit-appearance: none;
  }
  .lp-sort:hover { border-color: var(--ink) }
`;

/* ─── Announcement Bar ───────────────────────────────────────────────────── */
const ITEMS = [
  'NAIROBI CBD DELIVERY — KSH 100',
  'FREE SHOP PICKUP',
  'NEW DROPS EVERY FRIDAY',
  'AUTHENTIC FASHION ONLY',
  "KENYA'S PREMIER FASHION STORE",
  'SECURE M-PESA CHECKOUT',
  '30-DAY EASY RETURNS',
  'EXCLUSIVE SNEAKER DROPS',
];

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ onShop }: { onShop: () => void }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-left lp-fade-up">
        <p className="lp-hero-eyebrow lp-fade-up lp-d1">New Collection 2025</p>
        <h1 className="lp-hero-title lp-fade-up lp-d2">
          Luku<br/>ni Prime<br/><em>Siku Zote</em>
        </h1>
        <p className="lp-hero-sub lp-fade-up lp-d3">
          Premium fashion arrivals curated for those who demand the finest —
          delivered across Kenya.
        </p>
        <div className="lp-hero-ctas lp-fade-up lp-d4">
          <button className="lp-btn-primary" onClick={onShop}>Shop Collection</button>
          <button className="lp-btn-ghost" onClick={() => document.getElementById('editorial')?.scrollIntoView({behavior:'smooth'})}>
            Explore Lookbook
          </button>
        </div>
      </div>
      <div className="lp-hero-right">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80"
          alt="Luku Prime Collection"
        />
        <div className="lp-hero-counter">
          <span>01 / 03</span>
          <div className="lp-hero-counter-line"/>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats bar ──────────────────────────────────────────────────────────── */
function StatsBar({ productCount }: { productCount: number }) {
  return (
    <div className="lp-stats">
      {[
        { num: `${productCount}+`, label: 'Products Available' },
        { num: '47',               label: 'Brands Carried'     },
        { num: '4,200+',           label: 'Happy Customers'    },
      ].map(({ num, label }) => (
        <div key={label} className="lp-stat">
          <div className="lp-stat-num">{num}</div>
          <div className="lp-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Editorial feature ──────────────────────────────────────────────────── */
function Editorial({ onShop }: { onShop: (cat: string) => void }) {
  return (
    <section id="editorial" className="lp-editorial">
      <div className="lp-editorial-img">
        <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80" alt="Footwear Collection" />
        <div className="lp-editorial-badge">Footwear Drop</div>
      </div>
      <div className="lp-editorial-copy">
        <p style={{ fontFamily:"var(--f-sans)", fontSize:10, fontWeight:500, letterSpacing:'3px', textTransform:'uppercase', color:'var(--mid)', marginBottom:16 }}>
          Season Highlight
        </p>
        <h3>Step into<br/>Something<br/>Extraordinary</h3>
        <p>
          Exclusive sneakers and shoes sourced from the world's finest labels —
          authenticated, curated, and delivered to your door across Kenya.
        </p>
        <button className="lp-btn-primary" onClick={() => onShop('Shoes')}>Shop Footwear</button>
      </div>
    </section>
  );
}

/* ─── Homepage component ─────────────────────────────────────────────────── */
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

  const topVideo    = [VIDEO_TILES[0]];
  const bottomVideo = [VIDEO_TILES[1]];

  useEffect(() => {
    axios.get('/api/products')
      .then(r => { setProducts(r.data); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/api/reviews/homepage?limit=12')
      .then(r => { setReviews(Array.isArray(r.data) ? r.data : []); setRLoading(false); })
      .catch(() => setRLoading(false));
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

  let filtered = products.filter(p =>
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

      {/* transparentOnTop enables the hero-bleed effect */}
      <Navbar
        transparentOnTop
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onLogout={handleLogout}
        categories={categories.filter(c => c !== 'All')}
        activeCategory={activeCategory}
        onCategorySelect={selectCategory}
      />

      {/* Hero pulls up behind the navbar via margin-top: calc(-1 * var(--nav-h)) */}
      <Hero onShop={() => selectCategory('All')} />
      <StatsBar productCount={products.length} />

      <div className="lp-video-wrap">
        <VideoCarousel tiles={topVideo} />
      </div>

      <Editorial onShop={selectCategory} />

      {/* ── Product section ── */}
      <div ref={gridRef} style={{ scrollMarginTop: 80 }}>
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
            <select className="lp-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest First</option>
            </select>
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
                  <div className="lp-skel" style={{ width:'100%', aspectRatio:'3/4' }} />
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
    </div>
  );
}