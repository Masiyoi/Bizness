// src/components/home/CategoryBanner.tsx
import { useEffect, useRef } from 'react';

interface CategoryBannerProps {
  categories: string[];
  activeCategory: string;
  onSelect: (cat: string) => void;
}

// TODO: swap these for real category photography (Cloudinary or local assets).
// Keeping the source dimensions small (300x170) keeps the payload light since
// these only ever render as small sliding thumbnails.
const PLACEHOLDER_IMAGES: Record<string, string> = {
  All: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539195/20a56673b1d6e0ac73501a96c89cf766_xq85qz.jpg',
  Tops: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539196/4de9b4a90efcb5157577bf12c5ab427f_ovfuko.jpg',
  Bottoms: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539194/a23c134ebdc47581fa854c248633a8f5_lbczob.jpg',
  Outwear: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784540239/33d6728276446cbae1b1a8bf97c4e2cf_n3s4rg.jpg',
  Heels: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539194/d5529e92dc508b75aa4cc39e20eb8130_nnbstq.jpg',
  Accessories: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539193/6e11d85aef81c790f24f07434dd81daa_e1vrey.jpg',
  Bags: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539192/d3182483e186654480f85bd869cebd5e_bghndr.jpg',
  Footwear: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539193/cf17d512974994aac7122ddfe5cd2784_dkjxx4.jpg',
  Sets: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539192/09957c8e9347b7497dc261c11f380628_cnsihh.jpg',
  Headgear: 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784537952/c5cb3aea22541cd7df99b5fe5779cc8d_t3kmwe.jpg',
  'Hoodies and jackets': 'https://res.cloudinary.com/dfiy43f01/image/upload/v1784539191/53d56ce8593569f9c04411baac082228_drwegs.jpg',
};

function getCategoryImage(cat: string): string {
  return PLACEHOLDER_IMAGES[cat] ?? `https://picsum.photos/seed/luku-${encodeURIComponent(cat)}/300/170`;
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
          border-bottom: 1px solid rgba(0,0,0,0.10);
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
              key={`${cat}-${i}`}
              className={`cb-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onSelect(cat)}
              aria-label={`Shop ${cat}`}
            >
              <img
                src={getCategoryImage(cat)}
                alt={cat}
                className="cb-img"
                loading="lazy"
                decoding="async"
                width={168}
                height={96}
              />
              <span className="cb-overlay" />
              <span className="cb-label">{cat}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
