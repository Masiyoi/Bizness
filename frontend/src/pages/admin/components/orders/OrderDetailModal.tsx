import React from 'react';
import type { Order } from '../../types';
import { T, SC, ZONE_LABELS } from '../../constants';
import { parseItemsSnapshot, parseShippingInfo, parseDeliveryZone } from '../../utils';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: () => void;
}

export function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  const items        = parseItemsSnapshot(order.items_snapshot);
  const shippingInfo = parseShippingInfo(order);
  const deliveryZone = parseDeliveryZone(order);
  const sc           = SC[order.status] || SC.pending;
  const zoneLabel    = deliveryZone ? ZONE_LABELS[deliveryZone] : null;

  const handleCopyReceipt = () => {
    if (order.mpesa_receipt) {
      navigator.clipboard.writeText(order.mpesa_receipt);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.65)', backdropFilter: 'blur(5px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 640, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(13,27,62,0.35)', animation: 'wizardIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* ── Modal header ── */}
        <div style={{ background: T.navy, borderRadius: '22px 22px 0 0', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>Order Details</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 22, color: '#fff' }}>Order #{order.id}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {new Date(order.created_at).toLocaleString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>{order.status}</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, width: 36, height: 36, cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── Customer & Payment ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>👤 Customer</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: T.navy, marginBottom: 5 }}>{order.customer_name || 'Unknown'}</div>
              {order.customer_email && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted, marginBottom: 4 }}>✉️ {order.customer_email}</div>}
              {order.mpesa_phone    && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted }}>📱 {order.mpesa_phone}</div>}
            </div>
            <div style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>💳 Payment</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.gold, marginBottom: 5 }}>KSh {Number(order.total).toLocaleString()}</div>
              {order.mpesa_receipt && (
                <button
                  onClick={handleCopyReceipt}
                  title="Click to copy"
                  style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: '#2E7D32', background: '#EEF5EE', border: '1px solid #C8DFC8', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}
                >
                  🧾 {order.mpesa_receipt} <span style={{ fontSize: 9, opacity: 0.6 }}>copy</span>
                </button>
              )}
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>🚚 {order.tracking_status}</div>
            </div>
          </div>

          {/* ── Shipping / Delivery Info ── */}
          {(shippingInfo || zoneLabel) && (
            <div style={{ background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg,${T.navy},${T.navy3})`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>{zoneLabel?.icon || '📦'}</span>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Delivery Information{zoneLabel ? ` — ${zoneLabel.label}` : ''}
                </div>
              </div>
              <div style={{ padding: '16px 18px' }}>
                {shippingInfo ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(shippingInfo.firstName || shippingInfo.lastName) && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Name</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600, color: T.navy }}>{[shippingInfo.firstName, shippingInfo.lastName].filter(Boolean).join(' ')}</div>
                      </div>
                    )}
                    {shippingInfo.phone && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Phone</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600, color: T.navy }}>{shippingInfo.phone}</div>
                      </div>
                    )}
                    {shippingInfo.email && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Email</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy }}>{shippingInfo.email}</div>
                      </div>
                    )}
                    {(shippingInfo.county || shippingInfo.town) && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy }}>📍 {[shippingInfo.town, shippingInfo.county].filter(Boolean).join(', ')}</div>
                      </div>
                    )}
                    {shippingInfo.pickupLocation && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Pickup Location</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy }}>🏪 {shippingInfo.pickupLocation}</div>
                      </div>
                    )}
                    {shippingInfo.additionalInfo && (
                      <div style={{ gridColumn: '1/-1', background: T.cream, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Delivery Notes</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy, lineHeight: 1.6, fontStyle: 'italic' }}>"{shippingInfo.additionalInfo}"</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, fontStyle: 'italic' }}>No shipping details saved with this order.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Ordered Items ── */}
          <div style={{ background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg,rgba(200,169,81,0.15),rgba(200,169,81,0.05))`, borderBottom: `1px solid ${T.cream3}`, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.navy, letterSpacing: '1.5px', textTransform: 'uppercase' }}>🛍️ Items Ordered</div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, fontStyle: 'italic' }}>Item details not available for this order.</div>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 6, opacity: 0.7 }}>Order total: KSh {Number(order.total).toLocaleString()}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item: any, idx: number) => {
                  const imgSrc        = item.image_url || item.imageUrl || item.image || null;
                  const itemName      = item.name || item.product_name || `Product #${item.product_id || idx + 1}`;
                  const itemPrice     = item.price || item.unit_price || 0;
                  const qty           = item.quantity || 1;
                  const lineTotal     = Number(itemPrice) * qty;
                  const selectedColor = item.selected_color || item.color || null;
                  const selectedSize  = item.selected_size  || item.size  || null;
                  const category      = item.category || null;
                  const isLast        = idx === items.length - 1;

                  return (
                    <div key={idx} style={{ display: 'flex', gap: 16, padding: '16px 18px', borderBottom: isLast ? 'none' : `1px solid ${T.cream3}` }}>
                      <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: T.cream2, border: `1px solid ${T.cream3}` }}>
                        {imgSrc
                          ? <img src={imgSrc} alt={itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/F0EAD8/0D1B3E?text=📦'; }}/>
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {category && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.gold, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>{category}</div>}
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 15, color: T.navy, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemName}</div>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                          {selectedColor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 20, padding: '3px 10px 3px 7px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.navy }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedColor, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>{selectedColor}
                            </div>
                          )}
                          {selectedSize && (
                            <div style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 7, padding: '3px 10px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.navy }}>📐 {selectedSize}</div>
                          )}
                          <div style={{ background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.25)', borderRadius: 7, padding: '3px 10px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.gold }}>Qty: {qty}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: T.navy }}>KSh {lineTotal.toLocaleString()}</span>
                          {qty > 1 && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>(KSh {Number(itemPrice).toLocaleString()} × {qty})</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: `2px solid ${T.cream3}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.cream }}>
                  <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Order Total</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.gold }}>KSh {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onUpdateStatus}
              style={{ flex: 1, borderRadius: 10, border: 'none', padding: '14px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, cursor: 'pointer', boxShadow: '0 4px 14px rgba(200,169,81,0.28)' }}
            >✏️ Update Status</button>
            <button
              onClick={onClose}
              style={{ borderRadius: 10, border: `1px solid ${T.cream3}`, padding: '14px 20px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, background: T.cream, color: T.muted, cursor: 'pointer' }}
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}