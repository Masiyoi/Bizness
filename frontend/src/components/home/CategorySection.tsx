// src/components/home/CategorySection.tsx
import { useNavigate } from 'react-router-dom';
import Ornament from '../ui/Ornament';

const ROUTE_MAP: Record<string, string> = {
  'Dresses':       '/categories/dresses',
  'New Arrivals':  '/categories/new-arrivals',
  'Sneakers':      '/categories/sneakers',
  'Bags':          '/categories/bags',
  'Best Sellers':  '/categories/best-sellers',
  'Designer Wear': '/categories/designer-wear',
  'Shoes':         '/categories/shoes',
  'Heels':         '/categories/heels',
  'View All':      '/',
};

interface Cat {
  label:       string;
  desc:        string;
  imgUrl:      string;
  badge?:      string;
  badgeStyle?: 'gold' | 'red';
  count?:      number;
  colClass:    string;
  rowClass:    string;
  mobileCol:   string;
  mobileH:     string;
  isViewAll?:  boolean;
}

const CATS: Cat[] = [
  {
    label: 'Dresses', desc: 'Day wear & evening gowns', count: 48,
    imgUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=80&fit=crop',
    colClass: 'md:[grid-column:1/3]', rowClass: 'md:[grid-row:1]',
    mobileCol: 'col-span-2', mobileH: 'h-[52vw]',
  },
  {
    label: 'New Arrivals', desc: 'Fresh drops, just landed', count: 32,
    badge: 'New In', badgeStyle: 'red',
    imgUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=80&fit=crop',
    colClass: 'md:[grid-column:3/5]', rowClass: 'md:[grid-row:1]',
    mobileCol: 'col-span-2', mobileH: 'h-[44vw]',
  },
  {
    label: 'Sneakers', desc: 'Street & sport',
    imgUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop',
    colClass: 'md:[grid-column:1/2]', rowClass: 'md:[grid-row:2]',
    mobileCol: 'col-span-1', mobileH: 'h-[44vw]',
  },
  {
    label: 'Bags', desc: 'Totes, clutches & more',
    imgUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&fit=crop',
    colClass: 'md:[grid-column:2/3]', rowClass: 'md:[grid-row:2]',
    mobileCol: 'col-span-1', mobileH: 'h-[44vw]',
  },
  {
    label: 'Best Sellers', desc: 'Most loved by our customers', count: 60,
    badge: '★ Top Picks', badgeStyle: 'gold',
    imgUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80&fit=crop',
    colClass: 'md:[grid-column:3/5]', rowClass: 'md:[grid-row:2]',
    mobileCol: 'col-span-2', mobileH: 'h-[44vw]',
  },
  {
    label: 'Designer Wear', desc: 'Luxury & couture pieces',
    imgUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&fit=crop',
    colClass: 'md:[grid-column:1/3]', rowClass: 'md:[grid-row:3]',
    mobileCol: 'col-span-2', mobileH: 'h-[44vw]',
  },
  {
    label: 'Shoes', desc: 'Boots, flats & more',
    imgUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop',
    colClass: 'md:[grid-column:3/4]', rowClass: 'md:[grid-row:3]',
    mobileCol: 'col-span-1', mobileH: 'h-[44vw]',
  },
  {
    label: 'Heels', desc: 'Stilettos & kitten',
    badge: 'Trending', badgeStyle: 'gold',
    imgUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=80&fit=crop',
    colClass: 'md:[grid-column:4/5]', rowClass: 'md:[grid-row:3]',
    mobileCol: 'col-span-1', mobileH: 'h-[44vw]',
  },
  {
    label: 'View All', desc: 'Browse the full collection',
    imgUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80&fit=crop',
    colClass: 'md:hidden', rowClass: '',
    mobileCol: 'col-span-2', mobileH: 'h-[44vw]',
    isViewAll: true,
  },
];

export default function CategorySection() {
  const navigate = useNavigate();

  const handleClick = (cat: Cat) => {
    const route = ROUTE_MAP[cat.label];
    if (route) navigate(route);
  };

  return (
    <div className="px-[5%] pt-1 pb-[clamp(20px,3vw,32px)]">

      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-3.5">
        <div>
          <Ornament label="Explore the Edit" />
          <h2
            className="font-serif font-bold text-navy"
            style={{ fontSize: 'clamp(17px,4vw,26px)' }}
          >
            Shop by Category
          </h2>
        </div>
        <button
          onClick={() => navigate('/')}
          className="font-sans text-[11px] font-semibold text-gold tracking-[1px] uppercase whitespace-nowrap bg-transparent border-none cursor-pointer"
        >
          View All →
        </button>
      </div>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px]">
        {CATS.map(cat => (
          <div
            key={cat.label}
            onClick={() => handleClick(cat)}
            className={`
              relative overflow-hidden cursor-pointer group
              ${cat.mobileCol} ${cat.mobileH}
              ${cat.colClass} ${cat.rowClass}
              md:h-auto
            `}
            style={{ minHeight: 'clamp(130px, 18vw, 280px)' }}
          >
            {/* Background image */}
            <img
              src={cat.imgUrl}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.07]"
            />

            {cat.isViewAll ? (
              <>
                <div className="absolute inset-0" style={{ background: 'rgba(12,8,4,0.75)' }} />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
                  <div className="w-[46px] h-[46px] rounded-full border-2 border-gold flex items-center justify-center text-gold text-xl font-bold transition-colors duration-300 group-hover:bg-gold group-hover:text-navy">
                    →
                  </div>
                  <div
                    className="font-serif font-bold text-white text-[17px]"
                    style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
                  >
                    View All
                  </div>
                  <div className="font-sans text-[11px] text-white/55">Browse full collection</div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                  style={{ background: 'linear-gradient(to top, rgba(8,5,3,0.82) 0%, rgba(8,5,3,0) 55%)' }}
                />

                {cat.badge && (
                  <span className={`absolute top-2.5 right-2.5 z-10 font-sans text-[10px] font-bold px-2.5 py-1 rounded-full tracking-[0.5px] ${
                    cat.badgeStyle === 'red'
                      ? 'bg-[#e8443a] text-white'
                      : 'bg-gold text-navy'
                  }`}>
                    {cat.badge}
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 z-10 p-3 md:p-3.5">
                  <div
                    className="font-serif font-bold text-white leading-tight text-[15px] md:text-[18px]"
                    style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
                  >
                    {cat.label}
                  </div>
                  <div className="hidden md:block font-sans text-[11px] text-white/65 mt-1">
                    {cat.desc}
                  </div>
                </div>

                {cat.count && (
                  <span className="hidden md:block absolute bottom-3.5 right-3 z-10 font-sans text-[10px] text-white/55">
                    {cat.count} items
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}