import { useState } from 'react';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number | string;
  image_url: string;
  category?: string;
  quantity: number;
}

interface Order {
  id: number;
  user_order_number: number;
  created_at: string;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_status: string;
  total_amount: number | string;
  delivery_fee: number | string;
  delivery_zone: string;
  mpesa_receipt?: string;
  phone?: string;
  items: OrderItem[];
}

type ReviewMap = Record<number, boolean>;

const T = {
  navy: '#0D1B3E', navyMid: '#152348', navyLight: '#1E2F5A',
  gold: '#C8A951', goldLight: '#DEC06A', goldPale: '#F0D98A',
  cream: '#F9F5EC', creamMid: '#F0EAD8', creamDeep: '#E4D9C0',
  white: '#FFFFFF', text: '#0D1B3E', muted: '#7A7A8A',
};

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; border: string; icon: string; step: number }> = {
  pending: { label: 'Pending', color: '#8A6A20', bg: 'rgba(200,169,81,0.1)', border: 'rgba(200,169,81,0.3)', icon: '⏳', step: 0 },
  processing: { label: 'Processing', color: T.navy, bg: 'rgba(13,27,62,0.07)', border: 'rgba(13,27,62,0.15)', icon: '🔄', step: 1 },
  confirmed: { label: 'Confirmed', color: '#2D6A9F', bg: 'rgba(45,106,159,0.08)', border: 'rgba(45,106,159,0.25)', icon: '✅', step: 2 },
  shipped: { label: 'Shipped', color: '#5A3E8A', bg: 'rgba(90,62,138,0.08)', border: 'rgba(90,62,138,0.25)', icon: '🚚', step: 3 },
  delivered: { label: 'Delivered', color: '#4A7A4A', bg: 'rgba(74,122,74,0.1)', border: 'rgba(74,122,74,0.25)', icon: '🎉', step: 4 },
  cancelled: { label: 'Cancelled', color: '#C0392B', bg: '#FDF0EE', border: '#F5C6C0', icon: '✕', step: -1 },
};

const DELIVERY_ZONE_LABELS: Record<string, string> = {
  pickup: 'Shop Pickup', cbd: 'Nairobi CBD', environs: 'Nairobi Environs', county: 'Other County',
};

const TRACKING_STEPS = [
  { icon: '✅', label: 'Order Placed' },
  { icon: '💳', label: 'Payment Confirmed' },
  { icon: '🔄', label: 'Processing' },
  { icon: '📦', label: 'Packed' },
  { icon: '🚚', label: 'Shipped' },
  { icon: '🛵', label: 'Out for Delivery' },
  { icon: '🎉', label: 'Delivered' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0' : num.toLocaleString();
};

interface OrderCardProps {
  order: Order;
  index: number;
  reviewedMap: ReviewMap;
  onReviewSubmit: (productId: number, rating: number, comment: string) => Promise<void>;
  onReviewModalOpen: (item: OrderItem) => void;
}

export default function OrderCard({ order, index, reviewedMap, onReviewSubmit, onReviewModalOpen }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const isCancelled = order.status === 'cancelled';
  const eligible = ['confirmed', 'shipped', 'delivered'].includes(order.status);

  const subtotal = (typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount) -
                   (typeof order.delivery_fee === 'string' ? parseFloat(order.delivery_fee) : order.delivery_fee);
  const zoneLabel = DELIVERY_ZONE_LABELS[order.delivery_zone] ?? order.delivery_zone ?? '—';
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate current tracking step based on status and tracking_status
  const getCurrentTrackIdx = (): number => {
    if (order.tracking_status) {
      const stepIndex = TRACKING_STEPS.findIndex(step => step.label === order.tracking_status);
      if (stepIndex !== -1) return stepIndex;
    }

    // Fallback based on order status
    switch (order.status) {
      case 'pending': return 0;
      case 'processing': return 2;
      case 'confirmed': return 1;
      case 'shipped': return 4;
      case 'delivered': return 6;
      default: return 0;
    }
  };

  const currentTrackIdx = getCurrentTrackIdx();

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <div className="order-card fade-in" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Order header */}
      <div className="order-header" onClick={toggleExpand}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="order-title-row">
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(14px,3.5vw,16px)', color: T.navy }}>
              Order #{order.user_order_number}
            </span>
            <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', padding: '3px 10px', borderRadius: 20, background: status.bg, color: status.color, border: `1px solid ${status.border}`, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {status.icon} {status.label}
            </span>
          </div>
          <div className="jost" style={{ fontSize: 11, color: T.muted }}>{formatDate(order.created_at)} · {formatTime(order.created_at)}</div>
          {order.tracking_status && (
            <div className="jost" style={{ fontSize: 11, color: T.gold, fontWeight: 600, marginTop: 3 }}>🚦 {order.tracking_status}</div>
          )}
        </div>
        <div className="order-thumbnails" style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: T.creamMid, border: `1px solid ${T.creamDeep}`, flexShrink: 0 }}>
              <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/F0EAD8/0D1B3E?text=LP`; }} />
            </div>
          ))}
          {order.items.length > 3 && (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: T.creamMid, border: `1px solid ${T.creamDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, color: T.navy }}>+{order.items.length - 3}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
          <div className="jost" style={{ fontWeight: 800, fontSize: 'clamp(14px,3.5vw,17px)', color: T.navy }}>
            KSh {formatCurrency(order.total_amount)}
          </div>
          <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{totalQty} item{totalQty !== 1 ? 's' : ''}</div>
          <div className={`expand-arrow ${expanded ? 'open' : ''}`} style={{ marginTop: 4 }}>▼</div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${T.creamDeep}` }}>
          {/* Progress track */}
          {!isCancelled && (
            <div style={{ padding: 'clamp(16px,4vw,20px) clamp(14px,4vw,24px)', borderBottom: `1px solid ${T.creamDeep}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, background: T.cream, borderRadius: 10, padding: '10px 14px', border: `1px solid ${T.creamDeep}` }}>
                <span style={{ fontSize: 18 }}>{TRACKING_STEPS[currentTrackIdx]?.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="jost" style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>Current Status</div>
                  <div className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{order.tracking_status || TRACKING_STEPS[currentTrackIdx]?.label}</div>
                </div>
                <div className="jost" style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>Step {currentTrackIdx + 1}/{TRACKING_STEPS.length}</div>
                {order.status === 'delivered' && (
                  <div className="jost" style={{ fontSize: 11, fontWeight: 700, color: '#4A7A4A', background: '#EEF3EE', border: '1px solid #C8DFC8', borderRadius: 20, padding: '3px 12px', flexShrink: 0 }}>✓ Complete</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                {TRACKING_STEPS.map((step, i) => {
                  const isPast = i < currentTrackIdx;
                  const isCurrent = i === currentTrackIdx;
                  return (
                    <div key={step.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {i > 0 && <div style={{ position: 'absolute', left: 0, top: 12, width: '50%', height: 2, background: isPast || isCurrent ? T.gold : T.creamDeep, transition: 'background 0.4s' }} />}
                      {i < TRACKING_STEPS.length - 1 && <div style={{ position: 'absolute', right: 0, top: 12, width: '50%', height: 2, background: isPast ? T.gold : T.creamDeep, transition: 'background 0.4s' }} />}
                      <div className="track-circle" style={{ width: 26, height: 26, borderRadius: '50%', zIndex: 1, background: isPast ? T.gold : isCurrent ? T.navy : '#fff', border: isCurrent || isPast ? `2px solid ${T.gold}` : `2px solid ${T.creamDeep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isPast ? 10 : isCurrent ? 12 : 9, boxShadow: isCurrent ? `0 0 0 4px rgba(200,169,81,0.2)` : 'none', transition: 'all 0.4s', flexShrink: 0 }}>
                        {isPast ? <span style={{ color: T.navy }}>✓</span> : isCurrent ? <span>{step.icon}</span> : <span style={{ color: T.muted, fontFamily: "'Jost',sans-serif", fontWeight: 700 }}>{i + 1}</span>}
                      </div>
                      <div className="jost track-label" style={{ fontSize: 9, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? T.navy : isPast ? T.gold : T.muted, marginTop: 6, letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.3, opacity: isPast || isCurrent || i === currentTrackIdx + 1 ? 1 : 0.45 }}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div style={{ padding: '14px clamp(14px,4vw,24px)', background: '#FDF0EE', borderBottom: `1px solid #F5C6C0` }}>
              <p className="jost" style={{ fontSize: 13, color: '#C0392B', fontWeight: 600 }}>✕ This order was cancelled.</p>
            </div>
          )}

          {/* Items list — with review buttons */}
          <div style={{ padding: `clamp(16px,4vw,20px) clamp(14px,4vw,24px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.muted }}>Items Ordered</div>
              {eligible && (
                <div className="jost" style={{ fontSize: 10, color: T.gold, fontWeight: 600 }}>
                  ★ Tap a product to leave a review
                </div>
              )}
            </div>
            <div>
              {order.items.map(item => {
                const pid = item.product_id;
                const reviewed = reviewedMap[pid] === true;
                return (
                  <div key={item.id} className="item-row">
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: T.creamMid }}>
                      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/F0EAD8/0D1B3E?text=LP`; }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {item.category && (
                        <div className="jost" style={{ display: 'inline-block', background: T.navy, color: T.gold, borderRadius: 3, padding: '1px 7px', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                          {item.category}
                        </div>
                      )}
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 'clamp(12px,3vw,14px)', color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                        Qty: {item.quantity} · KSh {formatCurrency(item.price)} each
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div className="jost" style={{ fontWeight: 700, fontSize: 'clamp(12px,3.5vw,15px)', color: T.gold }}>
                        KSh {formatCurrency((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity)}
                      </div>
                      {/* Review button — only for eligible orders */}
                      {eligible && (
                        reviewed ? (
                          <span className="reviewed-badge">✓ Reviewed</span>
                        ) : (
                          <button className="review-btn" onClick={() => onReviewModalOpen(item)}>
                            ★ Review
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: `0 clamp(14px,4vw,24px) clamp(16px,4vw,24px)` }}>
            <div className="summary-grid">
              <div style={{ background: T.cream, border: `1px solid ${T.creamDeep}`, borderRadius: 14, padding: 'clamp(12px,3vw,16px) clamp(12px,3vw,18px)' }}>
                <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>Cost Breakdown</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="jost" style={{ fontSize: 12, color: T.muted }}>Subtotal</span>
                  <span className="jost" style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>KSh {formatCurrency(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                  <span className="jost" style={{ fontSize: 12, color: T.muted }}>Delivery · <span style={{ color: T.gold }}>{zoneLabel}</span></span>
                  <span className="jost" style={{ fontSize: 12, fontWeight: 600, color: (typeof order.delivery_fee === 'string' ? parseFloat(order.delivery_fee) : order.delivery_fee) === 0 ? '#4A7A4A' : T.navy, flexShrink: 0 }}>
                    {(typeof order.delivery_fee === 'string' ? parseFloat(order.delivery_fee) : order.delivery_fee) === 0 ? 'FREE' : `KSh ${formatCurrency(order.delivery_fee)}`}
                  </span>
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
                  <span className="jost" style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>KSh {formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              <div style={{ background: T.navy, border: `1px solid rgba(200,169,81,0.2)`, borderRadius: 14, padding: 'clamp(12px,3vw,16px) clamp(12px,3vw,18px)' }}>
                <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(200,169,81,0.7)', marginBottom: 12 }}>Payment & Delivery</div>
                {order.mpesa_receipt && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="jost" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>M-Pesa Receipt</div>
                    <div className="jost" style={{ fontWeight: 800, fontSize: 'clamp(12px,3.5vw,15px)', color: T.gold, letterSpacing: '2px' }}>{order.mpesa_receipt}</div>
                  </div>
                )}
                {order.phone && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="jost" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Phone</div>
                    <div className="jost" style={{ fontWeight: 600, fontSize: 13, color: T.white }}>{order.phone}</div>
                  </div>
                )}
                <div>
                  <div className="jost" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Delivery</div>
                  <div className="jost" style={{ fontWeight: 600, fontSize: 13, color: T.goldLight }}>{zoneLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: `0 clamp(14px,4vw,24px) clamp(16px,4vw,24px)` }}>
            <div className="actions-row">
              <button className="cta-gold" onClick={() => window.location.href = '/'} style={{ flex: 1 }}>🛍️ Shop Again</button>
              <button className="cta-outline" onClick={() => window.location.href = '/reviews'} style={{ flex: 1 }}>⭐ My Reviews</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}