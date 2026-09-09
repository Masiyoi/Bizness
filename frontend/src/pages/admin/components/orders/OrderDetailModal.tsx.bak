import React from 'react';
import type { Order } from '../../types';
import { T, ZONE_LABELS } from '../../constants';
import { parseItemsSnapshot, parseShippingInfo, parseDeliveryZone } from '../../utils';
 
interface OrderDetailModalProps {
  order:          Order;
  onClose:        () => void;
  onUpdateStatus: () => void;
}
 
export function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  const items        = parseItemsSnapshot(order.items_snapshot);
  const shippingInfo = parseShippingInfo(order);
  const deliveryZone = parseDeliveryZone(order);
  const zoneLabel    = deliveryZone ? ZONE_LABELS[deliveryZone] : null;
 
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: T.white, borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'wizardIn 0.28s cubic-bezier(.34,1.56,.64,1)' }}>
 
        {/* ── Modal header ── */}
        <div style={{ background: T.black, borderRadius: '18px 18px 0 0', padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 5 }}>Order Details</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.white }}>Order #{order.order_number || order.id}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              {new Date(order.created_at).toLocaleString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(255,255,255,0.12)', color: T.white, border: '1px solid rgba(255,255,255,0.25)',
            }}>🚚 {order.tracking_status}</span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>
 
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
 
          {/* ── Customer + Payment ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Customer</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: T.black, marginBottom: 5 }}>{order.customer_name || 'Unknown'}</div>
              {order.customer_email && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, marginBottom: 3 }}>✉ {order.customer_email}</div>}
              {order.mpesa_phone    && <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>📱 {order.mpesa_phone}</div>}
            </div>
            <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Payment</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.black, marginBottom: 6 }}>KSh {Number(order.total).toLocaleString()}</div>
              {order.mpesa_receipt && (
                <button
                  onClick={() => navigator.clipboard.writeText(order.mpesa_receipt)}
                  title="Click to copy"
                  style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: '#166534', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 6 }}
                >🧾 {order.mpesa_receipt} <span style={{ fontSize: 9, opacity: 0.6 }}>copy</span></button>
              )}
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>🚚 {order.tracking_status}</div>
            </div>
          </div>
 
          {/* ── Delivery Info ── */}
          {(shippingInfo || zoneLabel) && (
            <div style={{ background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: T.black, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 14 }}>{zoneLabel?.icon || '📦'}</span>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Delivery{zoneLabel ? ` — ${zoneLabel.label}` : ''}
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {shippingInfo ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(shippingInfo.firstName || shippingInfo.lastName) && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Name</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600, color: T.black }}>{[shippingInfo.firstName, shippingInfo.lastName].filter(Boolean).join(' ')}</div>
                      </div>
                    )}
                    {shippingInfo.phone && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Phone</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600, color: T.black }}>{shippingInfo.phone}</div>
                      </div>
                    )}
                    {shippingInfo.email && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Email</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black }}>{shippingInfo.email}</div>
                      </div>
                    )}
                    {(shippingInfo.county || shippingInfo.town) && (
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black }}>📍 {[shippingInfo.town, shippingInfo.county].filter(Boolean).join(', ')}</div>
                      </div>
                    )}
                    {shippingInfo.pickupLocation && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Pickup</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black }}>🏪 {shippingInfo.pickupLocation}</div>
                      </div>
                    )}
                    {shippingInfo.additionalInfo && (
                      <div style={{ gridColumn: '1/-1', background: T.grey5, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, lineHeight: 1.6, fontStyle: 'italic' }}>"{shippingInfo.additionalInfo}"</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1, fontStyle: 'italic' }}>No shipping details saved.</div>
                )}
              </div>
            </div>
          )}
 
          {/* ── Items ── */}
          <div style={{ background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: T.grey5, borderBottom: `1px solid ${T.grey3}`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.black, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Items Ordered</div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
            </div>
 
            {items.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1, fontStyle: 'italic' }}>Item details not available.</div>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey2, marginTop: 5 }}>Total: KSh {Number(order.total).toLocaleString()}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item: any, idx: number) => {
                  const imgSrc  = item.image_url || item.imageUrl || item.image || null;
                  const name    = item.name || item.product_name || `Product #${item.product_id || idx + 1}`;
                  const price   = item.price || item.unit_price || 0;
                  const qty     = item.quantity || 1;
                  const color   = item.selected_color || item.color || null;
                  const size    = item.selected_size  || item.size  || null;
                  const isLast  = idx === items.length - 1;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: isLast ? 'none' : `1px solid ${T.grey3}` }}>
                      <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: T.grey4, border: `1px solid ${T.grey3}` }}>
                        {imgSrc
                          ? <img src={imgSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/72x72/F0F0F0/0A0A0A?text=📦`; }}/>
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {color && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 20, padding: '3px 9px 3px 6px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.black }}>
                              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, border: '1.5px solid rgba(0,0,0,0.12)', flexShrink: 0 }}/>{color}
                            </div>
                          )}
                          {size && (
                            <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 6, padding: '3px 9px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.black }}>
                              {size}
                            </div>
                          )}
                          <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 6, padding: '3px 9px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.black }}>
                            Qty: {qty}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: T.black }}>KSh {(Number(price) * qty).toLocaleString()}</span>
                          {qty > 1 && <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>(KSh {Number(price).toLocaleString()} × {qty})</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: `2px solid ${T.grey3}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.grey5 }}>
                  <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px' }}>Order Total</span>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: T.black }}>KSh {Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
 
          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onUpdateStatus}
              style={{ flex: 1, borderRadius: 10, border: 'none', padding: '13px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: T.black, color: T.white, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
            >✏ Update Status</button>
            <button
              onClick={onClose}
              style={{ borderRadius: 10, border: `1px solid ${T.grey3}`, padding: '13px 20px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, background: T.grey5, color: T.grey1, cursor: 'pointer' }}
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}