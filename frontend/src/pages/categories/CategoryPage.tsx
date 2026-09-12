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
  // ── Men's Footwear ──────────────────────────────────────────
  'men-sandals-slides': {
    bannerUrl: 'https://images.pexels.com/photos/20298288/pexels-photo-20298288.jpeg?auto=compress&cs=tinysrgb&w=1600&h=600&fit=crop',
    description: 'Upgrade your warm weather footwear. Browse breathable sandals, easy pool slides, and supportive footbed designs made for effortless casual wear. Explore now.',
  },
  'men-sneakers': {
    bannerUrl: 'https://picsum.photos/seed/men-sneakers/1600/600',
    description: 'Explore everyday sneakers, high-performance running shoes, and iconic court classics. Shop lightweight, durable kicks built for all-day comfort. Order today.',
  },
  'men-boots': {
    bannerUrl: 'https://picsum.photos/seed/men-boots/1600/600',
    description: 'Step out in premium leather and suede boots. From sleek Chelsea boots to heavy-duty outdoor and combat styles, discover durable footwear made to last. Shop now.',
  },
  'men-formal-shoes': {
    bannerUrl: 'https://picsum.photos/seed/men-formal-shoes/1600/600',
    description: 'Elevate your wardrobe with handcrafted formal footwear. Browse classic leather Oxfords, brogues, and tailored dress loafers built for sharp, professional style.',
  },

  // ── Men's Clothing ────────────────────────────────────────────
  'men-tops': {
    bannerUrl: 'https://picsum.photos/seed/men-tops/1600/600',
    description: 'Upgrade your daily rotation with tailored button-downs, casual tees, and versatile tops. Breathable fabrics made to layer or stand alone. Shop now.',
  },
  'men-bottoms': {
    bannerUrl: 'https://picsum.photos/seed/men-bottoms/1600/600',
    description: 'Discover the perfect fit. Explore durable denim, tailored trousers, casual chinos, and everyday shorts built for versatile wear and effortless style.',
  },
  'men-outwear': {
    bannerUrl: 'https://picsum.photos/seed/men-outwear/1600/600',
    description: 'Brave the elements in style. Shop functional trench coats, insulated parkas, and tailored overcoats crafted for dependable warmth and modern layering.',
  },
  'men-sets': {
    bannerUrl: 'https://picsum.photos/seed/men-sets/1600/600',
    description: 'Take the guesswork out of dressing with matching two-piece sets. Browse relaxed lounge duos, tailored co-ords, and effortless statement pairings today.',
  },
  'men-headgear': {
    bannerUrl: 'https://picsum.photos/seed/men-headgear/1600/600',
    description: 'Top off your fit with premium headwear. Shop structured baseball caps, warm knit beanies, and classic bucket hats designed for every season and style.',
  },
  'men-hoodies-jackets': {
    bannerUrl: 'https://picsum.photos/seed/men-hoodies-jackets/1600/600',
    description: 'Layer up with fleece hoodies, casual zip-ups, and lightweight transitional jackets. Premium comfort and street-ready style built for everyday wear.',
  },
  'men-loungewear': {
    bannerUrl: 'https://picsum.photos/seed/men-loungewear/1600/600',
    description: 'Unwind in luxury. Explore ultra-soft sweatpants, breathable modal lounge tees, and cozy matching sleepwear engineered for premium off-duty comfort.',
  },
  'men-socks': {
    bannerUrl: 'https://picsum.photos/seed/men-socks/1600/600',
    description: 'Step into all-day support with breathable cotton crew socks, invisible no-shows, and cushioned everyday pairs made to stay in place. Order now.',
  },
  'men-accessories': {
    bannerUrl: 'https://picsum.photos/seed/men-accessories/1600/600',
    description: 'Complete every look with essential accessories. Browse genuine leather belts, functional everyday bags, sunglasses, and wallets built to last.',
  },

  // ── Women's Footwear ────────────────────────────────────────
  'women-sneakers-athletic': {
    bannerUrl: 'https://picsum.photos/seed/women-sneakers/1600/600',
    description: 'Explore everyday sneakers, high-performance running shoes, and iconic court classics. Shop lightweight, durable kicks built for all-day comfort. Order today.',
  },
  'women-boots': {
    bannerUrl: 'https://picsum.photos/seed/women-boots/1600/600',
    description: 'Step out in premium leather and suede boots. From sleek Chelsea boots to heavy-duty outdoor and combat styles, discover durable footwear made to last. Shop now.',
  },
  'women-formal-dress': {
    bannerUrl: 'https://picsum.photos/seed/women-formal/1600/600',
    description: 'Elevate your wardrobe with handcrafted formal footwear. Browse classic leather Oxfords, brogues, and tailored dress loafers built for sharp, professional style.',
  },
  'women-heels': {
    bannerUrl: 'https://picsum.photos/seed/women-heels/1600/600',
    description: 'Find your perfect lift. Shop elegant pointed pumps, supportive block heels, and statement platforms designed for evening events and everyday sophistication.',
  },
  'women-sandals-slides': {
    bannerUrl: 'https://picsum.photos/seed/women-sandals/1600/600',
    description: 'Upgrade your warm-weather footwear. Browse breathable sandals, easy pool slides, and supportive footbed designs made for effortless casual wear. Explore now.',
  },
  'women-flats-casuals': {
    bannerUrl: 'https://picsum.photos/seed/women-flats/1600/600',
    description: 'Discover effortless daily comfort with our collection of ballet flats, leather driving moccasins, and slip-on loafers. Stylish, versatile, and made to move.',
  },

  // ── Women's Clothing ──────────────────────────────────────────
  'women-tops': {
    bannerUrl: 'https://picsum.photos/seed/women-tops/1600/600',
    description: 'Upgrade your rotation with women\u2019s tops. Shop breezy linen blouses, soft knit tees, and elegant camis designed for effortless workday-to-weekend layering.',
  },
  'women-bottoms': {
    bannerUrl: 'https://picsum.photos/seed/women-bottoms/1600/600',
    description: 'Find your perfect fit with women\u2019s bottoms. Browse flattering high-rise jeans, tailored wide-leg trousers, and versatile everyday skirts made for movement.',
  },
  'women-outwear': {
    bannerUrl: 'https://picsum.photos/seed/women-outwear/1600/600',
    description: 'Stay chic in any forecast. Discover women\u2019s trench coats, warm wool overcoats, and tailored parkas crafted for effortless layering and cold-weather style.',
  },
  'women-sets': {
    bannerUrl: 'https://picsum.photos/seed/women-sets/1600/600',
    description: 'Look put-together instantly with women\u2019s matching sets. Explore chic knit duos, tailored two-piece blazers, and breezy linen co-ords for everyday elegance.',
  },
  'women-headgear': {
    bannerUrl: 'https://picsum.photos/seed/women-headgear/1600/600',
    description: 'Top off your look with women\u2019s headwear. Browse structured sun hats, ribbed knit beanies, and classic baseball caps designed for bad-hair-days and beyond.',
  },
  'women-hoodies-jackets': {
    bannerUrl: 'https://picsum.photos/seed/women-hoodies-jackets/1600/600',
    description: 'Layer up with cozy women\u2019s hoodies, cropped denim jackets, and lightweight zip layers. Effortless street-ready silhouettes built for all-day warmth.',
  },
  'women-loungewear': {
    bannerUrl: 'https://picsum.photos/seed/women-loungewear/1600/600',
    description: 'Unwind in luxury with soft women\u2019s loungewear. Shop plush modal robes, relaxed joggers, and matching cozy sweat sets designed for stylish downtime at home.',
  },
  'women-socks': {
    bannerUrl: 'https://picsum.photos/seed/women-socks/1600/600',
    description: 'Treat your feet with women\u2019s socks and hosiery. Explore ribbed crew socks, no-slip invisible liners, and breathable everyday cotton pairs that stay up.',
  },
  'women-accessories': {
    bannerUrl: 'https://picsum.photos/seed/women-accessories/1600/600',
    description: 'Add the finishing touch with chic women\u2019s accessories. Browse versatile leather crossbody bags, statement belts, jewelry, and UV sunglasses today.',
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