// src/pages/Orders.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

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
  user_order_number: number;
  created_at: string;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_status: string;
  total_amount: string;
  delivery_fee?: string;
  delivery_zone?: string;
  mpesa_receipt?: string;
  phone?: string;
  items: OrderItem[];
}

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A', goldPale:'#F0D98A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0',
  white:'#FFFFFF', text:'#0D1B3E', muted:'#7A7A8A',
};

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; border: string; icon: string; step: number }> = {
  pending:    { label:'Pending',    color:'#8A6A20', bg:'rgba(200,169,81,0.1)',  border:'rgba(200,169,81,0.3)',  icon:'⏳', step:0 },
  processing: { label:'Processing', color:T.navy,    bg:'rgba(13,27,62,0.07)',   border:'rgba(13,27,62,0.15)',   icon:'🔄', step:1 },
  confirmed:  { label:'Confirmed',  color:'#2D6A9F', bg:'rgba(45,106,159,0.08)', border:'rgba(45,106,159,0.25)', icon:'✅', step:2 },
  shipped:    { label:'Shipped',    color:'#5A3E8A', bg:'rgba(90,62,138,0.08)',  border:'rgba(90,62,138,0.25)', icon:'🚚', step:3 },
  delivered:  { label:'Delivered',  color:'#4A7A4A', bg:'rgba(74,122,74,0.1)',   border:'rgba(74,122,74,0.25)', icon:'🎉', step:4 },
  cancelled:  { label:'Cancelled',  color:'#C0392B', bg:'#FDF0EE',              border:'#F5C6C0',              icon:'✕',  step:-1 },
};

const DELIVERY_ZONE_LABELS: Record<string, string> = {
  pickup:'Shop Pickup', cbd:'Nairobi CBD', environs:'Nairobi Environs', county:'Other County',
};

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' });
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' });

type ReviewMap = Record<number, boolean>;

// ── Review Modal ───────────────────────────────────────────────────────────────
function ReviewModal({
  item, onClose, onSubmit,
}: {
  item: OrderItem;
  onClose: () => void;
  onSubmit: (productId: number, rating: number, comment: string) => Promise<void>;
}) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [hover,   setHover]   = useState(0);

  const handleSubmit = async () => {
    if (!rating) { setError('Please choose a star rating.'); return; }
    setSaving(true);
    try {
      await onSubmit(item.product_id, rating, comment);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not submit review.');
    } finally { setSaving(false); }
  };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.72)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:T.white, borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 32px 80px rgba(13,27,62,0.3)', overflow:'hidden', animation:'modalIn 0.22s ease' }}>

        {/* Header */}
        <div style={{ background:T.navy, padding:'18px 22px', display:'flex', alignItems:'center', gap:12 }}>
          <img
            src={item.image_url} alt={item.name}
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/152348/C8A951?text=LP`; }}
            style={{ width:52, height:52, objectFit:'cover', borderRadius:8, border:`2px solid rgba(200,169,81,0.3)`, flexShrink:0 }}
          />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:T.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
            {item.category && (
              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:`rgba(200,169,81,0.7)`, letterSpacing:'1.5px', textTransform:'uppercase', marginTop:3 }}>{item.category}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', width:28, height:28, borderRadius:7, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:22 }}>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted, marginBottom:10 }}>Your Rating</div>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3,4,5].map(s => (
                <span
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{ fontSize:30, cursor:'pointer', color:s<=(hover||rating)?T.gold:T.creamDeep, transition:'all 0.15s', transform:s<=(hover||rating)?'scale(1.2)':'scale(1)', display:'inline-block', userSelect:'none' }}
                >★</span>
              ))}
            </div>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.gold, marginTop:6, fontWeight:600, minHeight:18 }}>
              {['','Terrible','Poor','Average','Good','Excellent!'][rating] || ''}
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted, marginBottom:8 }}>
              Comment <span style={{ fontWeight:400 }}>(optional)</span>
            </div>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              maxLength={1000} rows={3}
              placeholder="How was the fit, quality, style?"
              style={{ width:'100%', border:`1.5px solid ${T.creamDeep}`, borderRadius:10, padding:'10px 13px', fontFamily:"'Jost',sans-serif", fontSize:13, color:T.navy, resize:'vertical', outline:'none', background:T.cream, lineHeight:1.6, transition:'border-color 0.2s', boxSizing:'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = T.gold}
              onBlur={e  => e.currentTarget.style.borderColor = T.creamDeep}
            />
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:T.muted, textAlign:'right', marginTop:3 }}>{comment.length}/1000</div>
          </div>

          {error && (
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'#C0392B', background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'8px 12px', marginBottom:14 }}>{error}</div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={onClose}
              style={{ flex:1, background:T.creamMid, color:T.navy, border:'none', borderRadius:10, padding:'11px 0', fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}
            >Cancel</button>
            <button
              onClick={handleSubmit} disabled={saving}
              style={{ flex:2, background:saving?T.creamDeep:T.gold, color:saving?T.muted:T.navy, border:'none', borderRadius:10, padding:'11px 0', fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:saving?'not-allowed':'pointer', transition:'background 0.2s' }}
            >{saving ? 'Submitting…' : '★ Submit Review'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Orders Page ───────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate();

  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null); // stores order.id
  const [reviewedMap,   setReviewedMap]   = useState<ReviewMap>({});
  const [reviewModal,   setReviewModal]   = useState<OrderItem | null>(null);
  const [toast,         setToast]         = useState('');

  const token = localStorage.getItem('token');

  const fetchReviewedStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/reviews/my', authHeaders());
      const reviewed: ReviewMap = {};
      for (const r of res.data) reviewed[Number(r.product_id)] = true;
      setReviewedMap(reviewed);
    } catch { /* non-critical */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders', authHeaders());
      const sorted = [...res.data].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sorted);
      fetchReviewedStatus();
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else setError('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  }, [navigate, fetchReviewedStatus]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, [navigate, fetchOrders, token]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleReviewSubmit = async (productId: number, rating: number, comment: string) => {
    await axios.post('/api/reviews', { product_id: productId, rating, comment }, authHeaders());
    setReviewedMap(prev => ({ ...prev, [Number(productId)]: true }));
    showToast('✓ Review submitted — thank you!');
  };

  const canReview = (status: Order['status']) =>
    ['confirmed', 'shipped', 'delivered'].includes(status);

  // Uses order.id internally — user_order_number is display only
  const toggleExpand = (orderId: number) =>
    setExpandedOrder(prev => prev === orderId ? null : orderId);

  const TRACKING_STEPS = [
    { icon:'✅', label:'Order Placed'       },
    { icon:'💳', label:'Payment Confirmed'  },
    { icon:'🔄', label:'Processing'         },
    { icon:'📦', label:'Packed'             },
    { icon:'🚚', label:'Shipped'            },
    { icon:'🛵', label:'Out for Delivery'   },
    { icon:'🎉', label:'Delivered'          },
  ];

  if (loading) return (
    <div style={{ background:T.cream, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40 }}>📦</div>
      <p style={{ fontFamily:"'Jost',sans-serif", color:T.muted, letterSpacing:'1px', fontSize:13 }}>Loading your orders…</p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Playfair Display','Georgia',serif", background:T.cream, minHeight:'100vh', color:T.text, overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.cream}}
        a{text-decoration:none;color:inherit}
        .topbar-marquee{display:flex;gap:64px;animation:marquee 32s linear infinite;white-space:nowrap}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .back-btn{background:none;border:none;cursor:pointer;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${T.gold};padding:8px 0;display:flex;align-items:center;gap:8px;transition:opacity 0.2s;min-height:44px}
        .back-btn:hover{opacity:0.75}
        .ornament{display:flex;align-items:center;gap:14px;margin-bottom:8px}
        .ornament-line{flex:0 0 32px;height:1px;background:${T.gold}}
        .ornament-diamond{width:5px;height:5px;background:${T.gold};transform:rotate(45deg);flex-shrink:0}
        .order-card{background:#fff;border:1px solid ${T.creamDeep};border-radius:18px;overflow:hidden;transition:all 0.25s;margin-bottom:16px}
        .order-card:hover{border-color:${T.gold};box-shadow:0 12px 36px rgba(13,27,62,0.1)}
        .order-header{padding:clamp(14px,4vw,20px) clamp(14px,4vw,24px);cursor:pointer;display:flex;align-items:center;gap:12px;transition:background 0.15s;min-height:72px}
        .order-header:hover{background:rgba(200,169,81,0.03)}
        .order-header:active{background:rgba(200,169,81,0.07)}
        .item-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${T.creamDeep}}
        .item-row:last-child{border-bottom:none}
        .cta-gold{font-family:'Jost',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;border-radius:8px;padding:clamp(12px,3vw,14px) clamp(16px,4vw,28px);cursor:pointer;transition:all 0.25s;background:${T.gold};color:${T.navy};min-height:44px;flex:1}
        .cta-gold:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(200,169,81,0.35)}
        .cta-outline{font-family:'Jost',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid ${T.creamDeep};border-radius:8px;padding:clamp(12px,3vw,12px) clamp(16px,4vw,24px);cursor:pointer;transition:all 0.2s;background:#fff;color:${T.navy};min-height:44px;flex:1}
        .cta-outline:hover{border-color:${T.gold};background:${T.cream}}
        .fade-in{animation:fadeIn 0.35s ease forwards}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .expand-arrow{transition:transform 0.25s ease;display:inline-block;font-size:11px;color:${T.muted}}
        .expand-arrow.open{transform:rotate(180deg)}
        .order-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
        .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .actions-row{display:flex;gap:10px;flex-wrap:wrap}
        .review-btn{font-family:'Jost',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;transition:all 0.18s;white-space:nowrap;background:${T.gold};color:${T.navy}}
        .review-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(200,169,81,0.35)}
        .reviewed-badge{font-family:'Jost',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:5px 12px;border-radius:6px;background:#EEF3EE;color:#4A7A4A;border:1px solid #C8DFC8;white-space:nowrap}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @media(max-width:380px){.order-thumbnails{display:none!important}}
        @media(max-width:600px){.track-label{display:none!important}.track-circle{width:24px!important;height:24px!important}}
        @media(max-width:560px){.summary-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:T.navy, color:T.goldLight, fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, padding:'12px 24px', borderRadius:50, zIndex:999, letterSpacing:'1px', boxShadow:'0 8px 32px rgba(13,27,62,0.3)', animation:'toastIn 0.3s ease', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          item={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

    <Navbar />

      {/* Body */}
      <div style={{ padding:`clamp(24px,5vw,40px) clamp(14px,5%,5%) clamp(60px,10vw,80px)`, maxWidth:860, margin:'0 auto' }}>

        {error && (
          <div style={{ fontFamily:"'Jost',sans-serif", background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:10, padding:'12px 18px', color:'#C0392B', fontSize:13, marginBottom:24 }}>{error}</div>
        )}

        <div style={{ marginBottom:28 }}>
          <div className="ornament">
            <div className="ornament-line"/><div className="ornament-diamond"/>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>History</span>
            <div className="ornament-diamond"/><div className="ornament-line"/>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(22px,5vw,30px)', color:T.navy }}>Your Orders</h1>
          {orders.length > 0 && (
            <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:T.muted, marginTop:6, fontWeight:300 }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} · tap any order to see details
            </p>
          )}
        </div>

        {/* Empty state */}
        {orders.length === 0 && !loading && (
          <div className="fade-in" style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ width:90, height:90, borderRadius:'50%', background:T.creamMid, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 24px', border:`1px solid ${T.creamDeep}` }}>📦</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:24, color:T.navy, marginBottom:10 }}>No orders yet</h2>
            <p style={{ fontFamily:"'Jost',sans-serif", fontSize:14, color:T.muted, marginBottom:32, lineHeight:1.7, fontWeight:300 }}>
              You haven't placed any orders yet.<br/>Explore our premium collection.
            </p>
            <button className="cta-gold" style={{ flex:'none', width:'auto' }} onClick={() => navigate('/')}>Shop Now →</button>
          </div>
        )}

        {/* Orders list */}
        {orders.map((order, idx) => {
          const status      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const isOpen      = expandedOrder === order.id;          // ← uses order.id
          const isCancelled = order.status === 'cancelled';
          const eligible    = canReview(order.status);
          const subtotal    = Number(order.total_amount) - Number(order.delivery_fee ?? '0');
          const zoneLabel   = DELIVERY_ZONE_LABELS[order.delivery_zone ?? ''] ?? order.delivery_zone ?? '—';
          const totalQty    = order.items.reduce((s, i) => s + i.quantity, 0);

          const trackingIdx     = TRACKING_STEPS.findIndex(s => s.label === order.tracking_status);
          const currentTrackIdx = trackingIdx !== -1 ? trackingIdx :
            order.status === 'pending'    ? 0 :
            order.status === 'confirmed'  ? 1 :
            order.status === 'processing' ? 2 :
            order.status === 'shipped'    ? 4 :
            order.status === 'delivered'  ? 6 : 0;

          return (
            <div
              key={order.id}                                        // ← uses order.id
              className="order-card fade-in"
              style={{ animationDelay:`${idx * 0.06}s` }}
            >

              {/* ── Order header ── */}
              <div className="order-header" onClick={() => toggleExpand(order.id)}>  {/* ← uses order.id */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="order-title-row">
                    {/* Display uses user_order_number */}
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(14px,3.5vw,16px)', color:T.navy }}>
                      Order #{order.user_order_number}
                    </span>
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'1px', padding:'3px 10px', borderRadius:20, background:status.bg, color:status.color, border:`1px solid ${status.border}`, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>{formatDate(order.created_at)} · {formatTime(order.created_at)}</div>
                  {order.tracking_status && (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.gold, fontWeight:600, marginTop:3 }}>🚦 {order.tracking_status}</div>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="order-thumbnails" style={{ display:'flex', gap:5, flexShrink:0 }}>
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:T.creamMid, border:`1px solid ${T.creamDeep}`, flexShrink:0 }}>
                      <img src={item.image_url} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/F0EAD8/0D1B3E?text=LP`; }}/>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div style={{ width:40, height:40, borderRadius:8, background:T.creamMid, border:`1px solid ${T.creamDeep}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, color:T.navy }}>+{order.items.length - 3}</span>
                    </div>
                  )}
                </div>

                {/* Total + expand arrow */}
                <div style={{ textAlign:'right', flexShrink:0, minWidth:72 }}>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:'clamp(14px,3.5vw,17px)', color:T.navy }}>KSh {Number(order.total_amount).toLocaleString()}</div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:3 }}>{totalQty} item{totalQty !== 1 ? 's' : ''}</div>
                  <div className={`expand-arrow ${isOpen ? 'open' : ''}`} style={{ marginTop:4 }}>▼</div>
                </div>
              </div>

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div style={{ borderTop:`1px solid ${T.creamDeep}` }}>

                  {/* Progress tracker */}
                  {!isCancelled && (
                    <div style={{ padding:'clamp(16px,4vw,20px) clamp(14px,4vw,24px)', borderBottom:`1px solid ${T.creamDeep}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, background:T.cream, borderRadius:10, padding:'10px 14px', border:`1px solid ${T.creamDeep}` }}>
                        <span style={{ fontSize:18 }}>{TRACKING_STEPS[currentTrackIdx]?.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, color:T.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:2 }}>Current Status</div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:700, color:T.navy }}>{order.tracking_status || TRACKING_STEPS[currentTrackIdx]?.label}</div>
                        </div>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, flexShrink:0 }}>Step {currentTrackIdx + 1}/{TRACKING_STEPS.length}</div>
                        {order.status === 'delivered' && (
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, color:'#4A7A4A', background:'#EEF3EE', border:'1px solid #C8DFC8', borderRadius:20, padding:'3px 12px', flexShrink:0 }}>✓ Complete</div>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
                        {TRACKING_STEPS.map((s, i) => {
                          const isPast    = i < currentTrackIdx;
                          const isCurrent = i === currentTrackIdx;
                          return (
                            <div key={s.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                              {i > 0 && <div style={{ position:'absolute', left:0, top:12, width:'50%', height:2, background:isPast||isCurrent?T.gold:T.creamDeep, transition:'background 0.4s' }}/>}
                              {i < TRACKING_STEPS.length - 1 && <div style={{ position:'absolute', right:0, top:12, width:'50%', height:2, background:isPast?T.gold:T.creamDeep, transition:'background 0.4s' }}/>}
                              <div
                                className="track-circle"
                                style={{ width:26, height:26, borderRadius:'50%', zIndex:1, background:isPast?T.gold:isCurrent?T.navy:'#fff', border:isCurrent||isPast?`2px solid ${T.gold}`:`2px solid ${T.creamDeep}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isPast?10:isCurrent?12:9, boxShadow:isCurrent?`0 0 0 4px rgba(200,169,81,0.2)`:'none', transition:'all 0.4s', flexShrink:0 }}
                              >
                                {isPast
                                  ? <span style={{ color:T.navy }}>✓</span>
                                  : isCurrent
                                  ? <span>{s.icon}</span>
                                  : <span style={{ color:T.muted, fontFamily:"'Jost',sans-serif", fontWeight:700 }}>{i + 1}</span>
                                }
                              </div>
                              <div
                                className="track-label"
                                style={{ fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:isCurrent?700:500, color:isCurrent?T.navy:isPast?T.gold:T.muted, marginTop:6, letterSpacing:'0.3px', textAlign:'center', lineHeight:1.3, opacity:isPast||isCurrent||i===currentTrackIdx+1?1:0.45 }}
                              >{s.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cancelled banner */}
                  {isCancelled && (
                    <div style={{ padding:'14px clamp(14px,4vw,24px)', background:'#FDF0EE', borderBottom:'1px solid #F5C6C0' }}>
                      <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'#C0392B', fontWeight:600 }}>✕ This order was cancelled.</p>
                    </div>
                  )}

                  {/* Items list */}
                  <div style={{ padding:`clamp(16px,4vw,20px) clamp(14px,4vw,24px)` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted }}>Items Ordered</div>
                      {eligible && (
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:T.gold, fontWeight:600 }}>★ Tap a product to leave a review</div>
                      )}
                    </div>
                    <div>
                      {order.items.map(item => {
                        const pid      = Number(item.product_id);
                        const reviewed = reviewedMap[pid] === true;
                        return (
                          <div key={item.id} className="item-row">
                            <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', flexShrink:0, background:T.creamMid }}>
                              <img src={item.image_url} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/F0EAD8/0D1B3E?text=LP`; }}/>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              {item.category && (
                                <div style={{ display:'inline-block', background:T.navy, color:T.gold, borderRadius:3, padding:'1px 7px', fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:4 }}>{item.category}</div>
                              )}
                              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:'clamp(12px,3vw,14px)', color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:2 }}>Qty: {item.quantity} · KSh {Number(item.price).toLocaleString()} each</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                              <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:700, fontSize:'clamp(12px,3.5vw,15px)', color:T.gold }}>
                                KSh {(Number(item.price) * item.quantity).toLocaleString()}
                              </div>
                              {eligible && (
                                reviewed
                                  ? <span className="reviewed-badge">✓ Reviewed</span>
                                  : <button className="review-btn" onClick={() => setReviewModal(item)}>★ Review</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost summary + Payment */}
                  <div style={{ padding:`0 clamp(14px,4vw,24px) clamp(16px,4vw,24px)` }}>
                    <div className="summary-grid">
                      <div style={{ background:T.cream, border:`1px solid ${T.creamDeep}`, borderRadius:14, padding:'clamp(12px,3vw,16px) clamp(12px,3vw,18px)' }}>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted, marginBottom:12 }}>Cost Breakdown</div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>Subtotal</span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, color:T.navy }}>KSh {subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>Delivery · <span style={{ color:T.gold }}>{zoneLabel}</span></span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, color:Number(order.delivery_fee??'0')===0?'#4A7A4A':T.navy, flexShrink:0 }}>
                            {Number(order.delivery_fee??'0')===0 ? 'FREE' : `KSh ${Number(order.delivery_fee).toLocaleString()}`}
                          </span>
                        </div>
                        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.gold},transparent)`, margin:'10px 0' }}/>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:700, color:T.navy, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:800, color:T.navy }}>KSh {Number(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ background:T.navy, border:`1px solid rgba(200,169,81,0.2)`, borderRadius:14, padding:'clamp(12px,3vw,16px) clamp(12px,3vw,18px)' }}>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'rgba(200,169,81,0.7)', marginBottom:12 }}>Payment & Delivery</div>
                        {order.mpesa_receipt && (
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>M-Pesa Receipt</div>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:'clamp(12px,3.5vw,15px)', color:T.gold, letterSpacing:'2px' }}>{order.mpesa_receipt}</div>
                          </div>
                        )}
                        {order.phone && (
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Phone</div>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13, color:T.white }}>{order.phone}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Delivery</div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13, color:T.goldLight }}>{zoneLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding:`0 clamp(14px,4vw,24px) clamp(16px,4vw,24px)` }}>
                    <div className="actions-row">
                      <button className="cta-gold" onClick={() => navigate('/')}>🛍️ Shop Again</button>
                      <button className="cta-outline" onClick={() => navigate('/reviews')}>⭐ My Reviews</button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />

    </div>
  );
}