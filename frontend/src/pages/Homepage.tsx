// src/pages/Homepage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Thin orchestrator — all visual logic lives in the components it imports.
// This file owns: data fetching, shared state, and composing the layout.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams }      from 'react-router-dom';
import axios                                  from 'axios';

import Navbar          from '../components/common/Navbar';
import Footer          from '../components/common/Footer';
import Hero            from '../components/home/Hero';
import TrustStrip      from '../components/home/TrustStrip';
import CategorySection from '../components/home/CategorySection';
import ProductCard     from '../components/home/ProductCard';
import ReviewSection   from '../components/home/ReviewSection';
import Ornament        from '../components/ui/Ornament';
import VideoCarousel, { VIDEO_TILES } from '../components/home/VideoCarousel';

import { readUser } from '../constants/theme';
import type { Product, HomepageReview, User } from '../constants/theme';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function Homepage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  // ── Shared user state ───────────────────────────────────────────
  const [user, setUser] = useState<User | null>(readUser);

  // ── Products ────────────────────────────────────────────────────
  const [products,        setProducts]        = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeCategory,  setActiveCategory]  = useState('All');
  const [search,          setSearch]          = useState(searchParams.get('search') ?? '');

  // ── Cart & wishlist ─────────────────────────────────────────────
  const [cartIds,    setCartIds]    = useState<number[]>([]);
  const [cartCount,  setCartCount]  = useState(0);
  const [wishlist,   setWishlist]   = useState<number[]>([]);

  // ── Reviews ─────────────────────────────────────────────────────
  const [reviews,        setReviews]        = useState<HomepageReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const topVideo    = [VIDEO_TILES[0]];
  const bottomVideo = [VIDEO_TILES[1]];

  // ── Fetch products ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { setProducts(d); setProductsLoading(false); })
      .catch(()  => setProductsLoading(false));
  }, []);

  // ── Fetch reviews ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/reviews/homepage?limit=12')
      .then(r => r.json())
      .then(d => { setReviews(Array.isArray(d) ? d : []); setReviewsLoading(false); })
      .catch(()  => setReviewsLoading(false));
  }, []);

  // ── Fetch cart ────────────────────────────────────────────────
  const fetchCart = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role === 'admin') { setCartIds([]); setCartCount(0); return; }
    axios.get('/api/cart', authHeader())
      .then(res => {
        setCartIds(res.data.map((i: any) => i.product_id));
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      }).catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchCart(); }, [fetchCart]);
  useEffect(() => {
    window.addEventListener('focus', fetchCart);
    return () => window.removeEventListener('focus', fetchCart);
  }, [fetchCart]);

  // ── Fetch wishlist ────────────────────────────────────────────
  const fetchWishlist = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role === 'admin') { setWishlist([]); return; }
    axios.get('/api/wishlist', authHeader())
      .then(res => setWishlist(res.data.map((i: any) => i.product_id)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // ── Cart toggle ───────────────────────────────────────────────
  const toggleCart = async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (cartIds.includes(productId)) {
      try {
        await axios.delete(`/api/cart/${productId}`, authHeader());
        setCartIds(p => p.filter(id => id !== productId));
        setCartCount(p => Math.max(0, p - 1));
      } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
    } else {
      try {
        await axios.post('/api/cart', { product_id: productId, quantity: 1 }, authHeader());
        setCartIds(p => [...p, productId]);
        setCartCount(p => p + 1);
      } catch (e: any) { if (e.response?.status === 401) navigate('/login'); }
    }
  };

  // ── Wishlist toggle ───────────────────────────────────────────
  const toggleWishlist = async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (wishlist.includes(productId)) {
      setWishlist(p => p.filter(id => id !== productId));
      try { await axios.delete(`/api/wishlist/${productId}`, authHeader()); }
      catch { fetchWishlist(); }
    } else {
      setWishlist(p => [...p, productId]);
      try { await axios.post('/api/wishlist', { product_id: productId }, authHeader()); }
      catch { fetchWishlist(); }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCartIds([]);
    setCartCount(0);
    setWishlist([]);
  };

  // ── Filtered product list ─────────────────────────────────────
  const filtered = products.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">

      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onLogout={handleLogout}
      />

      <Hero />
      <TrustStrip />

      {/* ── Top video carousel ── */}
      <div style={{ padding: 'clamp(24px, 4vw, 48px) 0' }}>
        <VideoCarousel tiles={topVideo} />
      </div>

      <CategorySection />

      {/* ── Products grid ── */}
      <div className="px-[5%] pb-[clamp(40px,6vw,80px)]">
        <div className="flex justify-between items-end mb-5 gap-3 flex-wrap">
          <div>
            <Ornament label={activeCategory === 'All' ? 'Curated for You' : activeCategory} />
            <h2 className="font-serif font-bold text-navy" style={{ fontSize:'clamp(18px,3vw,26px)' }}>
              {activeCategory === 'All' ? 'Featured Fashion' : activeCategory}
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-sans text-[11px] text-muted">{filtered.length} items</span>
            <select className="font-sans border border-cream-deep rounded-md px-3 py-1.5 text-[11px] text-navy bg-white cursor-pointer outline-none">
              <option>Featured</option>
              <option>Price: Low → High</option>
              <option>Price: High → Low</option>
              <option>Newest First</option>
            </select>
          </div>
        </div>

        {/* Skeleton */}
        {productsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-card overflow-hidden border border-cream-deep">
                <div className="skel h-60"/>
                <div className="p-3.5 bg-white">
                  <div className="skel h-3 w-[70%] mb-2"/>
                  <div className="skel h-2.5 w-[40%] mb-3"/>
                  <div className="skel h-9"/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!productsLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3.5">👗</div>
            <p className="font-sans font-bold text-[16px] text-navy mb-2">Nothing here yet</p>
            <p className="font-sans text-[13px] text-muted mb-6 leading-relaxed">
              {search
                ? `No results for "${search}".`
                : `We haven't stocked ${activeCategory} yet — check back soon!`}
            </p>
            <button onClick={() => { setActiveCategory('All'); setSearch(''); }} className="btn-gold">
              Browse All Fashion →
            </button>
          </div>
        )}

        {/* Product grid */}
        {!productsLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {filtered.map(product => (
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
        )}
      </div>

      {/* ── Bottom video carousel ── */}
      <div style={{ padding: 'clamp(24px, 4vw, 48px) 0' }}>
        <VideoCarousel tiles={bottomVideo} />
      </div>

      <ReviewSection
        reviews={reviews}
        loading={reviewsLoading}
        isAdmin={user?.role === 'admin'}
      />

      <Footer />
    </div>
  );
}