// src/pages/categories/CategoryPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar      from '../../components/common/Navbar';
import Footer      from '../../components/common/Footer';
import ProductCard from '../../components/home/ProductCard';
import Ornament    from '../../components/ui/Ornament';
import { readUser } from '../../constants/theme';
import type { Product, User } from '../../constants/theme';


interface CategoryPageProps {
  categoryName: string;
  headline:     string;
  description:  string;
  bannerUrl:    string;
  badge?:       string;
  badgeStyle?:  'gold' | 'red';
  apiEndpoint?: string;
}

export default function CategoryPage({
  categoryName,
  headline,
  description,
  bannerUrl,
  badge,
  badgeStyle,
  apiEndpoint,
}: CategoryPageProps) {
  const navigate = useNavigate();

  const [user,       setUser]       = useState<User | null>(readUser);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState('featured');
  const [cartIds,    setCartIds]    = useState<number[]>([]);
  const [cartCount,  setCartCount]  = useState(0);
  const [wishlist,   setWishlist]   = useState<number[]>([]);

  // ── Fetch products ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const url = apiEndpoint
      ?? `/api/products?category=${encodeURIComponent(categoryName)}`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        setProducts(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categoryName, apiEndpoint]);

  // ── Fetch cart ─────────────────────────────────────────────────
const fetchCart = useCallback(() => {
  if (!user || user.role === 'admin') {
    setCartIds([]); setCartCount(0); return;
  }
  axios.get('/api/cart')
      .then(res => {
        setCartIds(res.data.map((i: any) => i.product_id));
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // ── Fetch wishlist ─────────────────────────────────────────────
  const fetchWishlist = useCallback(() => {
  if (!user || user.role === 'admin') { setWishlist([]); return; }
  axios.get('/api/wishlist')
      .then(res => setWishlist(res.data.map((i: any) => i.product_id)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // ── Cart toggle ────────────────────────────────────────────────
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

  // ── Wishlist toggle ────────────────────────────────────────────
const toggleWishlist = async (productId: number) => {
  if (!user) { navigate('/login'); return; }
    if (wishlist.includes(productId)) {
      setWishlist(p => p.filter(id => id !== productId));
      try { await axios.delete(`/api/wishlist/${productId}`); }
      catch { fetchWishlist(); }
    } else {
      setWishlist(p => [...p, productId]);
      try { await axios.post('/api/wishlist', { product_id: productId }); }
      catch { fetchWishlist(); }
    }
  };

  const handleLogout = () => {
    setUser(null); setCartIds([]); setCartCount(0); setWishlist([]);
  };

  // ── Sort ───────────────────────────────────────────────────────
  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'newest')     return b.id - a.id;
    return 0;
  });

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onLogout={handleLogout}
      />

      {/* ── Hero Banner ── */}
      <div className="relative w-full h-[38vw] min-h-[200px] max-h-[420px] overflow-hidden">
        <img
          src={bannerUrl}
          alt={categoryName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(8,5,3,0.75) 0%, rgba(8,5,3,0.1) 60%)' }}
        />
        {badge && (
          <span className={`absolute top-4 right-4 z-10 font-sans text-[11px] font-bold px-3 py-1.5 rounded-full tracking-[0.5px] ${
            badgeStyle === 'red' ? 'bg-[#e8443a] text-white' : 'bg-gold text-navy'
          }`}>
            {badge}
          </span>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 font-sans text-[12px] font-semibold text-white bg-black/30 hover:bg-black/50 transition-colors px-3 py-1.5 rounded-full backdrop-blur-sm"
        >
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10">
          <Ornament label={categoryName} />
          <h1
            className="font-serif font-bold text-white mt-1"
            style={{ fontSize: 'clamp(24px, 5vw, 48px)', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
          >
            {headline}
          </h1>
          <p className="font-sans text-white/70 text-[13px] mt-1 max-w-md">{description}</p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="px-[5%] py-4 flex justify-between items-center border-b border-cream-deep">
        <span className="font-sans text-[12px] text-muted">
          {loading ? 'Loading...' : `${sorted.length} product${sorted.length !== 1 ? 's' : ''}`}
        </span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="font-sans border border-cream-deep rounded-md px-3 py-1.5 text-[11px] text-navy bg-white cursor-pointer outline-none"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* ── Products ── */}
      <div className="px-[5%] py-8">

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-card overflow-hidden border border-cream-deep">
                <div className="skel h-60" />
                <div className="p-3.5 bg-white">
                  <div className="skel h-3 w-[70%] mb-2" />
                  <div className="skel h-2.5 w-[40%] mb-3" />
                  <div className="skel h-9" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="font-sans font-bold text-[16px] text-navy mb-2">No products here yet</p>
            <p className="font-sans text-[13px] text-muted mb-6">
              We're stocking up {categoryName} — check back soon!
            </p>
            <button onClick={() => navigate('/')} className="btn-gold">
              Back to Home →
            </button>
          </div>
        )}

        {/* Product grid */}
        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {sorted.map(product => (
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

      <Footer />
    </div>
  );
}