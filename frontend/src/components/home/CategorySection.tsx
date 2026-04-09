// src/components/home/CategorySection.tsx
import { useRef } from 'react';
import { CATEGORIES } from '../../constants/theme';
import Ornament from '../ui/Ornament';

interface CategorySectionProps {
  active:    string;
  onChange:  (cat: string) => void;
}

export default function CategorySection({ active, onChange }: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClick = (label: string) => {
    onChange(label);
    if (scrollRef.current) {
      const idx  = CATEGORIES.findIndex(c => c.label === label);
      const pill = scrollRef.current.children[idx] as HTMLElement;
      if (pill) pill.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    }
  };

  return (
    <div className="px-[5%] pt-1 pb-[clamp(20px,3vw,32px)]">
      <div className="flex justify-between items-end mb-3.5">
        <div>
          <Ornament label="Browse Fashion"/>
          <h2 className="font-serif font-bold text-navy" style={{ fontSize:'clamp(18px,3vw,26px)' }}>
            Shop by Category
          </h2>
        </div>
        <span className="font-sans text-[11px] font-semibold text-gold cursor-pointer tracking-[1px] uppercase whitespace-nowrap">
          View All →
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-1 scroll-smooth [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-cream-deep [&::-webkit-scrollbar-thumb]:rounded-sm"
      >
        {CATEGORIES.map(cat => (
          <div
            key={cat.label}
            className={`cat-pill ${active === cat.label ? 'active' : ''}`}
            onClick={() => handleClick(cat.label)}
          >
            <span className="text-base">{cat.icon}</span>
            <div>
              <div className={`font-sans text-[11px] font-semibold leading-tight ${active === cat.label ? 'text-gold-light' : 'text-navy'}`}>
                {cat.label}
              </div>
              <div className={`font-sans text-[9px] leading-tight ${active === cat.label ? 'text-white/50' : 'text-muted'}`}>
                {cat.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}