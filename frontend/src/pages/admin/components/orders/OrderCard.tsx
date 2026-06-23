// ─────────────────────────────────────────────────────────────────────────────
// OrderCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import type { Order } from '../../types';
import { T, SC } from '../../constants';
import { parseItemsSnapshot } from '../../utils';

interface OrderCardProps {
  order:    Order;
  onView:   (o: Order) => void;
  onUpdate: (o: Order) => void;
}

export function OrderCard({ order: o, onView, onUpdate }: OrderCardProps) {
  const sc    = SC[o.status] || SC.pending;
  const items = parseItemsSnapshot(o.items_snapshot);
  const preview = items.slice(0, 3);

  return (
    <div
      className="order-card order-card-clickable"
      onClick={() => onView(o)}
      style={{ background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 14, padding: '16px 20px' }}
    >
      <div className="order-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>

        {/* ── Left ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: T.black }}>
              Order #{o.id}
            </span>
            <span style={{
              fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700,
              padding: '2px 10px', borderRadius: 20,
              background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`,
              textTransform: 'capitalize',
            }}>{o.status}</span>
            <span style={{
              fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1,
              background: T.grey5, border: `1px solid ${T.grey3}`,
              borderRadius: 20, padding: '2px 9px',
            }}>🚚 {o.tracking_status}</span>
          </div>

          {/* Meta */}
          <div className="order-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 4, marginBottom: preview.length > 0 ? 12 : 0 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.black }}>
              👤 <strong>{o.customer_name || 'Unknown'}</strong>
            </div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>✉ {o.customer_email || '—'}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>📱 {o.mpesa_phone || '—'}</div>
            {o.mpesa_receipt && (
              <div
                onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(o.mpesa_receipt); }}
                title="Click to copy"
                style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                🧾 <strong style={{ color: '#166534' }}>{o.mpesa_receipt}</strong>
                <span style={{ fontSize: 9, color: T.grey2, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 4, padding: '1px 5px' }}>copy</span>
              </div>
            )}
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey2 }}>
              🕐 {new Date(o.created_at).toLocaleString('en-KE')}
            </div>
          </div>

          {/* Item previews */}
          {preview.length > 0 && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              {preview.map((item: any, i: number) => {
                const imgSrc = item.image_url || item.imageUrl || item.image || null;
                const name   = item.name || item.product_name || `Item ${i + 1}`;
                const color  = item.selected_color || item.color || null;
                const size   = item.selected_size  || item.size  || null;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: T.grey5, border: `1px solid ${T.grey3}`,
                    borderRadius: 9, padding: '5px 9px 5px 5px', maxWidth: 200,
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: T.grey4 }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/32x32/F0F0F0/0A0A0A?text=📦`; }}/>
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{name}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                        {color && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}/>
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1 }}>{color}</span>
                          </div>
                        )}
                        {size && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1 }}>/ {size}</span>}
                        {item.quantity > 1 && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1 }}>× {item.quantity}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length > 3 && (
                <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, fontWeight: 600 }}>+{items.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* ── Right ── */}
        <div className="order-card-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: T.black }}>
            KSh {Number(o.total).toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              className="btn btn-secondary"
              style={{ background: T.grey5, color: T.black, border: `1px solid ${T.grey3}`, fontSize: 11, padding: '7px 12px' }}
              onClick={e => { e.stopPropagation(); onView(o); }}
            >👁 Details</button>
            <button
              className="btn btn-primary"
              style={{ background: T.black, color: T.white, padding: '7px 12px', fontWeight: 700, fontSize: 11 }}
              onClick={e => { e.stopPropagation(); onUpdate(o); }}
            >✏ Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}