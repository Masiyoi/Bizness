// src/components/home/QuickViewModal.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { T, isNewProduct } from '../../constants/theme';
import type { Product } from '../../constants/theme';

interface QuickViewModalProps {
  product: Product & { sku?: string };
  inCart: boolean;
  inWishlist: boolean;
  isAdmin: boolean;
  onCartToggle: (id: number) => void;
  onWishlistToggle: (id: number) => void;
  onClose: () => void;
}

export default function QuickViewModal({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle, onClose,
}: QuickViewModalProps) {
  const stock = product.stock ?? 0;
  const isNew = isNewProduct(product.created_at);

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
        @keyframes qv-slide-up {
          from { transform: translateY(100%); } to { transform: translateY(0); }
        }
        @keyframes qv-scale-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .qv-desktop { display: none !important; }
        .qv-mobile  { display: block !important; }
        @media (min-width: 768px) {
          .qv-desktop { display: flex !important; }
          .qv-mobile  { display: none  !important; }
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

      {/* ══════════════════════════════════════════
          DESKTOP — centered, side-by-side
          ══════════════════════════════════════════ */}
      <div
        className="qv-desktop"
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          alignItems: 'center', justifyContent: 'center',
          padding: 24, pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'all',
            background: '#fff',
            borderRadius: 4,
            overflow: 'hidden',
            width: '100%',
            maxWidth: 840,
            maxHeight: '86vh',
            display: 'flex',
            flexDirection: 'row',
            boxShadow: '0 32px 80px rgba(13,27,62,0.24)',
            animation: 'qv-scale-in 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          }}
        >
          {/* Left — Image (fills height) */}
          <div style={{
            flex: '0 0 46%',
            position: 'relative',
            background: '#F7F5F0',
            overflow: 'hidden',
            minHeight: 460,
          }}>
            <img
              src={product.image_url}
              alt={product.name}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
              }}
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://placehold.co/420x520/F0EAD8/0D1B3E?text=Luku+Prime`;
              }}
            />
            {isNew && stock > 0 && <div style={badgeStyle(T.gold, T.navy)}>NEW</div>}
            {product.category && !isNew && stock > 0 && (
              <div style={badgeStyle(T.navy, T.gold)}>{product.category}</div>
            )}
            {stock === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(13,27,62,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={soldOutStyle}>Sold Out</span>
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div style={{
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
              <span style={{
                fontFamily: 'sans-serif', fontSize: 19,
                fontWeight: 700, color: T.navy,
              }}>
                KSh {Number(product.price).toLocaleString()}
              </span>
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

      {/* ══════════════════════════════════════════
          MOBILE — bottom sheet
          ══════════════════════════════════════════ */}
      <div
        className="qv-mobile"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 1001,
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'qv-slide-up 0.32s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          boxShadow: '0 -8px 48px rgba(13,27,62,0.18)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#DDD' }} />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: 18, padding: 4,
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image */}
        <div style={{ position: 'relative', background: '#F7F5F0', overflow: 'hidden', marginTop: 8 }}>
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', display: 'block' }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/600x300/F0EAD8/0D1B3E?text=Luku+Prime`;
            }}
          />
          {isNew && stock > 0 && <div style={badgeStyle(T.gold, T.navy)}>NEW</div>}
          {product.category && !isNew && stock > 0 && (
            <div style={badgeStyle(T.navy, T.gold)}>{product.category}</div>
          )}
          {stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(13,27,62,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={soldOutStyle}>Sold Out</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ padding: '20px 20px 36px' }}>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 600,
            color: T.navy, margin: '0 0 8px', lineHeight: 1.3,
          }}>
            {product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: 'sans-serif', fontSize: 17, fontWeight: 700, color: T.navy }}>
              KSh {Number(product.price).toLocaleString()}
            </span>
            <StockPill stock={stock} />
          </div>

          {product.description && (
            <p style={{
              fontFamily: 'sans-serif', fontSize: 13,
              color: '#666', lineHeight: 1.65, margin: '0 0 16px',
            }}>
              {product.description}
            </p>
          )}

          <div style={{ height: 1, background: '#EEE', margin: '0 0 16px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
            {product.category && <MetaRow label="Category"     value={product.category} />}
            {product.sku      && <MetaRow label="SKU"          value={product.sku} />}
            <MetaRow label="Availability" value={stock > 0 ? `${stock} units` : 'Unavailable'} />
          </div>

          <CTAs
            isAdmin={isAdmin} stock={stock} inCart={inCart} inWishlist={inWishlist}
            productId={product.id}
            onCartToggle={onCartToggle}
            onWishlistToggle={onWishlistToggle}
            onClose={onClose}
          />
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