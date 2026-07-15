// src/pages/Orders.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import InstagramStrip from '../components/common/InstagramStrip';

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
  order_number: string;
  created_at: string;
  status: 'confirmed' | 'in_progress' | 'delivered' | 'cancelled';
  tracking_status: string;
  total_amount: string;
  delivery_fee?: string;
  delivery_zone?: string;
  mpesa_receipt?: string;
  phone?: string;
  items: OrderItem[];
}

const T = {
  navy:'#000000', navyMid:'#111111', navyLight:'#222222',
  gold:'#000000', goldLight:'#333333', goldPale:'#555555',
  cream:'#FFFFFF', creamMid:'#F5F5F5', creamDeep:'#E0E0E0',
  white:'#FFFFFF', text:'#000000', muted:'#888888',
};

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; border: string; icon: string; step: number }> = {
  confirmed:   { label:'Payment Confirmed',    color:'#000000', bg:'rgba(0,0,0,0.06)', border:'rgba(0,0,0,0.2)',  icon:'✅', step:0 },
  in_progress: { label:'Delivery In Progress', color:'#111111', bg:'rgba(0,0,0,0.07)', border:'rgba(0,0,0,0.2)',  icon:'🚚', step:1 },
  delivered:   { label:'Delivered',            color:'#000000', bg:'rgba(0,0,0,0.06)', border:'rgba(0,0,0,0.18)', icon:'🎉', step:2 },
  cancelled:   { label:'Cancelled',            color:'#555555', bg:'#F5F5F5',          border:'#CCCCCC',          icon:'✕',  step:-1 },
};

const DELIVERY_ZONE_LABELS: Record<string, string> = {
  pickup:'Shop Pickup', cbd:'Nairobi CBD', environs:'Nairobi Environs', county:'Other County',
};

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
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:T.white, borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 32px 80px rgba(0,0,0,0.25)', overflow:'hidden', animation:'modalIn 0.22s ease' }}>

        {/* Header */}
        <div style={{ background:'#FFFFFF', padding:'18px 22px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #E0E0E0' }}>
          <img
            src={item.image_url} alt={item.name}
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/F5F5F5/000000?text=LP`; }}
            style={{ width:52, height:52, objectFit:'cover', borderRadius:8, border:'2px solid #E0E0E0', flexShrink:0 }}
          />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:'#000000', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
            {item.category && (
              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'#888888', letterSpacing:'1.5px', textTransform:'uppercase', marginTop:3 }}>{item.category}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background:'#F5F5F5', border:'none', color:'#555555', width:28, height:28, borderRadius:7, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}
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
                  style={{ fontSize:30, cursor:'pointer', color:s<=(hover||rating)?'#000000':'#DDDDDD', transition:'all 0.15s', transform:s<=(hover||rating)?'scale(1.2)':'scale(1)', display:'inline-block', userSelect:'none' }}
                >★</span>
              ))}
            </div>
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#333333', marginTop:6, fontWeight:600, minHeight:18 }}>
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
            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:'#333333', background:'#F5F5F5', border:'1px solid #E0E0E0', borderRadius:8, padding:'8px 12px', marginBottom:14 }}>{error}</div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={onClose}
              style={{ flex:1, background:'#F0F0F0', color:'#000000', border:'none', borderRadius:10, padding:'11px 0', fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}
            >Cancel</button>
            <button
              onClick={handleSubmit} disabled={saving}
              style={{ flex:2, background:saving?'#E0E0E0':'#000000', color:saving?'#888888':'#FFFFFF', border:'none', borderRadius:10, padding:'11px 0', fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:saving?'not-allowed':'pointer', transition:'background 0.2s' }}
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

  const fetchReviewedStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/reviews/my');
      const reviewed: ReviewMap = {};
      for (const r of res.data) reviewed[Number(r.product_id)] = true;
      setReviewedMap(reviewed);
    } catch { /* non-critical */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders');
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
    fetchOrders();
  }, [fetchOrders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleReviewSubmit = async (productId: number, rating: number, comment: string) => {
    await axios.post('/api/reviews', { product_id: productId, rating, comment });
    setReviewedMap(prev => ({ ...prev, [Number(productId)]: true }));
    showToast('✓ Review submitted — thank you!');
  };

  const canReview = (status: Order['status']) =>
    ['confirmed', 'shipped', 'delivered'].includes(status);

  // Uses order.id internally — user_order_number is display only
  const toggleExpand = (orderId: number) =>
    setExpandedOrder(prev => prev === orderId ? null : orderId);

  const TRACKING_STEPS = [
    { icon:'💳', label:'Payment Confirmed'    },
    { icon:'🚚', label:'Delivery In Progress' },
    { icon:'🎉', label:'Delivered'            },
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
        body{background:#FFFFFF}
        a{text-decoration:none;color:inherit}
        .topbar-marquee{display:flex;gap:64px;animation:marquee 32s linear infinite;white-space:nowrap}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .back-btn{background:none;border:none;cursor:pointer;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#000000;padding:8px 0;display:flex;align-items:center;gap:8px;transition:opacity 0.2s;min-height:44px}
        .back-btn:hover{opacity:0.75}
        .ornament{display:flex;align-items:center;gap:14px;margin-bottom:8px}
        .ornament-line{flex:0 0 32px;height:1px;background:#CCCCCC}
        .ornament-diamond{width:5px;height:5px;background:#CCCCCC;transform:rotate(45deg);flex-shrink:0}
        .order-card{background:#FFFFFF;border:1px solid #E0E0E0;border-radius:18px;overflow:hidden;transition:all 0.25s;margin-bottom:16px}
        .order-card:hover{border-color:#000000;box-shadow:0 12px 36px rgba(0,0,0,0.08)}
        .order-header{padding:clamp(14px,4vw,20px) clamp(14px,4vw,24px);cursor:pointer;display:flex;align-items:center;gap:12px;transition:background 0.15s;min-height:72px}
        .order-header:hover{background:rgba(0,0,0,0.02)}
        .order-header:active{background:rgba(0,0,0,0.05)}
        .item-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${T.creamDeep}}
        .item-row:last-child{border-bottom:none}
        .cta-gold{font-family:'Jost',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;border-radius:8px;padding:clamp(12px,3vw,14px) clamp(16px,4vw,28px);cursor:pointer;transition:all 0.25s;background:#000000;color:#FFFFFF;min-height:44px;flex:1}
        .cta-gold:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.15)}
        .cta-outline{font-family:'Jost',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid ${T.creamDeep};border-radius:8px;padding:clamp(12px,3vw,12px) clamp(16px,4vw,24px);cursor:pointer;transition:all 0.2s;background:#fff;color:${T.navy};min-height:44px;flex:1}
        .cta-outline:hover{border-color:#555555;background:#F5F5F5}
        .fade-in{animation:fadeIn 0.35s ease forwards}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .expand-arrow{transition:transform 0.25s ease;display:inline-block;font-size:11px;color:${T.muted}}
        .expand-arrow.open{transform:rotate(180deg)}
        .order-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
        .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .actions-row{display:flex;gap:10px;flex-wrap:wrap}
        .review-btn{font-family:'Jost',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;transition:all 0.18s;white-space:nowrap;background:#000000;color:#FFFFFF}
        .review-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)}
        .reviewed-badge{font-family:'Jost',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:5px 12px;border-radius:6px;background:#F0F0F0;color:#333333;border:1px solid #E0E0E0;white-space:nowrap}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @media(max-width:380px){.order-thumbnails{display:none!important}}
        @media(max-width:600px){.track-label{display:none!important}.track-circle{width:24px!important;height:24px!important}}
        @media(max-width:560px){.summary-grid{grid-template-columns:1fr}}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1a1a1a', color:'#FFFFFF', fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, padding:'12px 24px', borderRadius:50, zIndex:999, letterSpacing:'1px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', animation:'toastIn 0.3s ease', whiteSpace:'nowrap' }}>
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
          <div style={{ fontFamily:"'Jost',sans-serif", background:'#F5F5F5', border:'1px solid #E0E0E0', borderRadius:10, padding:'12px 18px', color:'#333333', fontSize:13, marginBottom:24 }}>{error}</div>
        )}

        <div style={{ marginBottom:28 }}>
          <div className="ornament">
            <div className="ornament-line"/><div className="ornament-diamond"/>
            <span style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:900, letterSpacing:'3px', color:'#000000', textTransform:'uppercase' }}>History</span>
            <div className="ornament-diamond"/><div className="ornament-line"/>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(22px,5vw,30px)', color:'#000000' }}>Your Orders</h1>
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
          const status      = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.confirmed;
          const isOpen      = expandedOrder === order.id;          // ← uses order.id
          const isCancelled = order.status === 'cancelled';
          const eligible    = canReview(order.status);
          const subtotal    = Number(order.total_amount) - Number(order.delivery_fee ?? '0');
          const zoneLabel   = DELIVERY_ZONE_LABELS[order.delivery_zone ?? ''] ?? order.delivery_zone ?? '—';
          const totalQty    = order.items.reduce((s, i) => s + i.quantity, 0);

          const trackingIdx     = TRACKING_STEPS.findIndex(s => s.label === order.tracking_status);
          const currentTrackIdx = trackingIdx !== -1 ? trackingIdx :
            order.status === 'confirmed'   ? 0 :
            order.status === 'in_progress' ? 1 :
            order.status === 'delivered'   ? 2 : 0;

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
                    {/* Display uses the globally-unique order_number from the DB */}
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(14px,3.5vw,16px)', color:T.navy }}>
                      Order #{order.order_number}
                    </span>
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'1px', padding:'3px 10px', borderRadius:20, background:status.bg, color:status.color, border:`1px solid ${status.border}`, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>{formatDate(order.created_at)} · {formatTime(order.created_at)}</div>
                  {order.tracking_status && (
                    <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#555555', fontWeight:600, marginTop:3 }}>🚦 {order.tracking_status}</div>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="order-thumbnails" style={{ display:'flex', gap:5, flexShrink:0 }}>
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:T.creamMid, border:`1px solid ${T.creamDeep}`, flexShrink:0 }}>
                      <img src={item.image_url} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/F5F5F5/000000?text=LP`; }}/>
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
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, background:'#FAFAFA', borderRadius:10, padding:'10px 14px', border:'1px solid #E0E0E0' }}>
                        <span style={{ fontSize:18 }}>{TRACKING_STEPS[currentTrackIdx]?.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:900, color:'#000000', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:2 }}>Current Status</div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:700, color:T.navy }}>{order.tracking_status || TRACKING_STEPS[currentTrackIdx]?.label}</div>
                        </div>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, flexShrink:0 }}>Step {currentTrackIdx + 1}/{TRACKING_STEPS.length}</div>
                        {order.status === 'delivered' && (
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700, color:'#000000', background:'#F0F0F0', border:'1px solid #CCCCCC', borderRadius:20, padding:'3px 12px', flexShrink:0 }}>✓ Complete</div>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:0 }}>
                        {TRACKING_STEPS.map((s, i) => {
                          const isPast    = i < currentTrackIdx;
                          const isCurrent = i === currentTrackIdx;
                          return (
                            <div key={s.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                              {i > 0 && <div style={{ position:'absolute', left:0, top:12, width:'50%', height:2, background:isPast||isCurrent?'#000000':'#E0E0E0', transition:'background 0.4s' }}/>}
                              {i < TRACKING_STEPS.length - 1 && <div style={{ position:'absolute', right:0, top:12, width:'50%', height:2, background:isPast?'#000000':'#E0E0E0', transition:'background 0.4s' }}/>}
                              <div
                                className="track-circle"
                                style={{ width:26, height:26, borderRadius:'50%', zIndex:1, background:isPast?'#000000':isCurrent?'#000000':'#FFFFFF', border:isCurrent||isPast?'2px solid #000000':'2px solid #E0E0E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:isPast?10:isCurrent?12:9, boxShadow:isCurrent?'0 0 0 4px rgba(0,0,0,0.1)':'none', transition:'all 0.4s', flexShrink:0 }}
                              >
                                {isPast
                                  ? <span style={{ color:'#FFFFFF' }}>✓</span>
                                  : isCurrent
                                  ? <span style={{ color:'#FFFFFF' }}>{s.icon}</span>
                                  : <span style={{ color:'#AAAAAA', fontFamily:"'Jost',sans-serif", fontWeight:700 }}>{i + 1}</span>
                                }
                              </div>
                              <div
                                className="track-label"
                                style={{ fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:isCurrent?700:500, color:isCurrent?'#000000':isPast?'#000000':'#AAAAAA', marginTop:6, letterSpacing:'0.3px', textAlign:'center', lineHeight:1.3, opacity:isPast||isCurrent||i===currentTrackIdx+1?1:0.45 }}
                              >{s.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cancelled banner */}
                  {isCancelled && (
                    <div style={{ padding:'14px clamp(14px,4vw,24px)', background:'#F5F5F5', borderBottom:'1px solid #E0E0E0' }}>
                      <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'#555555', fontWeight:600 }}>✕ This order was cancelled.</p>
                    </div>
                  )}

                  {/* Items list */}
                  <div style={{ padding:`clamp(16px,4vw,20px) clamp(14px,4vw,24px)` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                      <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:900, letterSpacing:'2px', textTransform:'uppercase', color:'#000000' }}>Items Ordered</div>
                      {eligible && (
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'#555555', fontWeight:600 }}>★ Tap a product to leave a review</div>
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
                                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/52x52/F5F5F5/000000?text=LP`; }}/>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              {item.category && (
                                <div style={{ display:'inline-block', background:'#000000', color:'#FFFFFF', borderRadius:3, padding:'1px 7px', fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:4 }}>{item.category}</div>
                              )}
                              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:'clamp(12px,3vw,14px)', color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                              <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted, marginTop:2 }}>Qty: {item.quantity} · KSh {Number(item.price).toLocaleString()} each</div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                              <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:700, fontSize:'clamp(12px,3.5vw,15px)', color:'#000000' }}>
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
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:900, letterSpacing:'2px', textTransform:'uppercase', color:'#000000', marginBottom:12 }}>Cost Breakdown</div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>Subtotal</span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, color:T.navy }}>KSh {subtotal.toLocaleString()}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>Delivery · <span style={{ color:'#555555' }}>{zoneLabel}</span></span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:600, color:Number(order.delivery_fee??'0')===0?'#000000':T.navy, flexShrink:0 }}>
                            {Number(order.delivery_fee??'0')===0 ? 'FREE' : `KSh ${Number(order.delivery_fee).toLocaleString()}`}
                          </span>
                        </div>
                        <div style={{ height:1, background:'linear-gradient(90deg,transparent,#CCCCCC,transparent)', margin:'10px 0' }}/>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:13, fontWeight:700, color:T.navy, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</span>
                          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:15, fontWeight:800, color:T.navy }}>KSh {Number(order.total_amount).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ background:'#FFFFFF', border:'1px solid #E0E0E0', borderRadius:14, padding:'clamp(12px,3vw,16px) clamp(12px,3vw,18px)' }}>
                        <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#888888', marginBottom:12 }}>Payment & Delivery</div>
                        {order.mpesa_receipt && (
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'#AAAAAA', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>M-Pesa Receipt</div>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:'clamp(12px,3.5vw,15px)', color:'#000000', letterSpacing:'2px' }}>{order.mpesa_receipt}</div>
                          </div>
                        )}
                        {order.phone && (
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'#AAAAAA', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Phone</div>
                            <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13, color:'#000000' }}>{order.phone}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontSize:10, color:'#AAAAAA', letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>Delivery</div>
                          <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:13, color:'#000000' }}>{zoneLabel}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ padding:`0 clamp(14px,4vw,24px) clamp(16px,4vw,24px)` }}>
                    <div className="actions-row">
                      <button className="cta-gold" onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Shop Again
                      </button>
                      <button className="cta-outline" onClick={() => navigate('/reviews')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        My Reviews
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

       <InstagramStrip
        handle="@lukuprime"
        profileUrl="https://instagram.com/lukuprime"
        limit={12}
            />

      <Footer />

    </div>
  );
}