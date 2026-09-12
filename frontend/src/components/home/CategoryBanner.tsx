// src/components/home/CategoryBanner.tsx
import { useEffect, useRef } from 'react';
interface CategoryItem { slug: string; name: string; }
interface CategoryBannerProps {
  categories: CategoryItem[];
  activeCategory: string; // slug
  onSelect: (slug: string) => void;
}
// Images keyed by SLUG. Recurring concepts across genders intentionally point
// to the same URL so switching Men/Women doesn't change the thumbnail.
// TODO: swap these for real category photography (Cloudinary or local assets).
const CATEGORY_IMAGES: Record<string, string> = {
  all: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539195/20a56673b1d6e0ac73501a96c89cf766_xq85qz.jpg',
  'men-tops':    'https://picsum.photos/seed/tops/300/170',
  'women-tops':  'https://picsum.photos/seed/tops/300/170',
  'men-bottoms':   'https://picsum.photos/seed/bottoms/300/170',
  'women-bottoms': 'https://picsum.photos/seed/bottoms/300/170',
  'men-outwear':   'https://picsum.photos/seed/outwear/300/170',
  'women-outwear': 'https://picsum.photos/seed/outwear/300/170',
  'men-sets':   'https://picsum.photos/seed/sets/300/170',
  'women-sets': 'https://picsum.photos/seed/sets/300/170',
  'men-headgear':   'https://picsum.photos/seed/headgear/300/170',
  'women-headgear': 'https://picsum.photos/seed/headgear/300/170',
  'men-hoodies-jackets':   'https://picsum.photos/seed/hoodies/300/170',
  'women-hoodies-jackets': 'https://picsum.photos/seed/hoodies/300/170',
  'men-loungewear':   'https://picsum.photos/seed/loungewear/300/170',
  'women-loungewear': 'https://picsum.photos/seed/loungewear/300/170',
  'men-socks':   'https://picsum.photos/seed/socks/300/170',
  'women-socks': 'https://picsum.photos/seed/socks/300/170',
  'men-accessories':   'https://picsum.photos/seed/accessories/300/170',
  'women-accessories': 'https://picsum.photos/seed/accessories/300/170',
  'men-sandals-slides':   'https://picsum.photos/seed/sandals/300/170',
  'women-sandals-slides': 'https://picsum.photos/seed/sandals/300/170',
  'men-boots':   'https://picsum.photos/seed/boots/300/170',
  'women-boots': 'https://picsum.photos/seed/boots/300/170',
  // Gender-exclusive / distinctly named categories get their own images:
  'men-sneakers':            'https://picsum.photos/seed/mens-sneakers/300/170',
  'women-sneakers-athletic': 'https://picsum.photos/seed/womens-sneakers/300/170',
  'men-formal-shoes':        'https://picsum.photos/seed/mens-formal/300/170',
  'women-formal-dress':      'https://picsum.photos/seed/womens-formal/300/170',
  'women-heels':             'https://picsum.photos/seed/heels/300/170',
  'women-flats-casuals':     'https://picsum.photos/seed/flats/300/170',
};
function getCategoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? `https://picsum.photos/seed/luku-${encodeURIComponent(slug)}/300/170`;
}
export default function CategoryBanner({ categories, activeCategory, onSelect }: CategoryBannerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Duplicate the list once so the strip can loop seamlessly.
  const loop = [...categories, ...categories];
  // Auto-advance via rAF-driven scrollLeft, so native user scrolling
  // (drag, wheel, touch, scrollbar) still works on the same element.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf: number;
    const speed = 0.5; // px per frame
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
  }, [categories.length]);
  const pause = () => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const scheduleResume = (delay = 1200) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { pausedRef.current = false; }, delay);
  };
  return (
    <>
      <style>{`
        .cb-wrap {
          overflow-x: auto;
          overflow-y: hidden;
          background: #fff;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        .cb-wrap::-webkit-scrollbar { height: 5px; }
        .cb-wrap::-webkit-scrollbar-track { background: transparent; }
        .cb-wrap::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 3px; }
        .cb-wrap::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.32); }
        .cb-track {
          display: flex;
          width: max-content;
        }
        .cb-item {
          position: relative;
          flex-shrink: 0;
          width: 168px;
          height: 96px;
          margin: 10px 6px;
          border: none;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          background: #eee;
        }
        .cb-item.active { outline: 2px solid #0A0A0A; outline-offset: -2px; }
        .cb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          transition: transform 0.5s ease;
        }
        .cb-item:hover .cb-img { transform: scale(1.06); }
        .cb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 60%, transparent 100%);
          pointer-events: none;
        }
        .cb-label {
          position: absolute;
          left: 10px;
          bottom: 8px;
          font-family: var(--f-sans, 'DM Sans', system-ui, sans-serif);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .cb-item { width: 128px; height: 76px; margin: 8px 4px; }
          .cb-label { font-size: 9px; left: 8px; bottom: 6px; }
        }
      `}</style>
      <div
        ref={wrapRef}
        className="cb-wrap"
        onMouseEnter={pause}
        onMouseLeave={() => scheduleResume(300)}
        onPointerDown={pause}
        onPointerUp={() => scheduleResume()}
        onTouchStart={pause}
        onTouchEnd={() => scheduleResume()}
        onWheel={() => { pause(); scheduleResume(); }}
      >
        <div className="cb-track">
          {loop.map((cat, i) => (
            <button
              key={`${cat.slug}-${i}`}
              className={`cb-item ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => onSelect(cat.slug)}
              aria-label={`Shop ${cat.name}`}
            >
              <img
                src={getCategoryImage(cat.slug)}
                alt={cat.name}
                className="cb-img"
                loading="lazy"
                decoding="async"
                width={168}
                height={96}
              />
              <span className="cb-overlay" />
              <span className="cb-label">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
