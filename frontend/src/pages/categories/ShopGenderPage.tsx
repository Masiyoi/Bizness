// src/pages/categories/ShopGenderPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import Navbar      from '../../components/common/Navbar';
import Footer      from '../../components/common/Footer';
import ProductCard from '../../components/home/ProductCard';
import Ornament    from '../../components/ui/Ornament';
import { readUser } from '../../constants/theme';
import emptyIcon from '../../assets/empty.png';
import type { Product, User } from '../../constants/theme';

type Gender = 'men' | 'women';
type Department = 'footwear' | 'clothing';

interface CategoryNode { id: string; name: string; slug: string; sort_order?: number; }
interface CategoryTree {
  men:   { footwear: CategoryNode[]; clothing: CategoryNode[] };
  women: { footwear: CategoryNode[]; clothing: CategoryNode[] };
}

const GENDER_META: Record<Gender, { headline: string; description: string; bannerUrl: string }> = {
  men:   { headline: 'Shop Men',   description: 'The full men\u2019s edit — footwear and clothing, all in one place.',   bannerUrl: '/banners/men.jpg' },
  women: { headline: 'Shop Women', description: 'The full women\u2019s edit — footwear and clothing, all in one place.', bannerUrl: '/banners/women.jpg' },
};

export default function ShopGenderPage() {
  const navigate = useNavigate();
  const { gender } = useParams<{ gender: Gender }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // department is an optional facet held in the query string (?department=footwear)
  // rather than the path, so this stays one route instead of duplicating
  // CategoryPage's per-category routing.
  const department = (searchParams.get('department') as Department | null) ?? null;

  const [user,       setUser]       = useState<User | null>(readUser);
  const [tree,       setTree]       = useState<CategoryTree | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState('featured');
  const [cartIds,    setCartIds]    = useState<number[]>([]);
  const [cartCount,  setCartCount]  = useState(0);
  const [wishlist,   setWishlist]   = useState<number[]>([]);
  const [navSpacerHeight, setNavSpacerHeight] = useState(96);

  // ── Category tree (for the "browse by category" quick links) ────
  useEffect(() => {
    axios.get('/api/categories/tree').then(r => setTree(r.data)).catch(() => {});
  }, []);

  // ── Fetch products for this gender, optionally narrowed by department ──
  useEffect(() => {
    if (!gender) return;
    setLoading(true);
    axios.get('/api/products', { params: { gender, department: department || undefined } })
      .then(res => {
        setProducts(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gender, department]);

  // ── Fetch cart ────────────────────────────────────────────────
  const fetchCart = useCallback(() => {
    if (!user || user.role === 'admin') { setCartIds([]); setCartCount(0); return; }
    axios.get('/api/cart')
      .then(res => {
        setCartIds(res.data.map((i: any) => i.product_id));
        setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0));
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // ── Fetch wishlist ───────────────────────────────────────────
  const fetchWishlist = useCallback(() => {
    if (!user || user.role === 'admin') { setWishlist([]); return; }
    axios.get('/api/wishlist')
      .then(res => setWishlist(res.data.map((i: any) => i.product_id)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // ── Cart toggle ──────────────────────────────────────────────
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

  // ── Measure real navbar height ─────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const navEl = document.querySelector('nav');
      if (navEl) setNavSpacerHeight(navEl.getBoundingClientRect().bottom);
    };
    measure();
    const t = setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

  // ── Sort ────────────────────────────────────────────────────
  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'newest')     return b.id - a.id;
    return 0;
  });

  if (!gender) return null;

  const meta = GENDER_META[gender];
  const setDepartment = (d: Department | null) => {
    const next = new URLSearchParams(searchParams);
    if (d) next.set('department', d); else next.delete('department');
    setSearchParams(next, { replace: true });
  };
  const categoriesForDept = department ? (tree?.[gender]?.[department] ?? []) : [];

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onLogout={handleLogout}
        transparentOnTop={false}
      />

      <div style={{ height: navSpacerHeight }} />

      {/* ── Hero Banner ── */}
      <div className="relative w-full h-[38vw] min-h-[200px] max-h-[420px] overflow-hidden">
        <img src={meta.bannerUrl} alt={meta.headline} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,5,3,0.75) 0%, rgba(8,5,3,0.1) 60%)' }} />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 font-sans text-[12px] font-semibold text-white bg-black/30 hover:bg-black/50 transition-colors px-3 py-1.5 rounded-full backdrop-blur-sm">
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10">
          <Ornament label={gender === 'men' ? 'Men' : 'Women'} />
          <h1 className="font-serif font-bold text-white mt-1" style={{ fontSize: 'clamp(24px, 5vw, 48px)', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            {meta.headline}
          </h1>
          <p className="font-sans text-white/70 text-[13px] mt-1 max-w-md">{meta.description}</p>
        </div>
      </div>

      {/* ── Department filter chips ── */}
      <div className="px-[5%] pt-5 flex flex-wrap items-center gap-2">
        {([null, 'footwear', 'clothing'] as const).map(d => (
          <button
            key={d ?? 'all'}
            onClick={() => setDepartment(d)}
            className="font-sans text-[10px] font-bold tracking-[1.5px] uppercase px-4 py-2 rounded-full transition-colors"
            style={{
              background: department === d ? '#111' : '#f5f5f5',
              color: department === d ? '#fff' : '#666',
              border: 'none', cursor: 'pointer',
            }}
          >
            {d === null ? 'All' : d === 'footwear' ? 'Footwear' : 'Clothing'}
          </button>
        ))}
      </div>

      {/* ── Category quick links — only once a department is picked ── */}
      {department && categoriesForDept.length > 0 && (
        <div className="px-[5%] pt-3 flex flex-wrap gap-2">
          {categoriesForDept.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/shop/${gender}/${department}/${c.slug}`)}
              className="font-sans text-[10px] tracking-[1px] uppercase px-3.5 py-1.5 rounded-full border border-cream-deep text-navy/70 hover:border-navy/40 transition-colors"
              style={{ background: '#fff', cursor: 'pointer' }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="px-[5%] py-4 mt-2 flex justify-between items-center border-b border-cream-deep">
        <span className="font-sans text-[12px] text-muted">
          {loading ? 'Loading...' : `${sorted.length} product${sorted.length !== 1 ? 's' : ''}`}
        </span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="font-sans border border-cream-deep rounded-md px-3 py-1.5 text-[11px] text-navy bg-white cursor-pointer outline-none">
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* ── Products ── */}
      <div className="px-[5%] py-8">
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

        {!loading && sorted.length === 0 && (
          <div className="text-center py-20">
            <img src={emptyIcon} alt="No products available" className="w-20 h-20 mx-auto mb-4 opacity-70 object-contain" />
            <p className="font-sans font-bold text-[16px] text-navy mb-2">No products here yet</p>
            <p className="font-sans text-[13px] text-muted mb-6">
              We're stocking up {gender === 'men' ? "men's" : "women's"}{department ? ` ${department}` : ''} — check back soon!
            </p>
            <button onClick={() => navigate('/')} className="font-sans text-[11px] font-semibold tracking-[2px] uppercase bg-black text-white px-8 py-3.5 hover:bg-[#222] transition-colors">
              Back to Home →
            </button>
          </div>
        )}

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