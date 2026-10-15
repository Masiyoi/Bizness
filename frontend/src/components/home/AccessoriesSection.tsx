// src/components/home/AccessoriesSection.tsx
import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../../constants/theme';

type Gender = 'men' | 'women';

interface CategoryNode { id: string; name: string; slug: string; sort_order?: number; }
interface CategoryTree {
  men:   { footwear: CategoryNode[]; clothing: CategoryNode[]; accessories: CategoryNode[] };
  women: { footwear: CategoryNode[]; clothing: CategoryNode[]; accessories: CategoryNode[] };
}

interface AccessoriesSectionProps {
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
  .ac-section { padding: clamp(32px,5vw,72px) clamp(20px,5%,80px) clamp(40px,6vw,80px); background: #fff; border-top: 1px solid rgba(0,0,0,0.10); }
  .ac-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .ac-title { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: clamp(22px,3.4vw,34px); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #0A0A0A; }
  .ac-tabs { display: flex; align-items: baseline; gap: 10px; margin-top: 10px; }
  .ac-tab { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; background: none; border: none; cursor: pointer; padding: 2px 0; color: rgba(0,0,0,0.35); }
  .ac-tab.active { color: #0A0A0A; text-decoration: underline; text-underline-offset: 4px; }
  .ac-tab-sep { color: rgba(0,0,0,0.25); font-size: 13px; }
  .ac-shop-link { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #0A0A0A; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
  .ac-subcats { display: flex; overflow-x: auto; gap: 8px; margin-bottom: 24px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .ac-subcats::-webkit-scrollbar { display: none }
  .ac-subcat-btn { flex-shrink: 0; font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 9px 16px; border: 1px solid rgba(0,0,0,0.15); background: #fff; color: rgba(0,0,0,0.5); cursor: pointer; transition: all 0.18s; border-radius: 2px; }
  .ac-subcat-btn:hover { border-color: #0A0A0A; color: #0A0A0A; }
  .ac-subcat-btn.active { background: #0A0A0A; color: #fff; border-color: #0A0A0A; }
  .ac-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 16px; }
  @media(max-width:1024px) { .ac-grid { grid-template-columns: repeat(3,1fr); gap: 16px 12px } }
  @media(max-width:640px)  { .ac-grid { grid-template-columns: repeat(2,1fr); gap: 12px 8px } }
  .ac-empty { font-family: var(--f-sans,'DM Sans',sans-serif); font-size: 13px; color: rgba(0,0,0,0.45); padding: 40px 0; text-align: center; }
`;

export default function AccessoriesSection({
  products, categoryTree, cartIds, wishlist, isAdmin,
  onCartToggle, onWishlistToggle, onShopAll,
}: AccessoriesSectionProps) {
  const [gender, setGender]       = useState<Gender>('women');
  const [activeSub, setActiveSub] = useState('all');

  const subcats = categoryTree?.[gender]?.accessories ?? [];

  const filtered = useMemo(() => {
    return products
      .filter(p =>
        p.category_department === 'accessories' &&
        p.category_gender === gender &&
        (activeSub === 'all' || p.category_slug === activeSub)
      )
      .slice(0, VISIBLE_COUNT);
  }, [products, gender, activeSub]);

  const switchGender = (g: Gender) => { setGender(g); setActiveSub('all'); };

  return (
    <section className="ac-section">
      <style>{css}</style>

      <div className="ac-head">
        <div>
          <h2 className="ac-title">Accessories</h2>
          <div className="ac-tabs">
            <button className={`ac-tab ${gender === 'women' ? 'active' : ''}`} onClick={() => switchGender('women')}>Women's</button>
            <span className="ac-tab-sep">/</span>
            <button className={`ac-tab ${gender === 'men' ? 'active' : ''}`} onClick={() => switchGender('men')}>Men's</button>
          </div>
        </div>
        <button className="ac-shop-link" onClick={() => onShopAll(gender)}>
          Shop {gender === 'women' ? "Women's" : "Men's"}
        </button>
      </div>

      {subcats.length > 0 && (
        <div className="ac-subcats">
          <button className={`ac-subcat-btn ${activeSub === 'all' ? 'active' : ''}`} onClick={() => setActiveSub('all')}>All</button>
          {subcats.map(c => (
            <button
              key={c.id}
              className={`ac-subcat-btn ${activeSub === c.slug ? 'active' : ''}`}
              onClick={() => setActiveSub(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="ac-empty">No accessories here yet, check back soon.</p>
      ) : (
        <div className="ac-grid">
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