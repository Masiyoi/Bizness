// src/components/home/HeadwearSection.tsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../constants/theme';
import { toCardImage } from '../../utils/cloudinary';
import QuickViewModal from './QuickViewModal';

interface HeadwearSectionProps {
  products:         Product[];
  onExplore:        () => void;
  cartIds:          number[];
  wishlist:         number[];
  isAdmin:          boolean;
  onCartToggle:     (id: number) => void;
  onWishlistToggle: (id: number) => void;
}

// TODO: swap for a real headwear cover photo (Cloudinary or local asset).
const COVER_IMAGE = 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784537952/c5cb3aea22541cd7df99b5fe5779cc8d_t3kmwe.jpg';

export default function HeadwearSection({
  products, onExplore, cartIds, wishlist, isAdmin, onCartToggle, onWishlistToggle,
}: HeadwearSectionProps) {
  const headwear = products.filter(p => p.category === 'Headgear');

  const wrapRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loop = headwear.length > 0 ? [...headwear, ...headwear] : [];

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || headwear.length === 0) return;
    let raf: number;
    const speed = 0.4; // px per frame — slides leftward

    const step = () => {
      if (!pausedRef.current && el) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += speed;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [headwear.length]);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = (delay = 1200) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, delay);
  };

  if (headwear.length === 0) return null;

  return (
    <section className="hw-section">
      <style>{`
        .hw-section {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid rgba(0,0,0,0.10);
          background: #fff;
        }
        .hw-cover {
          flex: 0 0 clamp(140px, 34vw, 260px);
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(0,0,0,0.10);
          padding: clamp(10px,2vw,32px);
          cursor: pointer;
          background: none;
          border-top: none; border-left: none; border-bottom: none;
          text-align: left;
        }
        .hw-cover-imgwrap {
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #eee;
          margin-bottom: 10px;
        }
        .hw-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }
        .hw-cover:hover .hw-cover-img { transform: scale(1.04); }
        .hw-cover-label {
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: clamp(8.5px, 1.6vw, 12px);
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #0A0A0A;
          line-height: 1.4;
        }
        @media (min-width: 640px) {
          .hw-cover-label { letter-spacing: 2.5px; }
        }
        .hw-slider-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(10px,2vw,40px);
        }
        .hw-slider-kicker {
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 12px;
        }
        .hw-slider {
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        .hw-slider::-webkit-scrollbar { height: 5px; }
        .hw-slider::-webkit-scrollbar-track { background: transparent; }
        .hw-slider::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        .hw-track {
          display: flex;
          width: max-content;
        }
        .hw-item {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          width: clamp(122px, 30vw, 168px);
          margin: 6px 8px;
        }
        .hw-item-imgwrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #eee;
          display: block;
        }
        .hw-item-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .hw-item:hover .hw-item-img { transform: scale(1.06); }
        .hw-item-sold {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
        }
        .hw-item-sold span {
          background: #fff; color: #000;
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          padding: 5px 10px;
        }
        .hw-item-qv {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          font-size: 16px;
          color: #0A0A0A;
          line-height: 1;
        }
        .hw-item-info {
          padding-top: 8px;
        }
        .hw-item-name {
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
          color: #0A0A0A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hw-item-price {
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 12px;
          font-weight: 500;
          color: #0A0A0A;
          margin-top: 2px;
        }
      `}</style>

      <button className="hw-cover" onClick={onExplore} aria-label="Explore our headwear collection">
        <div className="hw-cover-imgwrap">
          <img
            src={COVER_IMAGE}
            alt="Headwear Collection"
            className="hw-cover-img"
            loading="lazy"
            decoding="async"
            width={300}
            height={400}
          />
        </div>
        <span className="hw-cover-label">Explore Our Headwear Collection</span>
      </button>

      <div className="hw-slider-col">
        <p className="hw-slider-kicker">Top Picks</p>
        <div
          ref={wrapRef}
          className="hw-slider"
          onMouseEnter={pause}
          onMouseLeave={() => scheduleResume(300)}
          onPointerDown={pause}
          onPointerUp={() => scheduleResume()}
          onTouchStart={pause}
          onTouchEnd={() => scheduleResume()}
          onWheel={() => { pause(); scheduleResume(); }}
        >
          <div className="hw-track">
            {loop.map((p, i) => {
              const stock = p.stock ?? 0;
              return (
                <div key={`${p.id}-${i}`} className="hw-item">
                  <Link to={`/product/${p.id}`} className="hw-item-imgwrap">
                    <img
                      src={toCardImage(p.image_url)}
                      alt={p.name}
                      className="hw-item-img"
                      loading="lazy"
                      decoding="async"
                      width={168}
                      height={168}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/400x400/EFEFEF/bbb?text=No+Image';
                      }}
                    />
                    {stock === 0 && (
                      <div className="hw-item-sold"><span>Sold Out</span></div>
                    )}
                    {!isAdmin && stock > 0 && (
                      <button
                        className="hw-item-qv"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(p); }}
                        aria-label="Quick view"
                      >
                        +
                      </button>
                    )}
                  </Link>
                  <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="hw-item-info">
                      <div className="hw-item-name">{p.name}</div>
                      <div className="hw-item-price">KSh {Number(p.price).toLocaleString()}</div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          inCart={cartIds.includes(quickViewProduct.id)}
          inWishlist={wishlist.includes(quickViewProduct.id)}
          isAdmin={isAdmin}
          onCartToggle={onCartToggle}
          onWishlistToggle={onWishlistToggle}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
}
