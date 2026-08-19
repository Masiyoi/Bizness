// src/pages/profile/Discounts.tsx
//
// Shows two things:
//   1. Discounts you've already used — GET /api/discount/history, read off
//      discount_type/discount_amount on past confirmed orders.
//   2. Currently available offers — GET /api/discount/eligibility
//      (cart-independent, unlike /api/discount/preview).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
interface DiscountHistoryEntry {
  order_number:    string;
  applied_at:      string;
  discount_type:   string | null;
  discount_amount: number;
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const discountLabel = (type: string | null) =>
  type === 'first_order' ? '10% off first order' : type ?? 'Discount';
export default function Discounts() {
  const navigate = useNavigate();
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [history, setHistory]   = useState<DiscountHistoryEntry[] | null>(null);
  const [loading, setLoading]   = useState(true);
  useEffect(() => {
    Promise.all([
      axios.get('/api/discount/eligibility').then(r => setEligible(!!r.data.eligible)).catch(() => setEligible(null)),
      axios.get('/api/discount/history').then(r => setHistory(r.data.discounts || [])).catch(() => setHistory(null)),
    ]).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <p className="pf-eyebrow">Your Offers</p>
      <h1 className="pf-title">Discounts</h1>
      <p className="pf-sub">Offers tied to your account. No code needed — eligible discounts apply automatically at checkout.</p>
      {loading && <div className="pf-card">Loading…</div>}
      {!loading && eligible === null && (
        <div className="pf-card">
          <div className="pf-empty">
            <p className="pf-empty-title">Couldn't load your offers</p>
            <p className="pf-empty-sub">Try refreshing the page in a moment.</p>
          </div>
        </div>
      )}
      {!loading && eligible === true && (
        <div className="pf-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="pf-row-label">10% off your first order</p>
            <p className="pf-row-desc">Automatically applied at checkout — nothing to enter.</p>
          </div>
          <button className="pf-btn-primary" onClick={() => navigate('/')}>Shop Now</button>
        </div>
      )}
      {!loading && eligible === false && (!history || history.length === 0) && (
        <div className="pf-card">
          <div className="pf-empty">
            <p className="pf-empty-title">No active offers right now</p>
            <p className="pf-empty-sub">Your first-order discount has already been used. Keep an eye out — seasonal offers show up here too.</p>
          </div>
        </div>
      )}
      {!loading && history && history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p className="pf-eyebrow">Discounts You've Used</p>
          <div className="pf-card" style={{ padding: 0 }}>
            {history.map((entry, i) => (
              <div
                key={entry.order_number}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '16px 20px',
                  borderBottom: i < history.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div>
                  <p className="pf-row-label">{discountLabel(entry.discount_type)}</p>
                  <p className="pf-row-desc">Order {entry.order_number} · {fmtDate(entry.applied_at)}</p>
                </div>
                <span style={{ fontWeight: 700 }}>-KSh {entry.discount_amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
