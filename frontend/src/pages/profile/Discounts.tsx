// src/pages/profile/Discounts.tsx
//
// Your discountController.js only implements ONE discount: 10% off a
// customer's first confirmed order, applied automatically at checkout.
// There's no coupon-code system, so this page is a status page, not a
// code list.
//
// GET /api/discount/preview exists but requires cart contents to compute a
// subtotal — on a profile page (cart may be empty) that would misreport
// eligibility as false. This page instead calls a small new endpoint,
// GET /api/discount/eligibility, which just answers "have they ever
// completed an order?" with no cart dependency. See the accompanying
// discountController.js diff for the ~10-line addition needed.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Discounts() {
  const navigate = useNavigate();
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    axios.get('/api/discount/eligibility')
      .then(r => setEligible(!!r.data.eligible))
      .catch(() => setEligible(null))
      .finally(() => setLoading(false));
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

      {!loading && eligible === false && (
        <div className="pf-card">
          <div className="pf-empty">
            <p className="pf-empty-title">No active offers right now</p>
            <p className="pf-empty-sub">Your first-order discount has already been used. Keep an eye out — seasonal offers show up here too.</p>
          </div>
        </div>
      )}
    </div>
  );
}