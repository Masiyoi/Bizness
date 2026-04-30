import React, { useState } from 'react';
import axios from 'axios';
import type { Product } from '../../types';
import { T } from '../../constants';
import { authH } from '../../utils';

interface ProductRowProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number, name: string) => void;
  onStockSaved: () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

function ProductRow({ product: p, onEdit, onDelete, onStockSaved, showToast }: ProductRowProps) {
  const [editingStock, setEditingStock] = useState(false);
  const [stockVal, setStockVal] = useState('');

  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];

  const saveStock = async () => {
    const v = parseInt(stockVal);
    if (isNaN(v) || v < 0) { showToast('Enter a valid stock number', 'err'); return; }
    try {
      await axios.patch(`/api/admin/products/${p.id}/stock`, { stock: v }, authH());
      showToast('Stock updated!');
      setEditingStock(false);
      onStockSaved();
    } catch {
      showToast('Stock update failed', 'err');
    }
  };

  return (
    <div className="row">
      <img
        src={imgs[0] || 'https://placehold.co/64x64/F0EAD8/0D1B3E?text=📦'}
        alt={p.name}
        style={{ width: 62, height: 62, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.cream3}` }}
        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/F0EAD8/0D1B3E?text=📦'; }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 15, color: T.navy, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {p.category && <span>🏷 {p.category}</span>}
          <span>🖼 {imgs.length} photo{imgs.length !== 1 ? 's' : ''}</span>
          {p.colors?.length > 0 && <span>🎨 {p.colors.length} colour{p.colors.length !== 1 ? 's' : ''}</span>}
          {p.sizes?.length  > 0 && <span>📐 {p.sizes.length} size{p.sizes.length !== 1 ? 's' : ''}</span>}
        </div>
        {p.colors?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
            {p.colors.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 20, padding: '2px 8px 2px 5px', fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.navy, fontWeight: 600 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>{c}
              </div>
            ))}
          </div>
        )}
        {p.sizes?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            {p.sizes.map((s, i) => (
              <div key={i} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 6, padding: '2px 8px', fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.navy }}>{s}</div>
            ))}
          </div>
        )}
      </div>

      {/* Stock editor */}
      <div style={{ flexShrink: 0 }}>
        {editingStock ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" value={stockVal}
              onChange={e => setStockVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveStock(); if (e.key === 'Escape') setEditingStock(false); }}
              autoFocus
              style={{ width: 64, textAlign: 'center', background: T.cream, border: `2px solid ${T.gold}`, borderRadius: 7, padding: '6px 8px', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.navy, outline: 'none' }}
            />
            <button className="btn" style={{ background: '#4A8A4A', color: '#fff', padding: '6px 10px' }} onClick={saveStock}>✓</button>
            <button className="btn" style={{ background: T.cream, color: T.muted, border: `1px solid ${T.cream3}`, padding: '6px 10px' }} onClick={() => setEditingStock(false)}>✕</button>
          </div>
        ) : (
          <div
            title="Click to edit stock"
            onClick={() => { setEditingStock(true); setStockVal(String(p.stock ?? 0)); }}
            style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 9, background: p.stock === 0 ? '#FDF0EE' : p.stock <= 5 ? '#FDF8EC' : '#EEF5EE', border: `1px solid ${p.stock === 0 ? '#F5C6C0' : p.stock <= 5 ? '#F6E4A0' : '#C8DFC8'}` }}
          >
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.muted, marginBottom: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>STOCK</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, color: p.stock === 0 ? '#C0392B' : p.stock <= 5 ? '#B7791F' : '#2E7D32' }}>{p.stock ?? 0}</div>
          </div>
        )}
      </div>

      <div className="row-price" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: T.gold, flexShrink: 0, minWidth: 110, textAlign: 'right' }}>
        KSh {Number(p.price).toLocaleString()}
      </div>

      <div className="row-actions" style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
        <button className="btn" style={{ background: T.cream, color: T.navy, border: `1px solid ${T.cream3}` }} onClick={() => onEdit(p)}>✏️ Edit</button>
        <button className="btn" style={{ background: '#FDF0EE', color: '#C0392B', border: '1px solid #F5C6C0', padding: '9px 10px' }} onClick={() => onDelete(p.id, p.name)}>🗑</button>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
interface ProductsTabProps {
  products: Product[];
  onAddNew: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: number, name: string) => void;
  onStockSaved: () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function ProductsTab({ products, onAddNew, onEdit, onDelete, onStockSaved, showToast }: ProductsTabProps) {
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <div className="products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Catalogue</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: T.navy }}>Products ({products.length})</h1>
        </div>
        <button
          className="btn"
          style={{ background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, padding: '12px 24px', fontSize: 12, fontWeight: 700, borderRadius: 8, letterSpacing: '1px', boxShadow: '0 4px 14px rgba(200,169,81,0.3)', flexShrink: 0 }}
          onClick={onAddNew}
        >+ Add Product</button>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '10px 16px', gap: 10, marginBottom: 16 }}>
        <span style={{ opacity: 0.4, fontSize: 15 }}>🔍</span>
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.navy, flex: 1 }}
          placeholder="Search by name or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 15 }}>✕</button>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontFamily: 'Jost,sans-serif' }}>
            {search ? (
              <div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.navy }}>No results for "{search}"</div>
                <button className="btn" style={{ background: T.cream, color: T.muted, border: `1px solid ${T.cream3}`, margin: '12px auto 0', padding: '8px 18px' }} onClick={() => setSearch('')}>Clear search</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 50, marginBottom: 14 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: T.navy }}>No products yet</div>
                <button className="btn" style={{ background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, padding: '12px 28px', fontSize: 12, fontWeight: 700, borderRadius: 8, margin: '0 auto' }} onClick={onAddNew}>
                  + Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}
        {filtered.map(p => (
          <ProductRow
            key={p.id}
            product={p}
            onEdit={onEdit}
            onDelete={onDelete}
            onStockSaved={onStockSaved}
            showToast={showToast}
          />
        ))}
      </div>
    </div>
  );
}