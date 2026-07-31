// src/components/home/QuickViewModal.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { isNewProduct } from '../../constants/theme';
import type { Product } from '../../constants/theme';

interface QuickViewModalProps {
  product: Product & { sku?: string; images?: string[] };
  inCart: boolean;
  inWishlist: boolean;
  isAdmin: boolean;
  onCartToggle: (id: number) => void;
  onWishlistToggle: (id: number) => void;
  onClose: () => void;
  salePrice?: number;
}

// ── Monochrome design tokens — crisp, futuristic, restrained ─────────────────
const C = {
  ink:      '#0A0A0A',
  paper:    '#FFFFFF',
  line:     'rgba(10,10,10,0.12)',
  lineMid:  'rgba(10,10,10,0.28)',
  muted:    '#8C8C8C',
  backdrop:  'rgba(8,8,8,0.62)',
  accent:    '#C2410C', // sale / urgency only — matches ProductCard
  cart:      '#DC2626', // Add to Cart
  cartDark:  '#B91C1C',
  wishlist:  '#16A34A', // Add to Wishlist
  wishlistDark: '#15803D',
};
const BODY = "'DM Sans', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export default function QuickViewModal({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle, onClose, salePrice,
}: QuickViewModalProps) {
  const stock = product.stock ?? 0;
  const isNew = isNewProduct(product.created_at);

  const images: string[] = (product.images && product.images.length > 0)
    ? product.images
    : product.image_url
      ? [product.image_url]
      : ['https://placehold.co/420x520/0A0A0A/FFFFFF?text=Luku+Prime'];
  const count = images.length;

  const [activeIdx, setActiveIdx]   = useState(0);
  const dragging  = useRef(false);
  const startX    = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(Math.max(0, Math.min(count - 1, idx)));
  }, [count]);

  const prevImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); goTo(activeIdx - 1); };
  const nextImg = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); goTo(activeIdx + 1); };

  const onTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    dragging.current = true;
    startX.current   = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    setDragOffset(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = e.changedTouches[0].clientX - startX.current;
    setDragOffset(0);
    if (Math.abs(delta) > 35) delta < 0 ? goTo(activeIdx + 1) : goTo(activeIdx - 1);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <>
      <style>{`
        @keyframes qv-backdrop-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(10px); }
        }
        @keyframes qv-panel-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); filter: blur(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0);   }
        }
        @keyframes qv-scan {
          0%   { top: 0%;   opacity: 0; }
          8%   { opacity: 0.9; }
          92%  { opacity: 0.9; }
          100% { top: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qv-backdrop, .qv-panel, .qv-scan { animation: none !important; }
        }

        .qv-panel { flex-direction: row; }
        .qv-image-pane { flex: 0 0 58%; min-height: 460px; }
        .qv-details-pane { min-height: 0; -webkit-overflow-scrolling: touch; }

        @media (max-width: 720px) {
          .qv-panel { flex-direction: column !important; max-height: 92vh !important; }
          .qv-image-pane { flex: 0 0 auto !important; min-height: 0 !important; height: 300px !important; }
          .qv-details-pane { padding: 22px 18px 24px !important; }
        }

        .qv-icon-btn {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.22);
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }
        .qv-icon-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.4);
        }
        .qv-icon-btn:active:not(:disabled) { transform: scale(0.94); }

        .qv-close-btn {
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .qv-close-btn:hover { background: ${C.ink} !important; color: ${C.paper} !important; border-color: ${C.ink} !important; }

        .qv-cart-btn { transition: background 0.15s ease, color 0.15s ease, opacity 0.15s ease; }
        .qv-cart-btn:hover:not(:disabled) { opacity: 0.88; }

        .qv-wishlist-btn { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
        .qv-wishlist-btn:hover { background: ${C.wishlist} !important; color: ${C.paper} !important; border-color: ${C.wishlist} !important; }

        .qv-bracket { transition: opacity 0.25s ease, inset 0.25s ease; }
        .qv-image-pane:hover .qv-bracket { opacity: 1 !important; }

        a.qv-full-link { transition: opacity 0.15s ease; }
        a.qv-full-link:hover { opacity: 1 !important; }

        *:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px; }
      `}</style>

      {/* Backdrop */}
      <div
        className="qv-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: C.backdrop,
          zIndex: 1000,
          animation: 'qv-backdrop-in 0.28s ease forwards',
        }}
      />

      {/* Centered popup — single layout for all screen sizes */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, pointerEvents: 'none',
        }}
      >
        <div
          className="qv-panel"
          style={{
            pointerEvents: 'all',
            background: C.paper,
            borderRadius: 3,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 840,
            maxHeight: '86vh',
            display: 'flex',
            border: `1px solid ${C.line}`,
            boxShadow: '0 44px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            animation: 'qv-panel-in 0.36s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Image carousel */}
          <div
            className="qv-image-pane"
            style={{ position: 'relative', background: C.ink, overflow: 'hidden' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div style={{
              display: 'flex',
              width: `${count * 100}%`,
              height: '100%',
              transform: `translateX(calc(${-activeIdx * (100 / count)}% + ${dragOffset}px))`,
              transition: dragging.current ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}>
              {images.map((src, i) => (
                <div key={i} style={{ flex: `0 0 ${100 / count}%`, height: '100%', position: 'relative' }}>
                  <img
                    src={src}
                    alt={i === 0 ? product.name : `${product.name} view ${i + 1}`}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                    }}
                    draggable={false}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/420x520/0A0A0A/FFFFFF?text=Luku+Prime`;
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Viewfinder corner brackets — signature element */}
            <CornerBrackets />

            {/* One-time scan-line sweep on open */}
            <div
              className="qv-scan"
              style={{
                position: 'absolute', left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                boxShadow: '0 0 12px 1px rgba(255,255,255,0.7)',
                zIndex: 3, pointerEvents: 'none',
                animation: 'qv-scan 1.1s cubic-bezier(0.4,0,0.2,1) 0.15s forwards',
              }}
            />

            {isNew && stock > 0 && <div style={chipStyle('left')}>NEW</div>}
            {product.category && !isNew && stock > 0 && (
              <div style={chipStyle('left')}>{product.category}</div>
            )}
            {stock === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.68)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2,
              }}>
                <span style={soldOutStyle}>Sold Out</span>
              </div>
            )}

            {count > 1 && (
              <>
                <button
                  className="qv-icon-btn"
                  onClick={prevImg}
                  disabled={activeIdx === 0}
                  aria-label="Previous image"
                  style={arrowStyle('left', activeIdx === 0)}
                >
                  <span style={arrowIconStyle}>‹</span>
                </button>
                <button
                  className="qv-icon-btn"
                  onClick={nextImg}
                  disabled={activeIdx === count - 1}
                  aria-label="Next image"
                  style={arrowStyle('right', activeIdx === count - 1)}
                >
                  <span style={arrowIconStyle}>›</span>
                </button>

                <div style={{
                  position: 'absolute', bottom: 12, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center', gap: 4, zIndex: 3,
                }}>
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                      style={{
                        width: i === activeIdx ? 16 : 5, height: 2,
                        background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer', transition: 'width 0.25s ease, background 0.25s ease',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="qv-details-pane" style={{
            flex: 1, overflowY: 'auto',
            padding: '38px 34px 34px',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Close button */}
            <button
              className="qv-close-btn"
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: `1px solid ${C.line}`, cursor: 'pointer',
                width: 30, height: 30, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.muted, fontSize: 14,
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Eyebrow */}
            <span style={{
              fontFamily: MONO, fontSize: 9.5, fontWeight: 500,
              letterSpacing: '2.5px', color: C.muted, textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Quick View
            </span>

            {/* Name */}
            <h2 style={{
              fontFamily: BODY,
              fontSize: 21, fontWeight: 600,
              color: C.ink, margin: '0 0 12px',
              lineHeight: 1.3, paddingRight: 30, letterSpacing: '-0.2px',
            }}>
              {product.name}
            </h2>

            {/* Price + stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              {salePrice != null ? (
                <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontFamily: BODY, fontSize:18, fontWeight:700, color: C.accent }}>
                    KSh {salePrice.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: BODY, fontSize:13, fontWeight:400, color: C.muted, textDecoration:'line-through' }}>
                    KSh {Number(product.price).toLocaleString()}
                  </span>
                  <span style={{
                    fontFamily: MONO, color: C.accent, fontWeight: 600, fontSize: 10,
                    padding: '2px 6px', border: `1px solid ${C.accent}`, borderRadius: 2,
                  }}>
                    -{Math.round(((Number(product.price) - salePrice) / Number(product.price)) * 100)}%
                  </span>
                </div>
              ) : (
                <span style={{ fontFamily: BODY, fontSize: 18, fontWeight: 700, color: C.ink }}>
                  KSh {Number(product.price).toLocaleString()}
                </span>
              )}
              <StockPill stock={stock} />
            </div>

            {/* Description */}
            {product.description && (
              <p style={{
                fontFamily: BODY, fontSize: 13,
                color: '#555', lineHeight: 1.7, margin: '0 0 20px',
              }}>
                {product.description}
              </p>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: C.line, margin: '0 0 18px' }} />

            {/* Meta */}
            {product.sku && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
                <MetaRow label="SKU" value={product.sku} />
              </div>
            )}

            <div style={{ flex: 1 }} />

            <CTAs
              isAdmin={isAdmin} stock={stock} inCart={inCart} inWishlist={inWishlist}
              productId={product.id}
              onCartToggle={onCartToggle}
              onWishlistToggle={onWishlistToggle}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CornerBrackets() {
  const base: React.CSSProperties = {
    position: 'absolute', width: 18, height: 18,
    border: 'none', opacity: 0.55, zIndex: 3, pointerEvents: 'none',
  };
  return (
    <>
      <div className="qv-bracket" style={{ ...base, top: 14, left: 14, borderTop: '1.5px solid #fff', borderLeft: '1.5px solid #fff' }} />
      <div className="qv-bracket" style={{ ...base, top: 14, right: 14, borderTop: '1.5px solid #fff', borderRight: '1.5px solid #fff' }} />
      <div className="qv-bracket" style={{ ...base, bottom: 14, left: 14, borderBottom: '1.5px solid #fff', borderLeft: '1.5px solid #fff' }} />
      <div className="qv-bracket" style={{ ...base, bottom: 14, right: 14, borderBottom: '1.5px solid #fff', borderRight: '1.5px solid #fff' }} />
    </>
  );
}

function CTAs({ isAdmin, stock, inCart, inWishlist, productId, onCartToggle, onWishlistToggle, onClose }: {
  isAdmin: boolean; stock: number; inCart: boolean; inWishlist: boolean;
  productId: number;
  onCartToggle: (id: number) => void;
  onWishlistToggle: (id: number) => void;
  onClose: () => void;
}) {
  if (isAdmin) {
    return (
      <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
        <button className="qv-cart-btn" onClick={onClose} style={{
          width: '100%', padding: '13px 0',
          background: C.ink, color: C.paper,
          border: 'none', borderRadius: 2, cursor: 'pointer',
          fontFamily: MONO, fontSize: 10, fontWeight: 600,
          letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>
          View Full Details
        </button>
      </Link>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        className="qv-cart-btn"
        disabled={stock === 0}
        onClick={() => { if (stock > 0) onCartToggle(productId); }}
        style={{
          width: '100%', padding: '13px 0',
          border: inCart ? `1px solid ${C.cart}` : 'none',
          borderRadius: 10, cursor: stock === 0 ? 'not-allowed' : 'pointer',
          fontFamily: MONO, fontSize: 10, fontWeight: 600,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          background: stock === 0 ? '#EDEDED' : inCart ? C.paper : C.cart,
          color:      stock === 0 ? '#AAAAAA' : inCart ? C.cart : C.paper,
        }}
      >
        {stock === 0 ? 'Sold Out' : inCart ? '✕ Remove from Cart' : 'Add to Cart'}
      </button>

      <button
        className="qv-wishlist-btn"
        onClick={() => onWishlistToggle(productId)}
        style={{
          width: '100%', padding: '11px 0',
          background: inWishlist ? C.wishlist : 'transparent',
          border: `1px solid ${C.wishlist}`,
          borderRadius: 10, cursor: 'pointer',
          fontFamily: MONO, fontSize: 10, fontWeight: 600,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: inWishlist ? C.paper : C.wishlist,
        }}
      >
        {inWishlist ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
      </button>

      <Link
        to={`/product/${productId}`}
        onClick={onClose}
        className="qv-full-link"
        style={{
          textAlign: 'center', fontFamily: MONO,
          fontSize: 10.5, color: C.ink, opacity: 0.55,
          textDecoration: 'underline', textUnderlineOffset: 3,
          marginTop: 2, letterSpacing: '0.5px',
        }}
      >
        View full product page →
      </Link>
    </div>
  );
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0)
    return <span style={pillStyle(C.accent)}>● Out of stock</span>;
  if (stock <= 5)
    return <span style={pillStyle(C.accent)}>● Only {stock} left</span>;
  return <span style={pillStyle(C.ink)}>● In Stock</span>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{
        fontFamily: MONO, fontSize: 9.5, fontWeight: 500,
        color: C.muted, letterSpacing: '1.5px',
        textTransform: 'uppercase', minWidth: 92,
      }}>
        {label}
      </span>
      <span style={{ fontFamily: BODY, fontSize: 13, color: '#333' }}>{value}</span>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right', disabled: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    width: 28, height: 28,
    borderRadius: 2,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4,
    opacity: disabled ? 0.25 : 1,
  };
}

const arrowIconStyle: React.CSSProperties = {
  fontSize: 15, color: '#fff', fontWeight: 600,
  lineHeight: 1, userSelect: 'none',
};

function chipStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: 12, [side]: 12,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    fontFamily: MONO, fontSize: 9, fontWeight: 500,
    letterSpacing: '1.5px', padding: '4px 9px',
    textTransform: 'uppercase', zIndex: 2, borderRadius: 2,
  } as React.CSSProperties;
}

function pillStyle(color: string): React.CSSProperties {
  return {
    fontFamily: MONO, fontSize: 9.5, fontWeight: 500,
    color, letterSpacing: '0.5px',
  };
}

const soldOutStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  fontFamily: MONO, fontWeight: 600,
  fontSize: 9.5, letterSpacing: '2.5px',
  textTransform: 'uppercase', padding: '7px 16px', borderRadius: 2,
};
