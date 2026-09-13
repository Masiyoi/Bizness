// src/components/home/FootwearSection.tsx
import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../../constants/theme';

type Gender = 'men' | 'women';

interface CategoryNode { id: string; name: string; slug: string; sort_order?: number; }
interface CategoryTree {
  men:   { footwear: CategoryNode[]; clothing: CategoryNode[] };
  women: { footwear: CategoryNode[]; clothing: CategoryNode[] };
}

interface FootwearSectionProps {
  products:         Product[];
  categoryTree:     CategoryTree | null;
  cartIds:          number[];
  wishlist:         number[];
  isAdmin:          boolean;
  onCartToggle:     (id: number) => void;
  onWishlistToggle: (id: number) => void;
  onShopAll:        (gender: Gender) => void;
}

const VISIBLE_COUNT = 8;

const css = `
  .fw-section { padding: clamp(32px,5vw,72px) clamp(20px,5%,80px) clamp(40px,6vw,80px); background: #fff; border-top: 1px solid rgba(0,0,0,0.10); }
  .fw-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .fw-title { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: clamp(22px,3.4vw,34px); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #0A0A0A; }
  .fw-tabs { display: flex; align-items: baseline; gap: 10px; margin-top: 10px; }
  .fw-tab { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; background: none; border: none; cursor: pointer; padding: 2px 0; color: rgba(0,0,0,0.35); }
  .fw-tab.active { color: #0A0A0A; text-decoration: underline; text-underline-offset: 4px; }
  .fw-tab-sep { color: rgba(0,0,0,0.25); font-size: 13px; }
  .fw-shop-link { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #0A0A0A; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
  .fw-subcats { display: flex; overflow-x: auto; gap: 8px; margin-bottom: 24px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .fw-subcats::-webkit-scrollbar { display: none }
  .fw-subcat-btn { flex-shrink: 0; font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 9px 16px; border: 1px solid rgba(0,0,0,0.15); background: #fff; color: rgba(0,0,0,0.5); cursor: pointer; transition: all 0.18s; border-radius: 2px; }
  .fw-subcat-btn:hover { border-color: #0A0A0A; color: #0A0A0A; }
  .fw-subcat-btn.active { background: #0A0A0A; color: #fff; border-color: #0A0A0A; }
  .fw-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
  @media(max-width:1024px) { .fw-grid { grid-template-columns: repeat(3,1fr); gap: 16px 12px } }
  @media(max-width:640px)  { .fw-grid { grid-template-columns: repeat(2,1fr); gap: 12px 8px } }
  .fw-empty { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 13px; color: rgba(0,0,0,0.45); padding: 40px 0; text-align: center; }
`;

export default function FootwearSection({
  products, categoryTree, cartIds, wishlist, isAdmin,
  onCartToggle, onWishlistToggle, onShopAll,
}: FootwearSectionProps) {
  const [gender, setGender]       = useState<Gender>('women');
  const [activeSub, setActiveSub] = useState('all');

  const subcats = categoryTree?.[gender]?.footwear ?? [];

  const filtered = useMemo(() => {
    return products
      .filter(p =>
        p.category_department === 'footwear' &&
        p.category_gender === gender &&
        (activeSub === 'all' || p.category_slug === activeSub)
      )
      .slice(0, VISIBLE_COUNT);
  }, [products, gender, activeSub]);

  const switchGender = (g: Gender) => { setGender(g); setActiveSub('all'); };

  return (
    <section className="fw-section">
      <style>{css}</style>

      <div className="fw-head">
        <div>
          <h2 className="fw-title">Footwear</h2>
          <div className="fw-tabs">
            <button className={`fw-tab ${gender === 'women' ? 'active' : ''}`} onClick={() => switchGender('women')}>Women's</button>
            <span className="fw-tab-sep">/</span>
            <button className={`fw-tab ${gender === 'men' ? 'active' : ''}`} onClick={() => switchGender('men')}>Men's</button>
          </div>
        </div>
        <button className="fw-shop-link" onClick={() => onShopAll(gender)}>
          Shop {gender === 'women' ? "Women's" : "Men's"}
        </button>
      </div>

      {subcats.length > 0 && (
        <div className="fw-subcats">
          <button className={`fw-subcat-btn ${activeSub === 'all' ? 'active' : ''}`} onClick={() => setActiveSub('all')}>All</button>
          {subcats.map(c => (
            <button
              key={c.id}
              className={`fw-subcat-btn ${activeSub === c.slug ? 'active' : ''}`}
              onClick={() => setActiveSub(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="fw-empty">No footwear here yet check back soon.</p>
      ) : (
        <div className="fw-grid">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              inCart={cartIds.includes(product.id)}
              inWishlist={wishlist.includes(product.id)}
              isAdmin={isAdmin}
              onCartToggle={onCartToggle}
              onWishlistToggle={onWishlistToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}