import React from 'react';
import type { Order } from '../../types';
import { T, SC } from '../../constants';
import { parseItemsSnapshot } from '../../utils';

interface OrderCardProps {
  order: Order;
  onView: (o: Order) => void;
  onUpdate: (o: Order) => void;
}

export function OrderCard({ order: o, onView, onUpdate }: OrderCardProps) {
  const sc = SC[o.status] || SC.pending;
  const items = parseItemsSnapshot(o.items_snapshot);
  const previewItems = items.slice(0, 3);

  const handleCopyReceipt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (o.mpesa_receipt) {
      navigator.clipboard.writeText(o.mpesa_receipt);
    }
  };

  return (
    <div
      className="order-card order-card-clickable"
      onClick={() => onView(o)}
      style={{ background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 16, padding: '18px 22px' }}
    >
      <div className="order-card-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: T.navy }}>Order #{o.id}</span>
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`, textTransform: 'capitalize', letterSpacing: '0.3px' }}>{o.status}</span>
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 20, padding: '3px 10px' }}>🚚 {o.tracking_status}</span>
          </div>

          {/* Meta grid */}
          <div className="order-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 5, marginBottom: previewItems.length > 0 ? 12 : 0 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.navy }}>👤 <strong>{o.customer_name || 'Unknown'}</strong></div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>✉️ {o.customer_email || '—'}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>📱 {o.mpesa_phone || '—'}</div>
            {o.mpesa_receipt && (
              <div
                onClick={handleCopyReceipt}
                title="Click to copy receipt code"
                style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                🧾 <strong style={{ color: '#4A8A4A' }}>{o.mpesa_receipt}</strong>
                <span style={{ fontSize: 9, color: T.muted, background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 4, padding: '1px 5px' }}>copy</span>
              </div>
            )}
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.muted }}>🕐 {new Date(o.created_at).toLocaleString('en-KE')}</div>
          </div>

          {/* Mini product previews */}
          {previewItems.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {previewItems.map((item: any, i: number) => {
                const imgSrc = item.image_url || item.imageUrl || item.image || null;
                const itemName = item.name || item.product_name || `Item ${i + 1}`;
                const selectedColor = item.selected_color || item.color || null;
                const selectedSize  = item.selected_size  || item.size  || null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '6px 10px 6px 6px', maxWidth: 220 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: T.cream2 }}>
                      {imgSrc
                        ? <img src={imgSrc} alt={itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/36x36/F0EAD8/0D1B3E?text=📦'; }}/>
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{itemName}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                        {selectedColor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedColor, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}/>
                            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.muted }}>{selectedColor}</span>
                          </div>
                        )}
                        {selectedSize && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted }}>/ {selectedSize}</span>}
                        {item.quantity > 1 && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.muted }}>× {item.quantity}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length > 3 && (
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, fontWeight: 600 }}>+{items.length - 3} more</div>
              )}
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="order-card-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.gold }}>KSh {Number(o.total).toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              style={{ background: T.cream, color: T.navy, border: `1px solid ${T.cream3}`, fontSize: 11, padding: '7px 12px' }}
              onClick={e => { e.stopPropagation(); onView(o); }}
            >👁 Details</button>
            <button
              className="btn"
              style={{ background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, padding: '7px 12px', fontWeight: 700, fontSize: 11 }}
              onClick={e => { e.stopPropagation(); onUpdate(o); }}
            >✏️ Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}