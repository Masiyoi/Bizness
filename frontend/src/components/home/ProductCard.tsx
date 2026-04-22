// src/components/home/ProductCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { T, isNewProduct } from '../../constants/theme';
import type { Product } from '../../constants/theme';
import QuickViewModal from './QuickViewModal';

interface ProductCardProps {
  product:     Product;
  inCart:      boolean;
  inWishlist:  boolean;
  isAdmin:     boolean;
  onCartToggle:    (id: number) => void;
  onWishlistToggle:(id: number) => void;
}

export default function ProductCard({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle,
}: ProductCardProps) {
  const stock = product.stock ?? 0;
  const isNew = isNewProduct(product.created_at);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  return (
    <>
      <div className="pcard group">
        {/* ── Image ── */}
        <div className="relative overflow-hidden bg-cream-mid" style={{ height: 240 }}>
          <Link to={`/product/${product.id}`}>
            <img
              src={product.image_url}
              alt={product.name}
              className="pimg"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  `https://placehold.co/300x240/F0EAD8/0D1B3E?text=Luku+Prime`;
              }}
            />
          </Link>

          {/* NEW badge */}
          {isNew && stock > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-gold text-navy font-sans text-[8px] font-extrabold tracking-[2px] px-2 py-[3px] rounded-[3px] uppercase z-[2]">
              NEW
            </div>
          )}

          {/* Category badge */}
          {product.category && !isNew && (
            <div className="absolute top-2.5 left-2.5 bg-navy text-gold font-sans text-[8px] font-bold tracking-[1.5px] px-2 py-[3px] rounded-[3px] uppercase">
              {product.category}
            </div>
          )}

          {/* Wishlist button */}
          {!isAdmin && (
            <button
              className="absolute top-2.5 right-2.5 border-none w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer text-[13px] transition-transform duration-200 bg-white/92 backdrop-blur-sm hover:scale-110"
              onClick={() => onWishlistToggle(product.id)}
            >
              {inWishlist ? '❤️' : '🤍'}
            </button>
          )}

          {/* Sold-out overlay */}
          {stock === 0 && (
            <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
              <span className="bg-white/95 text-navy font-sans font-bold text-[9px] tracking-[2px] uppercase px-3.5 py-[5px] rounded-[3px]">
                Sold Out
              </span>
            </div>
          )}

          {/* ── Quick View — slides up on card hover ── */}
          <button
            onClick={() => setQuickViewOpen(true)}
            className="
              absolute bottom-0 left-0 right-0
              translate-y-full group-hover:translate-y-0
              transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              border-none cursor-pointer z-[3]
              font-sans font-bold text-[9px] tracking-[2px] uppercase
              py-[11px]
            "
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: T.navy,
              backdropFilter: 'blur(6px)',
            }}
          >
            ⊕ Quick View
          </button>
        </div>

        {/* ── Info ── */}
        <div className="px-3.5 pt-3 pb-3.5">
          <Link to={`/product/${product.id}`}>
            <div className="font-serif font-semibold text-[14px] text-navy overflow-hidden text-ellipsis whitespace-nowrap mb-1.5">
              {product.name}
            </div>
          </Link>

          {/* Stock pill */}
          <div className="mb-2">
            {stock === 0
              ? <span className="font-sans text-[9px] font-bold text-red-600 bg-[#FDF0EE] border border-[#F5C6C0] rounded-[3px] px-1.5 py-[2px]">Out of stock</span>
              : stock <= 5
                ? <span className="font-sans text-[9px] font-bold text-[#8A6A20] bg-gold/10 border border-gold/30 rounded-[3px] px-1.5 py-[2px]">⚠ Only {stock} left</span>
                : <span className="font-sans text-[9px] font-semibold text-[#4A7A4A] bg-[#EEF3EE] border border-[#C8DFC8] rounded-[3px] px-1.5 py-[2px]">✓ In Stock</span>
            }
          </div>

          {/* Price */}
          <div className="font-sans font-bold text-[15px] text-navy mb-2.5">
            KSh {Number(product.price).toLocaleString()}
          </div>

          {/* CTA */}
          {isAdmin ? (
            <Link to={`/product/${product.id}`}>
              <button className="font-sans font-semibold text-[10px] tracking-[1.5px] uppercase border-none rounded-lg p-2.5 w-full cursor-pointer transition-all bg-navy-light text-white/85">
                👁️ View Details
              </button>
            </Link>
          ) : (
            <button
              disabled={stock === 0}
              onClick={() => stock > 0 && onCartToggle(product.id)}
              className="font-sans font-semibold text-[10px] tracking-[1.5px] uppercase border-none rounded-lg p-2.5 w-full cursor-pointer transition-all duration-200 disabled:cursor-not-allowed hover:not-disabled:brightness-105 hover:not-disabled:-translate-y-px"
              style={{
                background: stock === 0 ? T.creamMid  : inCart ? '#FDF0EE' : T.gold,
                color:      stock === 0 ? T.muted     : inCart ? '#C0392B' : T.navy,
                border:     inCart ? '1.5px solid #F5C6C0' : 'none',
              }}
            >
              {stock === 0 ? 'Sold Out' : inCart ? '✕ Remove' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>

      {/* ── Quick View Modal (portal-style, renders above everything) ── */}
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          inCart={inCart}
          inWishlist={inWishlist}
          isAdmin={isAdmin}
          onCartToggle={onCartToggle}
          onWishlistToggle={onWishlistToggle}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}