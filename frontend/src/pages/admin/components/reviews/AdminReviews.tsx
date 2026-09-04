import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { T } from '../../constants';
interface Review {
  id:             number;
  rating:         number;
  comment:        string | null;
  created_at:     string;
  admin_reply:    string | null;
  admin_reply_at: string | null;
  full_name:      string;
  email:          string;
  product_name:   string;
  product_id:     number;
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const Stars = ({ n }: { n: number }) => (
  <span style={{ color: T.black, letterSpacing: 1 }}>
    {'★'.repeat(n)}<span style={{ color: T.grey3 }}>{'★'.repeat(5 - n)}</span>
  </span>
);
export function AdminReviews() {
  const [reviews, setReviews]   = useState<Review[] | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [search, setSearch]     = useState('');
  const [drafts, setDrafts]     = useState<Record<number, string>>({});
  const [saving, setSaving]     = useState<Record<number, boolean>>({});
  const load = () => {
    setLoading(true);
    setError(false);
    const params: Record<string, number> = {};
    if (ratingFilter !== '') { params.minRating = ratingFilter; params.maxRating = ratingFilter; }
    axios.get('/api/reviews/admin/all', { params })
      .then(r => {
        setReviews(r.data);
        const d: Record<number, string> = {};
        r.data.forEach((rv: Review) => { d[rv.id] = rv.admin_reply || ''; });
        setDrafts(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [ratingFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => {
    if (!reviews) return [];
    const q = search.toLowerCase();
    if (!q) return reviews;
    return reviews.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q)
    );
  }, [reviews, search]);
  const saveReply = async (id: number) => {
    setSaving(s => ({ ...s, [id]: true }));
    try {
      const reply = drafts[id] || '';
      const res = await axios.patch(`/api/reviews/admin/${id}/reply`, { reply });
      setReviews(prev => prev?.map(r => r.id === id
        ? { ...r, admin_reply: res.data.admin_reply, admin_reply_at: res.data.admin_reply_at }
        : r
      ) ?? null);
    } catch {
      // leave draft as-is so the admin can retry
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Customer Feedback</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>Reviews</h1>
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <select
          value={ratingFilter}
          onChange={e => setRatingFilter(e.target.value === '' ? '' : Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12, background: T.white }}
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search customer, email, product, comment"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12 }}
        />
      </div>
      {loading && <div className="pf-card" style={{ padding: 20 }}>Loading…</div>}
      {!loading && error && (
        <div className="pf-card" style={{ padding: 20 }}>
          <div className="pf-empty">
            <p className="pf-empty-title">Couldn't load reviews</p>
            <p className="pf-empty-sub">Try refreshing the page.</p>
          </div>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>No reviews found</div>
          <div style={{ fontSize: 13 }}>Try a different rating filter or clear the search.</div>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.id} className="pf-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <Stars n={r.rating} />
                    <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700, color: T.black }}>{r.full_name}</span>
                  </div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>
                    {r.email} · on {r.product_name}
                  </div>
                </div>
                <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>{fmtDate(r.created_at)}</div>
              </div>
              {r.comment && (
                <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.black, marginBottom: 14, lineHeight: 1.5 }}>
                  {r.comment}
                </p>
              )}
              <div style={{ borderTop: `1px solid ${T.grey3}`, paddingTop: 12 }}>
                <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                  Admin reply
                </p>
                <textarea
                  value={drafts[r.id] ?? ''}
                  onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="Write a public reply to this review…"
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 13,
                    resize: 'vertical', marginBottom: 8,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
                    {r.admin_reply_at ? `Last replied ${fmtDate(r.admin_reply_at)}` : 'No reply yet'}
                  </span>
                  <button
                    onClick={() => saveReply(r.id)}
                    disabled={saving[r.id]}
                    style={{
                      padding: '8px 16px', borderRadius: 7, border: 'none',
                      background: T.black, color: T.white,
                      fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600,
                      cursor: saving[r.id] ? 'not-allowed' : 'pointer',
                      opacity: saving[r.id] ? 0.6 : 1,
                    }}
                  >{saving[r.id] ? 'Saving…' : 'Save Reply'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}