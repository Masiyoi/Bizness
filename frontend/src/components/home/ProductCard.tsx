// src/components/home/ProductCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { T, isNewProduct } from '../../constants/theme';
import type { Product } from '../../constants/theme';
import QuickViewModal from './QuickViewModal';

interface ProductCardProps {
  product:         Product;
  inCart:          boolean;
  inWishlist:      boolean;
  isAdmin:         boolean;
  onCartToggle:    (id: number) => void;
  onWishlistToggle:(id: number) => void;
}

export default function ProductCard({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle,
}: ProductCardProps) {
  const stock = product.stock ?? 0;
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  return (
    <>
      {/* No background, no border, no shadow — floats on page */}
      <div className="group">

        {/* ── Image ── */}
        <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#F5F5F5]" style={{ minHeight: 180 }}>
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ display: 'block' }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/300x400/F0EAD8/0D1B3E?text=Luku+Prime`;
            }}
          />

          {/* Sold-out overlay */}
          {stock === 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="bg-white text-black font-sans font-bold text-[9px] tracking-[2px] uppercase px-3.5 py-[5px]">
                Sold Out
              </span>
            </div>
          )}

          {/* Wishlist heart — appears on hover, top-right */}
          {!isAdmin && (
            <button
              className="
                absolute top-3 right-3
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                bg-transparent border-none cursor-pointer
                text-[20px] leading-none
                z-10
              "
              onClick={e => {
                e.preventDefault();
                onWishlistToggle(product.id);
              }}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {inWishlist ? '❤️' : '🤍'}
            </button>
          )}

          {/* Quick View — slides up on hover */}
          <button
            onClick={e => {
              e.preventDefault();
              setQuickViewOpen(true);
            }}
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
            Quick View
          </button>
        </Link>

        {/* ── Info ── */}
        <div className="pt-3 pb-1">
          <Link to={`/product/${product.id}`}>
            <div className="font-sans font-normal text-[11px] tracking-[1.5px] text-black uppercase mb-1 leading-snug hover:opacity-70 transition-opacity">
              {product.name}
            </div>
          </Link>

          <div className="font-sans text-[11px] tracking-[0.5px] text-black">
            KSh {Number(product.price).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── Quick View Modal ── */}
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
