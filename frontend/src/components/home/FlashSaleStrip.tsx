import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import type { Product } from '../../constants/theme';

interface FlashProduct {
  id:           number;
  name:         string;
  price:        string | number;   // original full price
  sale_price:   number;
  sale_ends_at: string | null;
  images:       string[];
  image_url:    string | null;
  category:     string | null;
  stock?:       number;
  created_at?:  string;
}

interface FlashSaleStripProps {
  cartIds:          number[];
  wishlistIds:      number[];
  isAdmin:          boolean;
  onCartToggle:     (id: number) => void;
  onWishlistToggle: (id: number) => void;
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(endsAt: string | null) {
  const calc = () => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, expired: false };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return time;
}

// ── Header countdown (uses earliest expiry) ────────────────────────────────────
function HeaderCountdown({ products }: { products: FlashProduct[] }) {
  const earliest = products
    .map(p => p.sale_ends_at)
    .filter(Boolean)
    .map(d => new Date(d!).getTime())
    .sort((a, b) => a - b)[0];
  const countdown = useCountdown(earliest ? new Date(earliest).toISOString() : null);
  if (!countdown || countdown.expired) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 600, color: '#C2410C', letterSpacing: '1px', textTransform: 'uppercase' }}>Ends in</span>
      {[{ v: countdown.h, l: 'h' }, { v: countdown.m, l: 'm' }, { v: countdown.s, l: 's' }].map(({ v, l }) => (
        <span key={l} style={{
          fontFamily: 'Jost,sans-serif', fontWeight: 800, fontSize: 13,
          background: '#0A0A0A', color: '#fff',
          padding: '3px 7px', borderRadius: 4, minWidth: 28, textAlign: 'center',
        }}>
          {String(v).padStart(2, '0')}<span style={{ fontWeight: 400, fontSize: 9, marginLeft: 1 }}>{l}</span>
        </span>
      ))}
    </div>
  );
}

// ── Sale price badge overlaid on a ProductCard tile ────────────────────────────
function SaleBadge({ p }: { p: FlashProduct }) {
  const original = Number(p.price);
  const sale     = Number(p.sale_price);
  const pctOff   = Math.round(((original - sale) / original) * 100);
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 5,
      background: '#EF4444', color: '#fff',
      fontFamily: 'Jost,sans-serif', fontWeight: 800, fontSize: 11,
      padding: '4px 9px', borderRadius: 6, letterSpacing: '0.5px',
      boxShadow: '0 2px 8px rgba(239,68,68,0.4)', pointerEvents: 'none',
    }}>
      -{pctOff}%
    </div>
  );
}

// ── Main strip ────────────────────────────────────────────────────────────────
const AUTO_SCROLL_SPEED = 0.6; // px per frame (~36px/sec at 60fps)
const RESUME_DELAY      = 1800; // ms after user interaction before auto-scroll resumes

export default function FlashSaleStrip({
  cartIds, wishlistIds, isAdmin, onCartToggle, onWishlistToggle,
}: FlashSaleStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [products,         setProducts]         = useState<FlashProduct[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [paused,           setPaused]           = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [drawerOpen,       setDrawerOpen]       = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/products/flash-sales?limit=20')
      .then(r => { setProducts(Array.isArray(r.data) ? r.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Auto-scroll loop ──────────────────────────────────────────────────────
  const rafId       = useRef<number | null>(null);
  const resumeTimer  = useRef<number | null>(null);

  useEffect(() => {
    if (loading || products.length === 0) return;

    const step = () => {
      const el = stripRef.current;
      if (el && !paused) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          if (el.scrollLeft >= maxScroll - 1) {
            el.scrollLeft = 0; // loop back to start
          } else {
            el.scrollLeft += AUTO_SCROLL_SPEED;
          }
        }
      }
      rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [loading, products.length, paused]);

  const pauseAndScheduleResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_DELAY);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }, []);

  // Drag-to-scroll (also pauses auto-scroll)
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    pauseAndScheduleResume();
    drag.current = { active: true, startX: e.pageX - (stripRef.current?.offsetLeft ?? 0), scrollLeft: stripRef.current?.scrollLeft ?? 0 };
    if (stripRef.current) stripRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !stripRef.current) return;
    e.preventDefault();
    const x    = e.pageX - (stripRef.current.offsetLeft ?? 0);
    const walk = (x - drag.current.startX) * 1.2;
    stripRef.current.scrollLeft = drag.current.scrollLeft - walk;
  };
  const stopDrag = () => {
    drag.current.active = false;
    if (stripRef.current) stripRef.current.style.cursor = 'grab';
  };

  if (!loading && products.length === 0) return null;

  return (
    <section style={{ borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px clamp(20px,5%,80px) 16px',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#C2410C', marginBottom: 2 }}>Limited Time</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 'clamp(20px,3vw,30px)', color: '#0A0A0A', lineHeight: 1 }}>Flash Sales</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {!loading && <HeaderCountdown products={products} />}
          {!loading && products.length > 0 && (
            <div ref={filterBtnRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setDrawerOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', textTransform: 'uppercase',
                background: '#fff', color: '#0A0A0A',
                border: '1px solid rgba(0,0,0,0.15)', padding: '9px 18px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                <line x1="0" y1="2" x2="16" y2="2" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="5" cy="2" r="2" fill="#fff" stroke="#0A0A0A" strokeWidth="1.5"/>
                <line x1="0" y1="7" x2="16" y2="7" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="11" cy="7" r="2" fill="#fff" stroke="#0A0A0A" strokeWidth="1.5"/>
                <line x1="0" y1="12" x2="16" y2="12" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="4" cy="12" r="2" fill="#fff" stroke="#0A0A0A" strokeWidth="1.5"/>
              </svg>
              Filter
              {selectedCategory !== 'All' && (
                <span style={{ background: '#C2410C', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              )}
            </button>

            {/* Popup anchored directly inside the relative wrapper */}
            {drawerOpen && (
              <>
                <div
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                />
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

                  {/* Header */}
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#C2410C', margin: '0 0 2px' }}>Flash Sales</p>
                    <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#0A0A0A', margin: 0 }}>Categories</p>
                  </div>

                  {/* All row */}
                  <button
                    onClick={() => { setSelectedCategory('All'); setDrawerOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px',
                      background: selectedCategory === 'All' ? 'rgba(0,0,0,0.04)' : 'none',
                      border: 'none',
                      borderLeft: selectedCategory === 'All' ? '2px solid #0A0A0A' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: selectedCategory === 'All' ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: selectedCategory === 'All' ? '#0A0A0A' : '#888' }}>All</span>
                    <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 600, color: '#C2410C' }}>{products.length}</span>
                  </button>

                  <div style={{ margin: '0 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

                  {/* Category rows */}
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort().map(cat => {
                    const count  = products.filter(p => p.category === cat).length;
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat!); setDrawerOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 16px',
                          background: active ? 'rgba(0,0,0,0.04)' : 'none',
                          border: 'none',
                          borderLeft: active ? '2px solid #0A0A0A' : '2px solid transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', color: active ? '#0A0A0A' : '#888' }}>{cat}</span>
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 600, color: '#C2410C' }}>{count}</span>
                      </button>
                    );
                  })}

                  {/* Clear filter */}
                  {selectedCategory !== 'All' && (
                    <>
                      <div style={{ margin: '0 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }} />
                      <button
                        onClick={() => { setSelectedCategory('All'); setDrawerOpen(false); }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 600,
                          letterSpacing: '1.5px', textTransform: 'uppercase', color: '#aaa',
                        }}
                      >
                        Clear ×
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            </div>
          )}
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'flex', gap: 16, padding: '0 clamp(20px,5%,80px) 24px', overflow: 'hidden' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 200, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', background: 'linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'flashSkelPulse 1.4s ease infinite' }}/>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ height: 10, width: '60%', borderRadius: 4, background: '#f0f0f0', marginBottom: 8 }}/>
                <div style={{ height: 12, width: '45%', borderRadius: 4, background: '#f0f0f0' }}/>
              </div>
            </div>
          ))}
          <style>{'@keyframes flashSkelPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }'}</style>
        </div>
      )}

      {/* Cards — reuses ProductCard, with sale price swapped in + % off badge */}
      {!loading && products.length > 0 && (() => {
        const visibleProducts = selectedCategory === 'All'
          ? products
          : products.filter(p => p.category === selectedCategory);
        return (
        <div
          ref={stripRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onMouseEnter={pauseAndScheduleResume}
          onTouchStart={pauseAndScheduleResume}
          style={{
            display: 'flex', gap: 16,
            padding: '0 clamp(20px,5%,80px) 28px',
            overflowX: 'auto', scrollbarWidth: 'none',
            cursor: 'grab', userSelect: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <style>{'.flash-strip::-webkit-scrollbar { display: none }'}</style>
          {visibleProducts.map(p => {
            // ProductCard renders the card exactly like the rest of the catalog;
            // we just feed it the sale price as the active price and the original
            // price as comparePrice so it shows the slashed original + new price.
            const productForCard: Product & { images?: string[] } = {
              ...(p as unknown as Product),
              price: String(p.price),
              images: p.images,
              image_url: p.image_url ?? '',
            };
            return (
              <div key={p.id} style={{ position: 'relative', width: 200, flexShrink: 0 }}>
                <SaleBadge p={p} />
                <ProductCard
                  product={productForCard}
                  comparePrice={p.sale_price}
                  inCart={cartIds.includes(p.id)}
                  inWishlist={wishlistIds.includes(p.id)}
                  isAdmin={isAdmin}
                  onCartToggle={onCartToggle}
                  onWishlistToggle={onWishlistToggle}
                />
              </div>
            );
          })}
        </div>
        );
      })()}


    </section>
  );
}