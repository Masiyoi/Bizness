import { useEffect, useState } from 'react';
import axios from 'axios';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  full_name: string;
  user_id: number;
}

interface ReviewStats {
  total: number;
  average: number;
  five: number; four: number; three: number; two: number; one: number;
}

const T = {
  navy:'#0D1B3E', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0', muted:'#7A7A8A',
};

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:size, color: i <= Math.round(rating) ? T.gold : T.creamDeep, lineHeight:1 }}>
          {i <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }: { productId: number }) {
  const [open,    setOpen]    = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats,   setStats]   = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Fetch only once, on first open
  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    axios.get(`/api/reviews/product/${productId}`)
      .then(res => {
        setReviews(res.data.reviews);
        setStats(res.data.stats);
        setFetched(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, productId, fetched]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });

  const statRows: { label: string; key: keyof ReviewStats }[] = [
    { label:'5★', key:'five'  },
    { label:'4★', key:'four'  },
    { label:'3★', key:'three' },
    { label:'2★', key:'two'   },
    { label:'1★', key:'one'   },
  ];

  return (
    <div style={{ marginTop: 40, fontFamily:"'Jost','DM Sans',sans-serif" }}>
      <style>{reviewCss}</style>

      {/* ── Trigger ── */}
      <button className="rv-trigger" onClick={() => setOpen(o => !o)}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase' as const, color:T.gold }}>
            Reviews
          </span>
          {stats && (
            <>
              <span className="rv-badge">{stats.total} review{stats.total !== 1 ? 's' : ''}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:20, fontWeight:700, color:T.cream }}>{stats.average?.toFixed(1)}</span>
                <Stars rating={stats.average ?? 0} size={13}/>
              </div>
            </>
          )}
          {!stats && !loading && (
            <span className="rv-badge">See all reviews</span>
          )}
          {loading && (
            <span style={{ fontSize:11, color:`rgba(200,169,81,0.5)` }}>Loading…</span>
          )}
        </div>
        <span className={`rv-chevron ${open ? 'rv-open' : ''}`}>▼</span>
      </button>

      {/* ── Collapsible body ── */}
      <div className={`rv-body ${open ? 'rv-body-open' : ''}`}>
        <div className="rv-inner">

          {loading && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.muted, fontSize:13 }}>
              Loading reviews…
            </div>
          )}

          {!loading && fetched && (
            <>
              {/* Rating breakdown */}
              {stats && stats.total > 0 && (
                <div style={{ marginBottom:8 }}>
                  {statRows.map(({ label, key }) => {
                    const count = stats[key] as number;
                    const pct   = stats.total ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:T.muted, width:24, textAlign:'right' as const }}>{label}</span>
                        <div style={{ flex:1, height:6, background:T.creamDeep, borderRadius:3, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:T.gold, borderRadius:3, transition:'width 0.4s' }}/>
                        </div>
                        <span style={{ fontSize:11, color:T.muted, width:18 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ height:1, background:`linear-gradient(90deg,transparent,rgba(200,169,81,0.25),transparent)`, margin:'18px 0' }}/>

              {/* Review cards */}
              {reviews.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', fontSize:13, color:T.muted }}>
                  No reviews yet. Be the first to review this product.
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="rv-card">
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{r.full_name}</div>
                        <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{fmtDate(r.created_at)}</div>
                      </div>
                      <Stars rating={r.rating} size={14}/>
                    </div>
                    {r.comment && (
                      <p style={{ fontSize:13, color:`rgba(13,27,62,0.75)`, lineHeight:1.75, margin:0 }}>
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const reviewCss = `
  .rv-trigger {
    width: 100%;
    background: #0D1B3E;
    border: none;
    border-radius: 10px;
    padding: 16px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background 0.2s;
  }
  .rv-trigger:hover { background: #1E2F5A; }

  .rv-badge {
    background: rgba(200,169,81,0.15);
    border: 1px solid rgba(200,169,81,0.3);
    color: #C8A951;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .rv-chevron {
    color: rgba(200,169,81,0.6);
    font-size: 11px;
    transition: transform 0.25s;
    font-family: 'Jost', sans-serif;
  }
  .rv-chevron.rv-open { transform: rotate(180deg); }

  .rv-body {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.4s ease;
  }
  .rv-body-open { max-height: 3000px; }

  .rv-inner {
    background: #F9F5EC;
    border: 1px solid #E4D9C0;
    border-top: none;
    border-radius: 0 0 10px 10px;
    padding: 22px 22px 18px;
  }

  .rv-card {
    background: #fff;
    border: 1px solid #E4D9C0;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }
  .rv-card:last-child { margin-bottom: 0; }
`;