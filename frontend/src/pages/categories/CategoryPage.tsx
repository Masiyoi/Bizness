// src/pages/categories/CategoryPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// Optional per-slug overrides for the hero banner / copy / badge that your old
// Bags.tsx, Heels.tsx, etc. used to hardcode. Anything not listed here falls
// back to a generic banner + auto-generated copy, so a brand-new category
// created purely in the DB "just works" with zero frontend changes.
const CATEGORY_META: Record<string, { bannerUrl?: string; description?: string; badge?: string; badgeStyle?: 'gold' | 'red' }> = {
  'men-sandals-slides': {
    bannerUrl: 'https://placehold.co/1600x600/2b2b2b/ffffff?text=Sandals+%26+Slides',
    description: 'Upgrade your warm weather footwear. Browse breathable sandals, easy pool slides, and supportive footbed designs made for effortless casual wear. Explore now.',
  },
  'men-sneakers': {
    bannerUrl: 'https://placehold.co/1600x600/2b2b2b/ffffff?text=Sneakers',
    description: 'Explore everyday sneakers, high performance running shoes, and iconic court classics. Shop lightweight, durable kicks built for all day comfort. Order now.',
  },
  'men-boots': {
    bannerUrl: 'https://placehold.co/1600x600/2b2b2b/ffffff?text=Boots',
    description: 'Step out in premium leather and suede boots. From sleek chelsea boots to heavy duty outdoor and combat styles, discover durable footwear made to last. Shop now.',
  },
  'men-formal-shoes': {
    bannerUrl: 'https://placehold.co/1600x600/2b2b2b/ffffff?text=Formal+Shoes',
    description: 'Elevate your wardrobe with handcrafted formal footwear. Browse classic leather oxfords, brogues, and tailored loafers built for sharp professional style. Shop now.',
  },
};

const DEFAULT_BANNER = '/banners/default.jpg';

export default function CategoryPage() {
  const navigate = useNavigate();
  const { gender, department, slug } = useParams<{ gender: Gender; department: Department; slug: string }>();

  const [user,       setUser]       = useState<User | null>(readUser);
  const [tree,       setTree]       = useState<CategoryTree | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState('featured');
  const [cartIds,    setCartIds]    = useState<number[]>([]);
  const [cartCount,  setCartCount]  = useState(0);
  const [wishlist,   setWishlist]   = useState<number[]>([]);
  const [navSpacerHeight, setNavSpacerHeight] = useState(96);

  // ── Resolve display name from the same tree the navbar uses ─────
  useEffect(() => {
    axios.get('/api/categories/tree').then(r => setTree(r.data)).catch(() => {});
  }, []);

  const categoryNode = gender && department
    ? tree?.[gender]?.[department]?.find(c => c.slug === slug)
    : undefined;

  const fallbackName = (slug ?? '').replace(/-/g, ' ');
  const categoryName = categoryNode?.name ?? fallbackName;
  const meta          = CATEGORY_META[slug ?? ''] ?? {};
  const headline      = categoryNode?.name ?? categoryName;
  const description   = meta.description ?? `Shop our full ${categoryName.toLowerCase()} collection.`;
  const bannerUrl      = meta.bannerUrl ?? DEFAULT_BANNER;

  // ── Fetch products for this gender/department/slug ──────────────
  // Backend resolves `category` (the slug) to a category_id and filters by
  // gender + department too, so a stale/mismatched combination in the URL
  // just returns an empty set rather than someone else's products.
  useEffect(() => {
    if (!gender || !department || !slug) return;
    setLoading(true);
    axios.get('/api/products', { params: { gender, department, category: slug } })
      .then(res => {
        setProducts(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gender, department, slug]);

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

  // ── Fetch wishlist ───────────────────────────────────────────────
  const fetchWishlist = useCallback(() => {
    if (!user || user.role === 'admin') { setWishlist([]); return; }
    axios.get('/api/wishlist')
      .then(res => setWishlist(res.data.map((i: any) => i.product_id)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // ── Cart toggle ───────────────────────────────────────────────
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

  // ── Wishlist toggle ──────────────────────────────────────────
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

  // ── Measure real navbar height ────────────────────────────────
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

  // ── Sort ─────────────────────────────────────────────────────
  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'newest')     return b.id - a.id;
    return 0;
  });

  if (!gender || !department || !slug) return null;

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
        <img src={bannerUrl} alt={categoryName} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,5,3,0.75) 0%, rgba(8,5,3,0.1) 60%)' }} />
        {meta.badge && (
          <span className={`absolute top-4 right-4 z-10 font-sans text-[11px] font-bold px-3 py-1.5 rounded-full tracking-[0.5px] ${
            meta.badgeStyle === 'red' ? 'bg-[#e8443a] text-white' : 'bg-gold text-navy'
          }`}>
            {meta.badge}
          </span>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 font-sans text-[12px] font-semibold text-white bg-black/30 hover:bg-black/50 transition-colors px-3 py-1.5 rounded-full backdrop-blur-sm">
          ← Back
        </button>
        <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10">
          <Ornament label={categoryName} />
          <h1 className="font-serif font-bold text-white mt-1" style={{ fontSize: 'clamp(24px, 5vw, 48px)', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
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
              We're stocking up {categoryName} — check back soon!
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