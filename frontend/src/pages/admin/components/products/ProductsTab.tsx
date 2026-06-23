import React, { useState } from 'react';
import axios from 'axios';
import type { Product } from '../../types';
import { T } from '../../constants';
import { authH } from '../../utils';

// ── Margin badge ──────────────────────────────────────────────────────────────
function MarginBadge({ price, costPrice }: { price: string; costPrice: string | null }) {
  if (!costPrice) return null;
  const p = parseFloat(price);
  const c = parseFloat(costPrice);
  if (!p || !c || c <= 0) return null;
  const margin = ((p - c) / p) * 100;
  const good   = margin >= 30;
  const ok     = margin >= 10;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
      background: good ? '#F0FDF4' : ok ? '#FFFBEB' : '#FEF2F2',
      color:      good ? '#166534' : ok ? '#92400E' : '#991B1B',
      border:     `1px solid ${good ? '#BBF7D0' : ok ? '#FDE68A' : '#FECACA'}`,
    }}>{margin.toFixed(1)}% margin</span>
  );
}

// ── Inline cost price editor ──────────────────────────────────────────────────
function CostPriceCell({ product, onSaved, showToast }: {
  product: Product;
  onSaved: () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState('');
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) { showToast('Enter a valid cost price', 'err'); return; }
    setSaving(true);
    try {
      await axios.patch(`/api/admin/products/${product.id}/cost`, { cost_price: n }, authH());
      showToast('Cost price updated');
      setEditing(false);
      onSaved();
    } catch {
      showToast('Update failed', 'err');
    } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1, pointerEvents: 'none' }}>KSh</div>
          <input
            type="number" min="0" value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            style={{ width: 100, paddingLeft: 32, paddingRight: 6, paddingTop: 6, paddingBottom: 6, borderRadius: 7, border: `2px solid ${T.black}`, fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, outline: 'none', background: T.white }}
          />
        </div>
        <button
          onClick={save} disabled={saving}
          style={{ background: T.black, color: T.white, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
        >{saving ? '…' : '✓'}</button>
        <button
          onClick={() => setEditing(false)}
          style={{ background: T.grey5, color: T.grey1, border: `1px solid ${T.grey3}`, borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 11 }}
        >✕</button>
      </div>
    );
  }

  return (
    <div
      title="Click to set cost price"
      onClick={() => { setEditing(true); setVal(product.cost_price ? String(product.cost_price) : ''); }}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <div style={{
        padding: '5px 12px', borderRadius: 7,
        background: product.cost_price ? T.grey5 : '#FFFBEB',
        border: `1px solid ${product.cost_price ? T.grey3 : '#FDE68A'}`,
      }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Cost</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: product.cost_price ? T.black : '#92400E' }}>
          {product.cost_price ? `KSh ${Number(product.cost_price).toLocaleString()}` : 'Set cost'}
        </div>
      </div>
    </div>
  );
}

// ── Stock cell ────────────────────────────────────────────────────────────────
function StockCell({ product, onSaved, showToast }: {
  product: Product;
  onSaved: () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState('');

  const save = async () => {
    const v = parseInt(val);
    if (isNaN(v) || v < 0) { showToast('Enter a valid stock number', 'err'); return; }
    try {
      await axios.patch(`/api/admin/products/${product.id}/stock`, { stock: v }, authH());
      showToast('Stock updated');
      setEditing(false);
      onSaved();
    } catch { showToast('Stock update failed', 'err'); }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          style={{ width: 64, textAlign: 'center', background: T.white, border: `2px solid ${T.black}`, borderRadius: 7, padding: '6px 8px', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.black, outline: 'none' }}
        />
        <button onClick={save} style={{ background: T.black, color: T.white, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>✓</button>
        <button onClick={() => setEditing(false)} style={{ background: T.grey5, color: T.grey1, border: `1px solid ${T.grey3}`, borderRadius: 6, padding: '6px 9px', cursor: 'pointer', fontSize: 11 }}>✕</button>
      </div>
    );
  }

  const stock = product.stock ?? 0;
  return (
    <div
      title="Click to edit stock"
      onClick={() => { setEditing(true); setVal(String(stock)); }}
      style={{
        cursor: 'pointer', padding: '6px 14px', borderRadius: 8,
        background: stock === 0 ? '#FEF2F2' : stock <= 5 ? '#FFFBEB' : T.grey5,
        border: `1px solid ${stock === 0 ? '#FECACA' : stock <= 5 ? '#FDE68A' : T.grey3}`,
      }}
    >
      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, marginBottom: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>Stock</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: stock === 0 ? '#991B1B' : stock <= 5 ? '#92400E' : T.black }}>{stock}</div>
    </div>
  );
}

// ── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ product: p, onEdit, onDelete, onStockSaved, showToast }: {
  product:     Product;
  onEdit:      (p: Product) => void;
  onDelete:    (id: number, name: string) => void;
  onStockSaved: () => void;
  showToast:   (msg: string, type?: 'ok' | 'err') => void;
}) {
  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      {/* Thumbnail */}
      <img
        src={imgs[0] || `https://placehold.co/64x64/F0F0F0/0A0A0A?text=📦`}
        alt={p.name}
        style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.grey3}` }}
        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/F0F0F0/0A0A0A?text=📦`; }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15,
          color: T.black, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{p.name}</div>

        {/* Meta pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          {p.category && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 20, padding: '2px 8px' }}>
              {p.category}
            </span>
          )}
          <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1 }}>
            {imgs.length} photo{imgs.length !== 1 ? 's' : ''}
          </span>
          {p.colors?.length > 0 && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1 }}>
              {p.colors.length} colour{p.colors.length !== 1 ? 's' : ''}
            </span>
          )}
          {p.sizes?.length > 0 && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1 }}>
              {p.sizes.length} size{p.sizes.length !== 1 ? 's' : ''}
            </span>
          )}
          <MarginBadge price={p.price} costPrice={p.cost_price ? String(p.cost_price) : null} />
        </div>

        {/* Colour swatches */}
        {p.colors?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
            {p.colors.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: T.grey5, border: `1px solid ${T.grey3}`,
                borderRadius: 20, padding: '2px 8px 2px 5px',
                fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.black, fontWeight: 600,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>{c}
              </div>
            ))}
          </div>
        )}

        {/* Size pills */}
        {p.sizes?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {p.sizes.map((s, i) => (
              <div key={i} style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 5, padding: '2px 7px', fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.black }}>{s}</div>
            ))}
          </div>
        )}
      </div>

      {/* Cost price cell */}
      <CostPriceCell product={p} onSaved={onStockSaved} showToast={showToast} />

      {/* Stock cell */}
      <StockCell product={p} onSaved={onStockSaved} showToast={showToast} />

      {/* Selling price */}
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 100 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Price</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 17, color: T.black }}>
          KSh {Number(p.price).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="row-actions" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          className="btn btn-secondary"
          onClick={() => onEdit(p)}
          style={{ background: T.grey5, color: T.black, border: `1px solid ${T.grey3}` }}
        >✏ Edit</button>
        <button
          className="btn btn-danger"
          onClick={() => onDelete(p.id, p.name)}
          style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '8px 10px' }}
        >🗑</button>
      </div>
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
interface ProductsTabProps {
  products:    Product[];
  onAddNew:    () => void;
  onEdit:      (p: Product) => void;
  onDelete:    (id: number, name: string) => void;
  onStockSaved: () => void;
  showToast:   (msg: string, type?: 'ok' | 'err') => void;
}

export function ProductsTab({ products, onAddNew, onEdit, onDelete, onStockSaved, showToast }: ProductsTabProps) {
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState<'name' | 'price' | 'stock' | 'margin'>('name');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filtered = products
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortBy === 'name')   { av = a.name;  bv = b.name; }
      if (sortBy === 'price')  { av = parseFloat(a.price);  bv = parseFloat(b.price); }
      if (sortBy === 'stock')  { av = a.stock ?? 0; bv = b.stock ?? 0; }
      if (sortBy === 'margin') {
        const mg = (p: Product) => p.cost_price && parseFloat(p.price) > 0
          ? ((parseFloat(p.price) - parseFloat(String(p.cost_price))) / parseFloat(p.price)) * 100 : -1;
        av = mg(a); bv = mg(b);
      }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      style={{
        fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600,
        padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
        border: `1px solid ${sortBy === col ? T.black : T.grey3}`,
        background: sortBy === col ? T.black : T.white,
        color: sortBy === col ? T.white : T.grey1,
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      {label}
      {sortBy === col && <span style={{ fontSize: 9 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  // Cost price coverage stat
  const withCost = products.filter(p => p.cost_price && parseFloat(String(p.cost_price)) > 0).length;

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Catalogue</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>
            Products <span style={{ fontSize: 20, color: T.grey1 }}>({products.length})</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Cost coverage hint */}
          {products.length > 0 && withCost < products.length && (
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, padding: '7px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontWeight: 600 }}>
              ⚠ {products.length - withCost} products missing cost price
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ background: T.black, color: T.white, padding: '11px 22px', fontSize: 12, fontWeight: 700, borderRadius: 8, letterSpacing: '0.5px' }}
            onClick={onAddNew}
          >+ Add Product</button>
        </div>
      </div>

      {/* Search + sort bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, minWidth: 200 }}>
          <span style={{ opacity: 0.35, fontSize: 14 }}>🔍</span>
          <input
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, flex: 1 }}
            placeholder="Search by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.grey1, fontSize: 14 }}>✕</button>}
        </div>

        {/* Sort buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <SortBtn col="name"   label="Name"   />
          <SortBtn col="price"  label="Price"  />
          <SortBtn col="stock"  label="Stock"  />
          <SortBtn col="margin" label="Margin" />
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
            {search ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 8 }}>No results for "{search}"</div>
                <button
                  className="btn btn-secondary"
                  style={{ background: T.grey5, color: T.grey1, border: `1px solid ${T.grey3}`, margin: '0 auto' }}
                  onClick={() => setSearch('')}
                >Clear search</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 10 }}>No products yet</div>
                <button
                  className="btn btn-primary"
                  style={{ background: T.black, color: T.white, padding: '11px 28px', fontSize: 12, fontWeight: 700, borderRadius: 8, margin: '0 auto' }}
                  onClick={onAddNew}
                >+ Add Your First Product</button>
              </>
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