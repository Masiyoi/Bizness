// src/components/home/SlidingProductStrip.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Horizontal slider with:
//  • Gradient bridge (hero dark → cream) baked in at the top
//  • Editorial header — gold label + serif italic accent
//  • Cards identical to ProductCard: hover scale, Quick View slide-up, sold-out
//  • Drag / touch scroll, arrow buttons, cream skeleton shimmer
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../constants/theme';
import { T } from '../../constants/theme';

interface Props {
  products: Product[];
  loading?: boolean;
}

const CARD_W = 260; // px — each card width

export default function SlidingProductStrip({ products, loading = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  // ── drag state ───────────────────────────────────────────────
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const scrollStart = useRef(0);
  const moved       = useRef(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows, products]);

  const scroll = (dir: 1 | -1) =>
    trackRef.current?.scrollBy({ left: dir * (CARD_W + 20) * 2, behavior: 'smooth' });

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current  = true;
    moved.current       = false;
    dragStartX.current  = e.clientX;
    scrollStart.current = trackRef.current?.scrollLeft ?? 0;
    trackRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 4) moved.current = true;
    if (trackRef.current) trackRef.current.scrollLeft = scrollStart.current - dx;
  };
  const onPointerUp = () => { isDragging.current = false; };
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) { e.preventDefault(); e.stopPropagation(); }
  };

  const skeletons = Array.from({ length: 6 });

  return (
    <>
      {/* ── Gradient bridge: hero dark navy → page cream ────────────────────
          This is the key fix — removes the hard colour cut between Hero and
          the product strip. Hero must end with background ~#0a0f1e for this
          to blend correctly.                                                 */}
      <div style={{
        height: 80,
        background: 'linear-gradient(to bottom, #0a0f1e 0%, #f7f3ec 100%)',
        flexShrink: 0,
      }} />

      <section style={{
        background: '#f7f3ec',
        padding: '0 0 clamp(40px,5vw,72px)',
        userSelect: 'none',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '40px clamp(20px,5%,80px) 28px',
          borderBottom: '0.5px solid #d4c9b0',
          marginBottom: 28,
        }}>
          <div>
            <p style={{
              fontFamily: 'sans-serif',
              fontSize: 10,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#b89c6e',
              margin: '0 0 6px',
            }}>
              New Arrivals
            </p>
            <h2 style={{
              fontFamily: 'serif',
              fontWeight: 600,
              fontSize: 'clamp(22px,3vw,36px)',
              color: '#0D1B3E',
              margin: 0,
              lineHeight: 1.1,
            }}>
              Shop the{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#b89c6e' }}>
                Collection
              </em>
            </h2>
          </div>

          {/* Arrow buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['left', 'right'] as const).map(dir => {
              const enabled = dir === 'left' ? canLeft : canRight;
              return (
                <button
                  key={dir}
                  onClick={() => scroll(dir === 'left' ? -1 : 1)}
                  disabled={!enabled}
                  aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
                  style={{
                    width: 40,
                    height: 40,
                    border: `1.5px solid ${enabled ? '#0D1B3E' : '#DDD'}`,
                    borderRadius: '50%',
                    background: 'transparent',
                    color: enabled ? '#0D1B3E' : '#CCC',
                    fontSize: 15,
                    cursor: enabled ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background .2s, color .2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    if (enabled) {
                      e.currentTarget.style.background = '#0D1B3E';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = enabled ? '#0D1B3E' : '#CCC';
                  }}
                >
                  {dir === 'left' ? '←' : '→'}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable track ── */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClickCapture={onClickCapture}
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            cursor: 'grab',
            paddingLeft:  'clamp(20px,5%,80px)',
            paddingRight: 'clamp(20px,5%,80px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Hide webkit scrollbar */}
          <style>{`
            .strip-track::-webkit-scrollbar { display: none; }
          `}</style>

          {loading
            ? skeletons.map((_, i) => <SkeletonCard key={i} />)
            : products.map(p => <SlideCard key={p.id} product={p} />)
          }
        </div>

        {/* ── View all link ── */}
        <div style={{
          textAlign: 'center',
          paddingTop: 28,
          borderTop: '0.5px solid #d4c9b0',
          margin: '44px clamp(20px,5%,80px) 0',
        }}>
          <Link
            to="/#product-grid-top"
            style={{
              fontFamily: 'sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#0D1B3E',
              textDecoration: 'none',
              borderBottom: '1px solid #0D1B3E',
              paddingBottom: 2,
            }}
          >
            View All Products →
          </Link>
        </div>

      </section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideCard — mirrors ProductCard exactly:
//   hover scale · Quick View slide-up · sold-out overlay · name + price below
// ─────────────────────────────────────────────────────────────────────────────
function SlideCard({ product }: { product: Product }) {
  const stock = product.stock ?? 0;
  const [hovered,       setHovered]       = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Lazy-load QuickViewModal only when first opened
  const [QuickView, setQuickView] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    if (quickViewOpen && !QuickView) {
      import('./QuickViewModal').then(m => setQuickView(() => m.default));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickViewOpen]);

  return (
    <>
      <div
        className="group"
        style={{ flexShrink: 0, width: CARD_W, scrollSnapAlign: 'start' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        {/* ── Image block ── */}
        <Link
          to={`/product/${product.id}`}
          style={{
            display: 'block',
            position: 'relative',
            overflow: 'hidden',
            background: '#F5F5F5',
          }}
        >
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '4/5',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/260x325/F0EAD8/0D1B3E?text=Luku+Prime';
            }}
          />

          {/* Sold-out overlay */}
          {stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                background: '#fff',
                color: '#0D1B3E',
                fontFamily: 'sans-serif',
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '5px 14px',
              }}>
                Sold Out
              </span>
            </div>
          )}

          {/* Quick View — slides up on hover */}
          <button
            onClick={e => { e.preventDefault(); setQuickViewOpen(true); }}
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              transform: hovered ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
              border: 'none',
              cursor: 'pointer',
              zIndex: 3,
              fontFamily: 'sans-serif',
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '11px 0',
              background: 'rgba(255,255,255,0.95)',
              color: T.navy,
              backdropFilter: 'blur(6px)',
            }}
          >
            Quick View
          </button>
        </Link>

        {/* ── Info ── */}
        <div style={{ paddingTop: 12, paddingBottom: 4 }}>
          <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              fontFamily: 'sans-serif',
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#111',
              lineHeight: 1.4,
              marginBottom: 4,
              opacity: hovered ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}>
              {product.name}
            </div>
          </Link>
          <div style={{
            fontFamily: 'sans-serif',
            fontSize: 11,
            letterSpacing: '0.5px',
            color: '#555',
          }}>
            KSh {Number(product.price).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Quick View Modal — lazy mounted */}
      {quickViewOpen && QuickView && (
        <QuickView
          product={product}
          inCart={false}
          inWishlist={false}
          isAdmin={false}
          onCartToggle={() => {}}
          onWishlistToggle={() => {}}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — cream palette shimmer while products load
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: CARD_W, scrollSnapAlign: 'start' }}>
      <div style={{
        width: '100%',
        aspectRatio: '4/5',
        position: 'relative',
        background: '#E8E4DC',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.45) 50%,transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      </div>
      <div style={{ paddingTop: 12 }}>
        <div style={{ height: 10, width: '70%', background: '#E0DBCF', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ height: 9,  width: '40%', background: '#E0DBCF', borderRadius: 2 }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}