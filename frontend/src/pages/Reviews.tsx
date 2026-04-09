import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: string;
  product_category: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

interface PurchasedProduct {
  id: number;
  name: string;
  image_url: string;
  price: string;
  category: string;
}

interface User {
  id: number; full_name: string; email: string; role: string; is_verified: boolean;
}

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A', goldPale:'#F0D98A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0',
  white:'#FFFFFF', text:'#0D1B3E', muted:'#7A7A8A',
};

const readUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });

function Stars({ rating, size = 16, interactive = false, onRate }: {
  rating: number; size?: number; interactive?: boolean; onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => interactive && onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: size, cursor: interactive ? 'pointer' : 'default',
            color: s <= (hover || rating) ? T.gold : T.creamDeep,
            transition: 'color 0.15s, transform 0.15s',
            transform: interactive && s <= (hover || rating) ? 'scale(1.25)' : 'scale(1)',
            display: 'inline-block', userSelect: 'none',
          }}>★</span>
      ))}
    </div>
  );
}

// ── Shared modal for writing AND editing reviews ───────────────
function ReviewModal({
  productId, productName, productImage, productCategory,
  existingRating, existingComment, existingId,
  onClose, onSave,
}: {
  productId: number; productName: string; productImage: string; productCategory?: string;
  existingRating?: number; existingComment?: string | null; existingId?: number;
  onClose: () => void;
  onSave: (productId: number, rating: number, comment: string, existingId?: number) => Promise<void>;
}) {
  const [rating,  setRating]  = useState(existingRating  || 0);
  const [comment, setComment] = useState(existingComment || '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    if (!rating) { setError('Please select a star rating.'); return; }
    setSaving(true);
    try {
      await onSave(productId, rating, comment, existingId);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not save review. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.72)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:T.white, borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 32px 80px rgba(13,27,62,0.3)', overflow:'hidden', animation:'modalIn 0.22s ease' }}>

        <div style={{ background:T.navy, padding:'20px 24px', display:'flex', alignItems:'center', gap:14 }}>
          <img src={productImage} alt={productName}
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/56x56/152348/C8A951?text=LP`; }}
            style={{ width:56, height:56, objectFit:'cover', borderRadius:10, border:`2px solid rgba(200,169,81,0.3)`, flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{productName}</div>
            <div className="jost" style={{ fontSize:10, color:`rgba(200,169,81,0.7)`, letterSpacing:'1.5px', textTransform:'uppercase', marginTop:3 }}>{productCategory || 'Fashion'}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          <div style={{ marginBottom:20 }}>
            <div className="jost" style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted, marginBottom:10 }}>Your Rating</div>
            <Stars rating={rating} size={32} interactive onRate={setRating}/>
            <div className="jost" style={{ fontSize:11, color:T.gold, marginTop:6, fontWeight:600 }}>
              {['','Terrible','Poor','Average','Good','Excellent!'][rating] || ''}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="jost" style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.muted, marginBottom:8 }}>
              Comment <span style={{ fontWeight:400 }}>(optional)</span>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} rows={4}
              placeholder="Share your experience — fit, quality, style…"
              style={{ width:'100%', border:`1.5px solid ${T.creamDeep}`, borderRadius:10, padding:'11px 14px', fontFamily:"'Jost',sans-serif", fontSize:13, color:T.navy, resize:'vertical', outline:'none', background:T.cream, lineHeight:1.6, transition:'border-color 0.2s', boxSizing:'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = T.gold}
              onBlur={e  => e.currentTarget.style.borderColor = T.creamDeep}/>
            <div className="jost" style={{ fontSize:10, color:T.muted, textAlign:'right', marginTop:4 }}>{comment.length}/1000</div>
          </div>
          {error && <div className="jost" style={{ fontSize:12, color:'#C0392B', background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:8, padding:'9px 13px', marginBottom:16 }}>{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} className="jost" style={{ flex:1, background:T.creamMid, color:T.navy, border:'none', borderRadius:10, padding:'11px 0', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="jost"
              style={{ flex:2, background:saving?T.creamDeep:T.gold, color:saving?T.muted:T.navy, border:'none', borderRadius:10, padding:'11px 0', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:saving?'not-allowed':'pointer', transition:'background 0.2s' }}>
              {saving ? 'Saving…' : existingId ? '★ Update Review' : '★ Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const user     = readUser();

  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [purchasable, setPurchasable] = useState<PurchasedProduct[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeModal, setActiveModal] = useState<{
    type: 'write' | 'edit';
    product: PurchasedProduct | null;
    review: Review | null;
  } | null>(null);
  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [toast,     setToast]     = useState('');
  const [filter,    setFilter]    = useState<number | 'all'>('all');

  useEffect(() => { if (!user) navigate('/login'); }, []);

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [r1, r2] = await Promise.all([
        axios.get('/api/reviews/my',          { headers }),
        axios.get('/api/reviews/purchasable', { headers }),
      ]);
      setReviews(Array.isArray(r1.data) ? r1.data : []);
      setPurchasable(Array.isArray(r2.data) ? r2.data : []);
    } catch (err) {
      console.error('fetchAll error', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleSave = async (productId: number, rating: number, comment: string, existingId?: number) => {
    if (existingId) {
      const { data } = await axios.patch(`/api/reviews/${existingId}`, { rating, comment }, { headers });
      setReviews(prev => prev.map(r =>
        r.id === existingId ? { ...r, rating: data.rating, comment: data.comment, updated_at: data.updated_at } : r
      ));
      showToast('✓ Review updated');
    } else {
      await axios.post('/api/reviews', { product_id: productId, rating, comment }, { headers });
      await fetchAll();
      showToast('✓ Review submitted — thank you!');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/reviews/${id}`, { headers });
      setReviews(prev => prev.filter(r => r.id !== id));
      await fetchAll();
      showToast('Review deleted');
    } catch { showToast('Could not delete — try again.'); }
    setDeleteId(null);
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === filter);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  if (!user) return null;

  return (
    <div style={{ fontFamily:"'Playfair Display','Georgia',serif", background:T.cream, minHeight:'100vh', color:T.text }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:T.navy, color:T.goldLight, fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, padding:'12px 24px', borderRadius:50, zIndex:999, letterSpacing:'1px', boxShadow:'0 8px 32px rgba(13,27,62,0.3)', animation:'toastIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      {/* Review Modal */}
      {activeModal && (
        <ReviewModal
          productId={activeModal.type === 'write' ? activeModal.product!.id : activeModal.review!.product_id}
          productName={activeModal.type === 'write' ? activeModal.product!.name : activeModal.review!.product_name}
          productImage={activeModal.type === 'write' ? activeModal.product!.image_url : activeModal.review!.product_image}
          productCategory={activeModal.type === 'write' ? activeModal.product!.category : activeModal.review!.product_category}
          existingRating={activeModal.review?.rating}
          existingComment={activeModal.review?.comment}
          existingId={activeModal.review?.id}
          onClose={() => setActiveModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(13,27,62,0.7)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:T.white, borderRadius:16, padding:28, maxWidth:360, width:'100%', boxShadow:'0 24px 60px rgba(13,27,62,0.25)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:T.navy, marginBottom:10 }}>Delete Review?</div>
            <p className="jost" style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:22 }}>This cannot be undone. Your rating will be removed from the product.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeleteId(null)} className="jost" style={{ flex:1, background:T.creamMid, color:T.navy, border:'none', borderRadius:8, padding:'10px 0', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="jost" style={{ flex:1, background:'#C0392B', color:'#fff', border:'none', borderRadius:8, padding:'10px 0', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background:T.navy, padding:'0 5%', height:70, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:`0 4px 32px rgba(13,27,62,0.35)`, borderBottom:`1px solid rgba(200,169,81,0.25)` }}>
        <img src={logo} alt="Luku Prime" style={{ height:54, width:'auto', objectFit:'contain', cursor:'pointer', filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }} onClick={() => navigate('/')}/>
        <div className="jost" style={{ fontSize:13, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:`rgba(200,169,81,0.8)` }}>My Reviews</div>
        <button onClick={() => navigate(-1)} className="jost" style={{ background:'rgba(200,169,81,0.12)', border:`1px solid rgba(200,169,81,0.25)`, color:T.goldLight, borderRadius:6, padding:'8px 16px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      </nav>

      {/* Page header */}
      <div style={{ background:T.navy, padding:'40px 5% 48px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 70% 50%, rgba(200,169,81,0.06) 0%, transparent 60%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:900, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:24, height:1, background:T.gold }}/>
            <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>Your Voice</span>
            <div style={{ width:24, height:1, background:T.gold }}/>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(26px,4vw,40px)', color:T.white, marginBottom:8 }}>Reviews & Ratings</h1>
          <p className="jost" style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontWeight:300, maxWidth:500, lineHeight:1.8 }}>
            Your honest feedback shapes the Luku Prime community.
          </p>
          {reviews.length > 0 && (
            <div style={{ display:'flex', gap:16, marginTop:28, flexWrap:'wrap' }}>
              {[
                { label:'Reviews Left',   value: reviews.length },
                { label:'Average Rating', value: avgRating },
                { label:'5-Star Reviews', value: reviews.filter(r=>r.rating===5).length },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(200,169,81,0.15)', borderRadius:12, padding:'14px 20px', minWidth:100 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:T.gold }}>{s.value}</div>
                  <div className="jost" style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3, letterSpacing:'1px' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 5% 80px' }}>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display:'grid', gap:14 }}>
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{ background:T.white, borderRadius:16, padding:20, border:`1px solid ${T.creamDeep}`, display:'flex', gap:14 }}>
                <div className="skel" style={{ width:72, height:72, borderRadius:10, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div className="skel" style={{ height:12, width:'55%', marginBottom:10 }}/>
                  <div className="skel" style={{ height:10, width:'30%', marginBottom:10 }}/>
                  <div className="skel" style={{ height:10, width:'80%' }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── NO ORDERS AT ALL ── */}
        {!loading && purchasable.length === 0 && reviews.length === 0 && (
          <div style={{ textAlign:'center', padding:'70px 0' }}>
            <div style={{ fontSize:54, marginBottom:16 }}>⭐</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20, color:T.navy, marginBottom:8 }}>No Reviews Yet</div>
            <p className="jost" style={{ fontSize:13, color:T.muted, lineHeight:1.8, marginBottom:24, maxWidth:360, margin:'0 auto 24px' }}>
              Once you place and receive an order, you can leave reviews here.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => navigate('/')} className="jost"
                style={{ background:T.gold, color:T.navy, border:'none', borderRadius:8, padding:'11px 28px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>
                Shop Now →
              </button>
              <button onClick={() => navigate('/orders')} className="jost"
                style={{ background:'transparent', color:T.navy, border:`1.5px solid ${T.creamDeep}`, borderRadius:8, padding:'11px 28px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer' }}>
                My Orders
              </button>
            </div>
          </div>
        )}

        {!loading && (purchasable.length > 0 || reviews.length > 0) && (
          <>
            {/* ═══════════════════════════════════════════════
                WRITE A REVIEW — shown when purchases exist
            ════════════════════════════════════════════════ */}
            {purchasable.length > 0 && (
              <div style={{ marginBottom:44 }}>
                {/* Banner CTA */}
                <div style={{ background:T.navy, borderRadius:16, padding:'20px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:20 }}>⭐</span>
                      <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>Awaiting Your Feedback</span>
                    </div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:T.white }}>
                      You have {purchasable.length} product{purchasable.length !== 1 ? 's' : ''} to review
                    </div>
                    <div className="jost" style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:4 }}>
                      Your honest reviews help other shoppers make better decisions
                    </div>
                  </div>
                  <button onClick={() => navigate('/orders')} className="jost"
                    style={{ background:'rgba(200,169,81,0.15)', border:`1px solid rgba(200,169,81,0.35)`, color:T.goldLight, borderRadius:8, padding:'10px 20px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', flexShrink:0 }}>
                    View Orders →
                  </button>
                </div>

                {/* Product cards */}
                <div style={{ display:'grid', gap:12 }}>
                  {purchasable.map(product => (
                    <div key={product.id} style={{
                      background:T.white, borderRadius:14, padding:'16px 18px',
                      border:`1.5px solid ${T.gold}`, display:'flex', alignItems:'center',
                      gap:14, boxShadow:`0 4px 16px rgba(200,169,81,0.1)`,
                    }}>
                      <Link to={`/product/${product.id}`}>
                        <img src={product.image_url} alt={product.name}
                          onError={e => { (e.target as HTMLImageElement).src=`https://placehold.co/68x68/F0EAD8/0D1B3E?text=LP`; }}
                          style={{ width:68, height:68, objectFit:'cover', borderRadius:10, border:`1.5px solid ${T.creamDeep}`, flexShrink:0 }}/>
                      </Link>
                      <div style={{ flex:1, minWidth:0 }}>
                        <Link to={`/product/${product.id}`}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:14, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{product.name}</div>
                        </Link>
                        {product.category && (
                          <span className="jost" style={{ fontSize:9, fontWeight:700, background:T.creamMid, color:T.muted, borderRadius:3, padding:'2px 8px', letterSpacing:'1.5px', textTransform:'uppercase' }}>{product.category}</span>
                        )}
                        <div className="jost" style={{ fontSize:12, color:T.muted, marginTop:6 }}>
                          KSh {Number(product.price).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveModal({ type:'write', product, review:null })}
                        className="jost"
                        style={{ background:T.gold, color:T.navy, border:'none', borderRadius:8, padding:'11px 22px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', flexShrink:0, transition:'all 0.2s', whiteSpace:'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px rgba(200,169,81,0.35)`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                      >
                        ★ Write Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider between sections */}
            {purchasable.length > 0 && reviews.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:14, margin:'0 0 32px' }}>
                <div style={{ flex:1, height:1, background:T.creamDeep }}/>
                <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.muted, textTransform:'uppercase' }}>Past Reviews</span>
                <div style={{ flex:1, height:1, background:T.creamDeep }}/>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                PAST REVIEWS
            ════════════════════════════════════════════════ */}
            {reviews.length > 0 && (
              <>
                {/* Filter bar */}
                <div style={{ background:T.white, border:`1px solid ${T.creamDeep}`, borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span className="jost" style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:T.muted, textTransform:'uppercase', marginRight:4 }}>Filter:</span>
                  {(['all', 5, 4, 3, 2, 1] as (number|'all')[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className="jost"
                      style={{ background:filter===f ? T.navy : T.cream, color:filter===f ? T.gold : T.navy, border:`1.5px solid ${filter===f ? T.navyLight : T.creamDeep}`, borderRadius:50, padding:'5px 14px', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.18s' }}>
                      {f === 'all' ? 'All' : `${'★'.repeat(f)} ${f}`}
                    </button>
                  ))}
                  <span className="jost" style={{ fontSize:11, color:T.muted, marginLeft:'auto' }}>{filtered.length} review{filtered.length!==1?'s':''}</span>
                </div>

                {filtered.length === 0 ? (
                  <div className="jost" style={{ textAlign:'center', padding:'30px 0', fontSize:13, color:T.muted }}>
                    No {filter}-star reviews. Try a different filter.
                  </div>
                ) : (
                  <div style={{ display:'grid', gap:14 }}>
                    {filtered.map(review => (
                      <div key={review.id} className="rcard">
                        <Link to={`/product/${review.product_id}`}>
                          <img src={review.product_image} alt={review.product_name}
                            onError={e => { (e.target as HTMLImageElement).src=`https://placehold.co/80x80/F0EAD8/0D1B3E?text=LP`; }}
                            style={{ width:80, height:80, objectFit:'cover', borderRadius:12, border:`1.5px solid ${T.creamDeep}`, flexShrink:0, transition:'transform 0.3s' }}
                            className="rcard-img"/>
                        </Link>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                            <div style={{ minWidth:0, flex:1 }}>
                              <Link to={`/product/${review.product_id}`}>
                                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, color:T.navy, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{review.product_name}</div>
                              </Link>
                              {review.product_category && (
                                <span className="jost" style={{ fontSize:9, fontWeight:700, background:T.creamMid, color:T.muted, borderRadius:3, padding:'2px 8px', letterSpacing:'1.5px', textTransform:'uppercase' }}>{review.product_category}</span>
                              )}
                            </div>
                            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                              <button onClick={() => setActiveModal({ type:'edit', product:null, review })} className="jost rcard-btn"
                                style={{ background:T.creamMid, color:T.navy, border:`1px solid ${T.creamDeep}` }}>✎ Edit</button>
                              <button onClick={() => setDeleteId(review.id)} className="jost rcard-btn"
                                style={{ background:'#FDF0EE', color:'#C0392B', border:'1px solid #F5C6C0' }}>✕ Delete</button>
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                            <Stars rating={review.rating} size={14}/>
                            <span className="jost" style={{ fontSize:10, color:T.muted }}>{formatDate(review.updated_at)}</span>
                            {review.updated_at !== review.created_at && (
                              <span className="jost" style={{ fontSize:9, color:T.muted, background:T.creamMid, padding:'1px 7px', borderRadius:10 }}>edited</span>
                            )}
                          </div>
                          {review.comment
                            ? <p className="jost" style={{ fontSize:13, color:'#3A3A4A', lineHeight:1.7, margin:0 }}>{review.comment}</p>
                            : <p className="jost" style={{ fontSize:12, color:T.muted, fontStyle:'italic', margin:0 }}>No comment left.</p>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .jost{font-family:'Jost',sans-serif}
  a{text-decoration:none;color:inherit}

  .rcard{background:#fff;border-radius:16px;padding:18px 20px;border:1px solid #E4D9C0;display:flex;gap:16px;align-items:flex-start;transition:all 0.25s}
  .rcard:hover{border-color:#C8A951;box-shadow:0 10px 32px rgba(13,27,62,0.09);transform:translateY(-2px)}
  .rcard:hover .rcard-img{transform:scale(1.04)}

  .rcard-btn{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:6px;padding:6px 12px;cursor:pointer;transition:all 0.18s;white-space:nowrap}
  .rcard-btn:hover{filter:brightness(0.93);transform:translateY(-1px)}

  .skel{background:linear-gradient(90deg,#F0EAD8 25%,#F9F5EC 50%,#F0EAD8 75%);background-size:200% 100%;animation:sk 1.4s infinite;border-radius:6px}
  @keyframes sk{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

  @media(max-width:600px){
    .rcard{flex-direction:column}
    .rcard img{width:100%!important;height:160px!important}
  }
`;