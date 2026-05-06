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

import { readUser, T } from '../constants/theme';
import type { Product, HomepageReview, User } from '../constants/theme';

const PRODUCTS_PER_PAGE = 8;

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

  // ── Pagination ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

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
  if (!user || user.role === 'admin') { setCartIds([]); setCartCount(0); return; }
  axios.get('/api/cart')
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

  // ── Wishlist toggle ───────────────────────────────────────────
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

  // ── Reset to page 1 when filter/search changes ────────────────
  useEffect(() => { setCurrentPage(1); }, [activeCategory, search]);

  // ── Pagination math ───────────────────────────────────────────
  const totalPages   = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const pageStart    = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated    = filtered.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll back up to the product grid smoothly
    document.getElementById('product-grid-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Build page number list with ellipsis e.g. [1, '...', 4, 5, 6, '...', 12]
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

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

        {/* Scroll anchor — sits above the header so the heading is visible after page change */}
        <div id="product-grid-top" style={{ scrollMarginTop: 80 }} />

        <div className="flex justify-between items-end mb-5 gap-3 flex-wrap">
          <div>
            <Ornament label={activeCategory === 'All' ? 'Curated for You' : activeCategory} />
            <h2 className="font-serif font-bold text-navy" style={{ fontSize:'clamp(18px,3vw,26px)' }}>
              {activeCategory === 'All' ? 'Featured Fashion' : activeCategory}
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-sans text-[11px] text-muted">
              {filtered.length > 0
                ? `${pageStart + 1}–${Math.min(pageStart + PRODUCTS_PER_PAGE, filtered.length)} of ${filtered.length} items`
                : '0 items'
              }
            </span>
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
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-6 gap-y-10">
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

        {/* Product grid — paginated slice */}
        {!productsLoading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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

            {/* ── Pagination controls ── */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 40,
                flexWrap: 'wrap',
              }}>

                {/* Prev */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px',
                    fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    border: `1.5px solid ${currentPage === 1 ? '#DDD' : T.navy}`,
                    borderRadius: 6,
                    background: 'transparent',
                    color: currentPage === 1 ? '#CCC' : T.navy,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = T.navy;
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = currentPage === 1 ? '#CCC' : T.navy;
                  }}
                >
                  ← Prev
                </button>

                {/* Page number pills */}
                {getPageNumbers().map((page, idx) =>
                  page === '...'
                    ? (
                      <span key={`ellipsis-${idx}`} style={{
                        fontFamily: 'sans-serif', fontSize: 12,
                        color: '#AAA', padding: '0 4px', userSelect: 'none',
                      }}>
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page as number)}
                        style={{
                          width: 36, height: 36,
                          borderRadius: 6,
                          border: page === currentPage ? 'none' : `1.5px solid #DDD`,
                          background: page === currentPage ? T.gold : 'transparent',
                          color: page === currentPage ? T.navy : '#777',
                          fontFamily: 'sans-serif',
                          fontSize: 12, fontWeight: page === currentPage ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'background 0.18s, color 0.18s, border 0.18s',
                        }}
                        onMouseEnter={e => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = '#F5EDD5';
                            e.currentTarget.style.color = T.navy;
                          }
                        }}
                        onMouseLeave={e => {
                          if (page !== currentPage) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#777';
                          }
                        }}
                      >
                        {page}
                      </button>
                    )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px',
                    fontFamily: 'sans-serif', fontSize: 11, fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    border: `1.5px solid ${currentPage === totalPages ? '#DDD' : T.navy}`,
                    borderRadius: 6,
                    background: 'transparent',
                    color: currentPage === totalPages ? '#CCC' : T.navy,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.background = T.navy;
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = currentPage === totalPages ? '#CCC' : T.navy;
                  }}
                >
                  Next →
                </button>

              </div>
            )}

            {/* Page indicator text */}
            {totalPages > 1 && (
              <p style={{
                textAlign: 'center', marginTop: 12,
                fontFamily: 'sans-serif', fontSize: 11,
                color: '#AAA', letterSpacing: '0.5px',
              }}>
                Page {currentPage} of {totalPages}
              </p>
            )}
          </>
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