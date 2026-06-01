// src/components/home/SlidingProductStrip.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-bleed horizontal slider — NOLOGO-style.
// • Drag / touch scroll (no scrollbar)
// • Arrow buttons  ←  →
// • Image fills the card; name + price sit below in sparse uppercase type
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../constants/theme';

interface Props {
  products: Product[];
  loading?: boolean;
}

const CARD_W   = 280;   // px — each card width
const CARD_GAP = 0;     // gap handled by padding inside track

export default function SlidingProductStrip({ products, loading = false }: Props) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  // ── drag state ───────────────────────────────────────────────
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const scrollStart = useRef(0);
  const moved       = useRef(false);          // did we actually drag (vs click)?

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

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * (CARD_W + 24) * 2, behavior: 'smooth' });
  };

  // ── pointer drag ─────────────────────────────────────────────
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

  // Prevent click-through after drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) { e.preventDefault(); e.stopPropagation(); }
  };

  const skeletons = Array.from({ length: 6 });

  return (
    <section style={{ padding: '0 0 clamp(40px,5vw,72px)', userSelect: 'none' }}>

      {/* ── Header row ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 clamp(20px,5%,80px)',
        marginBottom: 28,
      }}>
        <div>
          <p style={{
            fontFamily: 'sans-serif', fontSize: 10,
            letterSpacing: '3px', textTransform: 'uppercase',
            color: '#888', marginBottom: 6,
          }}>
            — All Products
          </p>
          <h2 style={{
            fontFamily: 'serif', fontWeight: 700,
            fontSize: 'clamp(20px,3vw,30px)',
            color: '#0D1B3E', margin: 0, lineHeight: 1.1,
          }}>
            Shop the Collection
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
                  width: 40, height: 40,
                  border: `1.5px solid ${enabled ? '#0D1B3E' : '#DDD'}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  color: enabled ? '#0D1B3E' : '#CCC',
                  fontSize: 15, cursor: enabled ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          paddingLeft:  'clamp(20px,5%,80px)',
          paddingRight: 'clamp(20px,5%,80px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* hide scrollbar in webkit */}
        <style>{`
          [data-strip-track]::-webkit-scrollbar { display: none; }
        `}</style>

        {loading
          ? skeletons.map((_, i) => <SkeletonCard key={i} />)
          : products.map(p => <SlideCard key={p.id} product={p} />)
        }
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual card — mirrors NOLOGO: tall image, no border, sparse text below
// ─────────────────────────────────────────────────────────────────────────────
function SlideCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const stock = product.stock ?? 0;

  return (
    <Link
      to={`/product/${product.id}`}
      style={{
        display: 'block',
        flexShrink: 0,
        width: CARD_W,
        scrollSnapAlign: 'start',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container — 4:5 ratio */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '125%',   // 4:5
        overflow: 'hidden',
        background: '#F0F0EE',
      }}>
        <img
          src={product.image_url}
          alt={product.name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform .5s cubic-bezier(.25,.46,.45,.94)',
            display: 'block',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/280x350/F0EAD8/0D1B3E?text=Luku+Prime';
          }}
        />

        {/* Sold out badge */}
        {stock === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: '#fff',
              fontFamily: 'sans-serif', fontWeight: 700,
              fontSize: 9, letterSpacing: '2.5px', textTransform: 'uppercase',
              padding: '5px 14px', color: '#0D1B3E',
            }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ paddingTop: 12 }}>
        <div style={{
          fontFamily: 'sans-serif', fontWeight: 400,
          fontSize: 11, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: '#111',
          lineHeight: 1.4, marginBottom: 4,
        }}>
          {product.name}
        </div>
        <div style={{
          fontFamily: 'sans-serif', fontSize: 11,
          letterSpacing: '0.5px', color: '#555',
        }}>
          KSh {Number(product.price).toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: CARD_W, scrollSnapAlign: 'start' }}>
      <div style={{
        width: '100%', paddingBottom: '125%', position: 'relative',
        background: '#EBEBEB', borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent 25%,rgba(255,255,255,0.5) 50%,transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      </div>
      <div style={{ paddingTop: 10 }}>
        <div style={{ height: 10, width: '70%', background: '#E8E8E8', borderRadius: 2, marginBottom: 6 }} />
        <div style={{ height: 9,  width: '40%', background: '#E8E8E8', borderRadius: 2 }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}