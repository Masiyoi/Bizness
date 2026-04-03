import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  category?: string;
  quantity: number;
}

interface Order {
  id: number;
  created_at: string;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_status: string;
  total_amount: string;
  delivery_fee: string;
  delivery_zone: string;
  mpesa_receipt?: string;
  phone?: string;
  items: OrderItem[];
}

// ─── Luku Prime Design Tokens ──────────────────────────────────────────────
const T = {
  navy:      '#0D1B3E',
  navyMid:   '#152348',
  navyLight: '#1E2F5A',
  gold:      '#C8A951',
  goldLight: '#DEC06A',
  goldPale:  '#F0D98A',
  cream:     '#F9F5EC',
  creamMid:  '#F0EAD8',
  creamDeep: '#E4D9C0',
  white:     '#FFFFFF',
  text:      '#0D1B3E',
  muted:     '#7A7A8A',
};

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; border: string; icon: string; step: number }> = {
  pending:    { label: 'Pending',    color: '#8A6A20', bg: 'rgba(200,169,81,0.1)',  border: 'rgba(200,169,81,0.3)',  icon: '⏳', step: 0 },
  processing: { label: 'Processing', color: T.navy,    bg: 'rgba(13,27,62,0.07)',   border: 'rgba(13,27,62,0.15)',   icon: '🔄', step: 1 },
  confirmed:  { label: 'Confirmed',  color: '#2D6A9F', bg: 'rgba(45,106,159,0.08)', border: 'rgba(45,106,159,0.25)', icon: '✅', step: 2 },
  shipped:    { label: 'Shipped',    color: '#5A3E8A', bg: 'rgba(90,62,138,0.08)',  border: 'rgba(90,62,138,0.25)', icon: '🚚', step: 3 },
  delivered:  { label: 'Delivered',  color: '#4A7A4A', bg: 'rgba(74,122,74,0.1)',   border: 'rgba(74,122,74,0.25)', icon: '🎉', step: 4 },
  cancelled:  { label: 'Cancelled',  color: '#C0392B', bg: '#FDF0EE',              border: '#F5C6C0',              icon: '✕',  step: -1 },
};

const DELIVERY_ZONE_LABELS: Record<string, string> = {
  pickup:   'Shop Pickup',
  cbd:      'Nairobi CBD',
  environs: 'Nairobi Environs',
  county:   'Other County',
};

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders', authHeaders());
      const sorted = [...res.data].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sorted);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else setError('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) =>
    setExpandedOrder(prev => prev === id ? null : id);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      background: T.cream, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 40 }}>📦</div>
      <p style={{ fontFamily: "'Jost',sans-serif", color: T.muted, letterSpacing: '1px', fontSize: 13 }}>
        Loading your orders…
      </p>
    </div>
  );

  return (
    <div style={{
      fontFamily: "'Playfair Display','Georgia',serif",
      background: T.cream, minHeight: '100vh',
      color: T.text, overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.cream}; }
        .jost { font-family: 'Jost', sans-serif; }
        a { text-decoration: none; color: inherit; }

        /* ── Topbar marquee ── */
        .topbar-marquee { display: flex; gap: 64px; animation: marquee 32s linear infinite; white-space: nowrap; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ── Back btn ── */
        .back-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase; color: ${T.gold};
          padding: 8px 0; display: flex; align-items: center; gap: 8px;
          transition: opacity 0.2s;
          /* Tap-friendly hit area */
          min-height: 44px;
        }
        .back-btn:hover { opacity: 0.75; }

        /* ── Ornament ── */
        .ornament { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
        .ornament-line { flex: 0 0 32px; height: 1px; background: ${T.gold}; }
        .ornament-diamond { width: 5px; height: 5px; background: ${T.gold}; transform: rotate(45deg); flex-shrink: 0; }

        /* ── Order card ── */
        .order-card {
          background: #fff; border: 1px solid ${T.creamDeep};
          border-radius: 18px; overflow: hidden;
          transition: all 0.25s; margin-bottom: 16px;
        }
        .order-card:hover { border-color: ${T.gold}; box-shadow: 0 12px 36px rgba(13,27,62,0.1); }

        /* ── Order header ── */
        .order-header {
          padding: clamp(14px, 4vw, 20px) clamp(14px, 4vw, 24px);
          cursor: pointer; display: flex; align-items: center; gap: 12px;
          transition: background 0.15s;
          /* Ensure tap target comfort */
          min-height: 72px;
        }
        .order-header:hover { background: rgba(200,169,81,0.03); }
        /* Active state for touch */
        .order-header:active { background: rgba(200,169,81,0.07); }

        /* ── Item row ── */
        .item-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid ${T.creamDeep};
        }
        .item-row:last-child { border-bottom: none; }

        /* ── CTA buttons ── */
        .cta-gold {
          font-family: 'Jost', sans-serif; font-weight: 700;
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          border: none; border-radius: 8px;
          padding: clamp(12px, 3vw, 14px) clamp(16px, 4vw, 28px);
          cursor: pointer; transition: all 0.25s;
          background: ${T.gold}; color: ${T.navy};
          min-height: 44px; /* tap-friendly */
          flex: 1;
        }
        .cta-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,169,81,0.35); }
        .cta-outline {
          font-family: 'Jost', sans-serif; font-weight: 600;
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          border: 1px solid ${T.creamDeep}; border-radius: 8px;
          padding: clamp(12px, 3vw, 12px) clamp(16px, 4vw, 24px);
          cursor: pointer; transition: all 0.2s;
          background: #fff; color: ${T.navy};
          min-height: 44px; /* tap-friendly */
          flex: 1;
        }
        .cta-outline:hover { border-color: ${T.gold}; background: ${T.cream}; }

        /* ── Skeleton ── */
        .skel {
          background: linear-gradient(90deg, ${T.creamMid} 25%, ${T.cream} 50%, ${T.creamMid} 75%);
          background-size: 200% 100%; animation: sk 1.4s infinite; border-radius: 6px;
        }
        @keyframes sk { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* ── Fade in ── */
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Expand arrow ── */
        .expand-arrow { transition: transform 0.25s ease; display: inline-block; font-size: 11px; color: ${T.muted}; }
        .expand-arrow.open { transform: rotate(180deg); }

        /* ── Responsive: hide thumbnails on very small screens ── */
        @media (max-width: 380px) {
          .order-thumbnails { display: none !important; }
        }

        /* ── Responsive: progress track labels ── */
        @media (max-width: 600px) {
          .track-label { display: none !important; }
          .track-circle { width: 24px !important; height: 24px !important; }
        }

        /* ── Responsive: summary grid ── */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 560px) {
          .summary-grid { grid-template-columns: 1fr; }
        }

        /* ── Responsive: actions row ── */
        .actions-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ── Status pill wraps on small screens ── */
        .order-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 5px;
        }
      `}</style>

      {/* ── ANNOUNCEMENT TOPBAR ── */}
      <div style={{
        background: T.navy, height: 34, overflow: 'hidden',
        display: 'flex', alignItems: 'center',
        borderBottom: `1px solid rgba(200,169,81,0.2)`,
      }}>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="topbar-marquee">
            {[...Array(2)].map((_, r) =>
              ['✦ NAIROBI CBD DELIVERY — KSH 100', '✦ NAIROBI ENVIRONS — KSH 200', '✦ OTHER COUNTIES — KSH 300', '✦ FREE PICKUP FROM OUR SHOP', '✦ SECURE M-PESA CHECKOUT', '✦ 30-DAY RETURNS'].map((t, i) => (
                <span key={`${r}-${i}`} className="jost" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: 'rgba(200,169,81,0.85)' }}>{t}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: T.navy,
        padding: '0 clamp(16px, 5%, 5%)',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 4px 32px rgba(13,27,62,0.35)`,
        borderBottom: `1px solid rgba(200,169,81,0.25)`,
      }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← <span>Shop</span>
        </button>

        {/* Centre title */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div className="jost" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase', marginBottom: 2 }}>My</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, color: T.white, letterSpacing: '0.5px' }}>Orders</div>
        </div>

        {/* Order count — hidden on smallest screens via inline responsive */}
        <div className="jost" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', display: orders.length > 0 ? undefined : 'none' }}>
          <span style={{ display: 'none' as any /* overridden by media */ }}>
            {orders.length > 0 && `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </span>
          {/* Shown on wider screens only */}
          <span className="jost" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {orders.length > 0 ? `${orders.length}` : ''}
          </span>
        </div>
      </nav>

      {/* ── PAGE BODY ── */}
      <div style={{
        padding: `clamp(24px, 5vw, 40px) clamp(14px, 5%, 5%) clamp(60px, 10vw, 80px)`,
        maxWidth: 860, margin: '0 auto',
      }}>

        {/* Error */}
        {error && (
          <div className="jost" style={{
            background: '#FDF0EE', border: '1px solid #F5C6C0',
            borderRadius: 10, padding: '12px 18px',
            color: '#C0392B', fontSize: 13, marginBottom: 24,
          }}>
            {error}
          </div>
        )}

        {/* ── Page heading ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="ornament">
            <div className="ornament-line" />
            <div className="ornament-diamond" />
            <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>History</span>
            <div className="ornament-diamond" />
            <div className="ornament-line" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(22px, 5vw, 30px)', color: T.navy }}>
            Your Orders
          </h1>
          {orders.length > 0 && (
            <p className="jost" style={{ fontSize: 13, color: T.muted, marginTop: 6, fontWeight: 300 }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} · tap any order to see details
            </p>
          )}
        </div>

        {/* ── EMPTY STATE ── */}
        {orders.length === 0 && !loading && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', background: T.creamMid,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, margin: '0 auto 24px', border: `1px solid ${T.creamDeep}`,
            }}>📦</div>
            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" />
              <div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Empty</span>
              <div className="ornament-diamond" />
              <div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 10 }}>
              No orders yet
            </h2>
            <p className="jost" style={{ fontSize: 14, color: T.muted, marginBottom: 32, lineHeight: 1.7, fontWeight: 300 }}>
              You haven't placed any orders yet.<br />Explore our premium collection.
            </p>
            <button className="cta-gold" style={{ flex: 'none', width: 'auto' }} onClick={() => navigate('/')}>
              Shop Now →
            </button>
          </div>
        )}

        {/* ── ORDER CARDS ── */}
        {orders.map((order, idx) => {
          const status   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const isOpen   = expandedOrder === order.id;
          const subtotal = Number(order.total_amount) - Number(order.delivery_fee ?? 0);
          const zoneLabel = DELIVERY_ZONE_LABELS[order.delivery_zone] ?? order.delivery_zone ?? '—';
          const isCancelled = order.status === 'cancelled';

          const TRACKING_STEPS = [
            { icon: '✅', label: 'Order Placed'      },
            { icon: '💳', label: 'Payment Confirmed' },
            { icon: '🔄', label: 'Processing'        },
            { icon: '📦', label: 'Packed'            },
            { icon: '🚚', label: 'Shipped'           },
            { icon: '🛵', label: 'Out for Delivery'  },
            { icon: '🎉', label: 'Delivered'         },
          ];
          const trackingIdx = TRACKING_STEPS.findIndex(s => s.label === order.tracking_status);
          const currentTrackIdx = trackingIdx !== -1 ? trackingIdx :
            order.status === 'pending'    ? 0 :
            order.status === 'confirmed'  ? 1 :
            order.status === 'processing' ? 2 :
            order.status === 'shipped'    ? 4 :
            order.status === 'delivered'  ? 6 : 0;

          const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

          return (
            <div key={order.id} className="order-card fade-in" style={{ animationDelay: `${idx * 0.06}s` }}>

              {/* ── ORDER HEADER ── */}
              <div className="order-header" onClick={() => toggleExpand(order.id)}>

                {/* Order number + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="order-title-row">
                    <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(14px, 3.5vw, 16px)', color: T.navy }}>
                      Order #{order.id}
                    </span>
                    {/* Status pill */}
                    <span className="jost" style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                      padding: '3px 10px', borderRadius: 20,
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.border}`,
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <div className="jost" style={{ fontSize: 11, color: T.muted, letterSpacing: '0.3px' }}>
                    {formatDate(order.created_at)} · {formatTime(order.created_at)}
                  </div>
                  {order.tracking_status && (
                    <div className="jost" style={{ fontSize: 11, color: T.gold, fontWeight: 600, marginTop: 3, letterSpacing: '0.3px' }}>
                      🚦 {order.tracking_status}
                    </div>
                  )}
                </div>

                {/* Item thumbnails — hidden on very small screens via CSS */}
                <div className="order-thumbnails" style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} style={{
                      width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                      background: T.creamMid, border: `1px solid ${T.creamDeep}`, flexShrink: 0,
                    }}>
                      <img src={item.image_url} alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/${T.creamMid.replace('#', '')}/${T.navy.replace('#', '')}?text=📦`; }}
                      />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, background: T.creamMid,
                      border: `1px solid ${T.creamDeep}`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span className="jost" style={{ fontSize: 10, fontWeight: 700, color: T.navy }}>+{order.items.length - 3}</span>
                    </div>
                  )}
                </div>

                {/* Total + expand */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
                  <div className="jost" style={{ fontWeight: 800, fontSize: 'clamp(14px, 3.5vw, 17px)', color: T.navy, letterSpacing: '-0.3px' }}>
                    KSh {Number(order.total_amount).toLocaleString()}
                  </div>
                  <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                    {totalQty} item{totalQty !== 1 ? 's' : ''}
                  </div>
                  <div className={`expand-arrow ${isOpen ? 'open' : ''}`} style={{ marginTop: 4 }}>▼</div>
                </div>
              </div>

              {/* ── EXPANDED DETAIL ── */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${T.creamDeep}` }}>

                  {/* ── ORDER PROGRESS TRACK ── */}
                  {!isCancelled && (
                    <div style={{ padding: 'clamp(16px, 4vw, 20px) clamp(14px, 4vw, 24px) clamp(18px, 4vw, 24px)', borderTop: `1px solid ${T.creamDeep}` }}>

                      {/* Current step callout */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                        background: T.cream, borderRadius: 10, padding: '10px 14px',
                        border: `1px solid ${T.creamDeep}`,
                      }}>
                        <span style={{ fontSize: 18 }}>{TRACKING_STEPS[currentTrackIdx]?.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="jost" style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 2 }}>Current Status</div>
                          <div className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{order.tracking_status || TRACKING_STEPS[currentTrackIdx]?.label}</div>
                        </div>
                        {/* Step counter */}
                        <div className="jost" style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>
                          Step {currentTrackIdx + 1}/{TRACKING_STEPS.length}
                        </div>
                        {order.status === 'delivered' && (
                          <div className="jost" style={{ fontSize: 11, fontWeight: 700, color: '#4A7A4A', background: '#EEF3EE', border: '1px solid #C8DFC8', borderRadius: 20, padding: '3px 12px', flexShrink: 0 }}>
                            ✓ Complete
                          </div>
                        )}
                      </div>

                      {/* 7-step progress bar — labels hidden on mobile via CSS */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                        {TRACKING_STEPS.map((s, i) => {
                          const isPast    = i < currentTrackIdx;
                          const isCurrent = i === currentTrackIdx;

                          return (
                            <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                              {/* Left connector */}
                              {i > 0 && (
                                <div style={{
                                  position: 'absolute', left: 0, top: 12, width: '50%', height: 2,
                                  background: isPast || isCurrent ? T.gold : T.creamDeep,
                                  transition: 'background 0.4s',
                                }} />
                              )}
                              {/* Right connector */}
                              {i < TRACKING_STEPS.length - 1 && (
                                <div style={{
                                  position: 'absolute', right: 0, top: 12, width: '50%', height: 2,
                                  background: isPast ? T.gold : T.creamDeep,
                                  transition: 'background 0.4s',
                                }} />
                              )}
                              {/* Circle */}
                              <div className="track-circle" style={{
                                width: 26, height: 26, borderRadius: '50%', zIndex: 1,
                                background: isPast ? T.gold : isCurrent ? T.navy : '#fff',
                                border: isCurrent ? `2px solid ${T.gold}` : isPast ? `2px solid ${T.gold}` : `2px solid ${T.creamDeep}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: isPast ? 10 : isCurrent ? 12 : 9,
                                boxShadow: isCurrent ? `0 0 0 4px rgba(200,169,81,0.2)` : 'none',
                                transition: 'all 0.4s', flexShrink: 0,
                              }}>
                                {isPast
                                  ? <span style={{ color: T.navy }}>✓</span>
                                  : isCurrent
                                    ? <span>{s.icon}</span>
                                    : <span style={{ color: T.muted, fontFamily: "'Jost',sans-serif", fontWeight: 700 }}>{i + 1}</span>
                                }
                              </div>
                              {/* Label — hidden on mobile via CSS class */}
                              <div className="jost track-label" style={{
                                fontSize: 9, fontWeight: isCurrent ? 700 : 500,
                                color: isCurrent ? T.navy : isPast ? T.gold : T.muted,
                                marginTop: 6, letterSpacing: '0.3px', textAlign: 'center', lineHeight: 1.3,
                                opacity: isPast || isCurrent || i === currentTrackIdx + 1 ? 1 : 0.45,
                              }}>
                                {s.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── CANCELLED BANNER ── */}
                  {isCancelled && (
                    <div style={{ padding: '14px clamp(14px, 4vw, 24px)', background: '#FDF0EE', borderBottom: `1px solid #F5C6C0` }}>
                      <p className="jost" style={{ fontSize: 13, color: '#C0392B', fontWeight: 600 }}>
                        ✕ This order was cancelled.
                      </p>
                    </div>
                  )}

                  {/* ── ITEMS LIST ── */}
                  <div style={{ padding: `clamp(16px, 4vw, 20px) clamp(14px, 4vw, 24px)` }}>
                    <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>
                      Items Ordered
                    </div>
                    <div>
                      {order.items.map(item => (
                        <div key={item.id} className="item-row">
                          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: T.creamMid }}>
                            <img src={item.image_url} alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/${T.creamMid.replace('#', '')}/${T.navy.replace('#', '')}?text=📦`; }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.category && (
                              <div className="jost" style={{
                                display: 'inline-block', background: T.navy, color: T.gold,
                                borderRadius: 3, padding: '1px 7px', fontSize: 9, fontWeight: 700,
                                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4,
                              }}>
                                {item.category}
                              </div>
                            )}
                            <div style={{
                              fontFamily: "'Playfair Display',serif", fontWeight: 600,
                              fontSize: 'clamp(12px, 3vw, 14px)', color: T.navy,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {item.name}
                            </div>
                            <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                              Qty: {item.quantity} · KSh {Number(item.price).toLocaleString()} each
                            </div>
                          </div>
                          <div className="jost" style={{ fontWeight: 700, fontSize: 'clamp(12px, 3.5vw, 15px)', color: T.gold, flexShrink: 0 }}>
                            KSh {(Number(item.price) * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── ORDER SUMMARY ── */}
                  <div style={{ padding: `0 clamp(14px, 4vw, 24px) clamp(16px, 4vw, 24px)` }}>
                    <div className="summary-grid">

                      {/* Cost breakdown */}
                      <div style={{ background: T.cream, border: `1px solid ${T.creamDeep}`, borderRadius: 14, padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 18px)' }}>
                        <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>
                          Cost Breakdown
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span className="jost" style={{ fontSize: 12, color: T.muted }}>Subtotal</span>
                          <span className="jost" style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                          <span className="jost" style={{ fontSize: 12, color: T.muted }}>
                            Delivery · <span style={{ color: T.gold }}>{zoneLabel}</span>
                          </span>
                          <span className="jost" style={{ fontSize: 12, fontWeight: 600, color: Number(order.delivery_fee) === 0 ? '#4A7A4A' : T.navy, flexShrink: 0 }}>
                            {Number(order.delivery_fee) === 0 ? 'FREE' : `KSh ${Number(order.delivery_fee).toLocaleString()}`}
                          </span>
                        </div>
                        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
                          <span className="jost" style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>KSh {Number(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Payment & delivery info */}
                      <div style={{ background: T.navy, border: `1px solid rgba(200,169,81,0.2)`, borderRadius: 14, padding: 'clamp(12px, 3vw, 16px) clamp(12px, 3vw, 18px)' }}>
                        <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(200,169,81,0.7)', marginBottom: 12 }}>
                          Payment & Delivery
                        </div>
                        {order.mpesa_receipt && (
                          <div style={{ marginBottom: 10 }}>
                            <div className="jost" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>M-Pesa Receipt</div>
                            <div className="jost" style={{ fontWeight: 800, fontSize: 'clamp(12px, 3.5vw, 15px)', color: T.gold, letterSpacing: '2px' }}>{order.mpesa_receipt}</div>
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

                  {/* ── ACTIONS ── */}
                  <div style={{ padding: `0 clamp(14px, 4vw, 24px) clamp(16px, 4vw, 24px)` }}>
                    <div className="actions-row">
                      <button className="cta-gold" onClick={() => navigate('/')}>
                        🛍️ Shop Again
                      </button>
                      <button className="cta-outline" onClick={() => navigate('/cart')}>
                        View Cart
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: T.navy, borderTop: `1px solid rgba(200,169,81,0.2)` }}>
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent 0%,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent 100%)` }} />
        <div style={{
          padding: `20px clamp(16px, 5%, 5%)`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, color: T.white, letterSpacing: '0.5px' }}>
            Luku <span style={{ color: T.gold }}>Prime</span>
          </div>
          <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.3px' }}>
            © 2025 Luku Prime · All rights reserved
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Help'].map(l => (
              <span key={l} className="jost" style={{
                cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 12,
                letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.2s',
                minHeight: 44, display: 'flex', alignItems: 'center',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = T.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}