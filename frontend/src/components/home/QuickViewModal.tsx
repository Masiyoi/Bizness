// src/components/home/QuickViewModal.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { T, isNewProduct } from '../../constants/theme';
import type { Product } from '../../constants/theme';

interface QuickViewModalProps {
  product: Product & { sku?: string; images?: string[] };
  inCart: boolean;
  inWishlist: boolean;
  isAdmin: boolean;
  onCartToggle: (id: number) => void;
  onWishlistToggle: (id: number) => void;
  onClose: () => void;
}

export default function QuickViewModal({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle, onClose, salePrice,
}: QuickViewModalProps) {
  const stock = product.stock ?? 0;
  const isNew = isNewProduct(product.created_at);

  const images: string[] = (product.images && product.images.length > 0)
    ? product.images
    : product.image_url
      ? [product.image_url]
      : ['https://placehold.co/420x520/F0EAD8/0D1B3E?text=Luku+Prime'];
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

  return (
    <>
      <style>{`
        @keyframes qv-fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes qv-scale-in {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .qv-panel {
          flex-direction: row;
        }
        .qv-image-pane {
          flex: 0 0 46%;
          min-height: 460px;
        }
        @media (max-width: 720px) {
          .qv-panel {
            flex-direction: column !important;
            max-height: 92vh !important;
          }
          .qv-image-pane {
            flex: 0 0 auto !important;
            min-height: 0 !important;
            height: 220px !important;
          }
          .qv-details-pane {
            padding: 24px 20px 28px !important;
          }
        }
        .qv-wishlist-btn:hover {
          background: ${T.navy} !important;
          color: #fff !important;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13,27,62,0.48)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'qv-fade-in 0.22s ease forwards',
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
            background: '#fff',
            borderRadius: 8,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 840,
            maxHeight: '86vh',
            display: 'flex',
            boxShadow: '0 32px 80px rgba(13,27,62,0.24)',
            animation: 'qv-scale-in 0.26s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          }}
        >
          {/* Image carousel */}
          <div
            className="qv-image-pane"
            style={{
              position: 'relative',
              background: '#F7F5F0',
              overflow: 'hidden',
            }}
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
                        `https://placehold.co/420x520/F0EAD8/0D1B3E?text=Luku+Prime`;
                    }}
                  />
                </div>
              ))}
            </div>

            {isNew && stock > 0 && <div style={badgeStyle(T.gold, T.navy)}>NEW</div>}
            {product.category && !isNew && stock > 0 && (
              <div style={badgeStyle(T.navy, T.gold)}>{product.category}</div>
            )}
            {stock === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(13,27,62,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2,
              }}>
                <span style={soldOutStyle}>Sold Out</span>
              </div>
            )}

            {count > 1 && (
              <>
                <button
                  onClick={prevImg}
                  disabled={activeIdx === 0}
                  aria-label="Previous image"
                  style={arrowStyle('left', activeIdx === 0)}
                >
                  <span style={arrowIconStyle}>‹</span>
                </button>
                <button
                  onClick={nextImg}
                  disabled={activeIdx === count - 1}
                  aria-label="Next image"
                  style={arrowStyle('right', activeIdx === count - 1)}
                >
                  <span style={arrowIconStyle}>›</span>
                </button>

                <div style={{
                  position: 'absolute', bottom: 10, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center', gap: 4, zIndex: 3,
                }}>
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                      style={{
                        width: i === activeIdx ? 16 : 5, height: 5, borderRadius: 2.5,
                        background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.55)',
                        cursor: 'pointer', transition: 'width 0.25s ease, background 0.25s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
            padding: '40px 36px 36px',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#999', fontSize: 16, transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F5F5F5';
                e.currentTarget.style.color = T.navy;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#999';
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Name */}
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 22, fontWeight: 600,
              color: T.navy, margin: '0 0 10px',
              lineHeight: 1.25, paddingRight: 36,
            }}>
              {product.name}
            </h2>

            {/* Price + stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              {salePrice != null ? (
                <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'sans-serif', fontSize:19, fontWeight:700, color:'#C2410C' }}>
                    KSh {salePrice.toLocaleString()}
                  </span>
                  <span style={{ fontFamily:'sans-serif', fontSize:14, fontWeight:400, color:'#aaa', textDecoration:'line-through' }}>
                    KSh {Number(product.price).toLocaleString()}
                  </span>
                  <span style={{ background:'#EF4444', color:'#fff', fontFamily:'sans-serif', fontWeight:700, fontSize:10, padding:'2px 8px', borderRadius:4 }}>
                    -{Math.round(((Number(product.price) - salePrice) / Number(product.price)) * 100)}%
                  </span>
                </div>
              ) : (
                <span style={{
                  fontFamily: 'sans-serif', fontSize: 19,
                  fontWeight: 700, color: T.navy,
                }}>
                  KSh {Number(product.price).toLocaleString()}
                </span>
              )}
              <StockPill stock={stock} />
            </div>

            {/* Description */}
            {product.description && (
              <p style={{
                fontFamily: 'sans-serif', fontSize: 13.5,
                color: '#666', lineHeight: 1.7, margin: '0 0 20px',
              }}>
                {product.description}
              </p>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: '#EBEBEB', margin: '0 0 18px' }} />

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {product.category && <MetaRow label="Category"     value={product.category} />}
              {product.sku      && <MetaRow label="SKU"          value={product.sku} />}
              <MetaRow label="Availability" value={stock > 0 ? `${stock} units` : 'Unavailable'} />
            </div>

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
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        <button onClick={onClose} style={{
          width: '100%', padding: '13px 0',
          background: T.navy, color: T.gold,
          border: 'none', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>
          👁️ View Full Details
        </button>
      </Link>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        disabled={stock === 0}
        onClick={() => { if (stock > 0) onCartToggle(productId); }}
        style={{
          width: '100%', padding: '13px 0',
          border: inCart ? '1.5px solid #F5C6C0' : 'none',
          borderRadius: 6, cursor: stock === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          background: stock === 0 ? '#F0EAD8' : inCart ? '#FDF0EE' : T.gold,
          color:      stock === 0 ? '#9CA3AF' : inCart ? '#C0392B' : T.navy,
        }}
      >
        {stock === 0 ? 'Sold Out' : inCart ? '✕ Remove from Cart' : 'Add to Cart'}
      </button>

      <button
        className="qv-wishlist-btn"
        onClick={() => onWishlistToggle(productId)}
        style={{
          width: '100%', padding: '11px 0',
          background: 'transparent',
          border: `1.5px solid ${T.navy}`,
          borderRadius: 6, cursor: 'pointer',
          fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: T.navy, transition: 'background 0.2s, color 0.2s',
        }}
      >
        {inWishlist ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
      </button>

      <Link
        to={`/product/${productId}`}
        onClick={onClose}
        style={{
          textAlign: 'center', fontFamily: 'sans-serif',
          fontSize: 11, color: T.navy, opacity: 0.5,
          textDecoration: 'underline', marginTop: 2, letterSpacing: '0.5px',
        }}
      >
        View full product page →
      </Link>
    </div>
  );
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0)
    return <span style={pillStyle('#C0392B', '#FDF0EE', '#F5C6C0')}>Out of stock</span>;
  if (stock <= 5)
    return <span style={pillStyle('#8A6A20', 'rgba(196,160,74,0.1)', 'rgba(196,160,74,0.3)')}>⚠ Only {stock} left</span>;
  return <span style={pillStyle('#4A7A4A', '#EEF3EE', '#C8DFC8')}>✓ In Stock</span>;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{
        fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700,
        color: '#999', letterSpacing: '1px',
        textTransform: 'uppercase', minWidth: 90,
      }}>
        {label}
      </span>
      <span style={{ fontFamily: 'sans-serif', fontSize: 13, color: '#333' }}>{value}</span>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right', disabled: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 10,
    transform: 'translateY(-50%)',
    width: 28, height: 28,
    borderRadius: '50%',
    background: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.92)',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4,
    opacity: disabled ? 0.4 : 1,
    transition: 'opacity 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };
}

const arrowIconStyle: React.CSSProperties = {
  fontSize: 16, color: '#000', fontWeight: 700,
  lineHeight: 1, userSelect: 'none',
};

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    position: 'absolute', top: 10, left: 10,
    background: bg, color,
    fontFamily: 'sans-serif', fontSize: 8, fontWeight: 800,
    letterSpacing: '2px', padding: '3px 8px',
    textTransform: 'uppercase', zIndex: 2,
  };
}

function pillStyle(color: string, bg: string, border: string): React.CSSProperties {
  return {
    fontFamily: 'sans-serif', fontSize: 9, fontWeight: 700,
    color, background: bg, border: `1px solid ${border}`,
    borderRadius: 3, padding: '2px 6px',
  };
}

const soldOutStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.95)', color: '#0D1B3E',
  fontFamily: 'sans-serif', fontWeight: 700,
  fontSize: 9, letterSpacing: '2px',
  textTransform: 'uppercase', padding: '5px 14px', borderRadius: 3,
};