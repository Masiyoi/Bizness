// src/pages/admin/components/affiliate/AffiliateManagement.tsx
import { useEffect, useState } from 'react';

interface Salesperson {
  id: number;
  coupon_code: string;
  commission_pct: string | number;
  status: string;
  name: string;
  email: string;
  total_sales: string | number;
  total_earned: string | number;
  pending_balance: string | number;
}

const money = (v: string | number) =>
  `KSh ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export default function AffiliateManagement() {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // add-salesperson form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [adding, setAdding] = useState(false);

  // mark-paid confirmation
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadSalespersons = async () => {
    try {
      const res = await fetch('/api/affiliate/salespersons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load salespersons');
      const data = await res.json();
      setSalespersons(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load salespersons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSalespersons(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setAdding(true);
    try {
      const res = await fetch('/api/affiliate/salespersons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          commissionPct: commissionPct ? Number(commissionPct) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add salesperson');

      showToast(`Added ${fullName} — code ${data.coupon_code}`);
      setEmail(''); setFullName(''); setCommissionPct('');
      loadSalespersons();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to add salesperson');
    } finally {
      setAdding(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/affiliate/salespersons/${id}/payout`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark payout as paid');

      showToast('Payout marked as paid');
      setConfirmId(null);
      loadSalespersons();
    } catch (err) {
      console.error(err);
      showToast('Failed to mark payout as paid');
    } finally {
      setMarkingPaid(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: "'DM Sans',sans-serif",
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", position: 'relative' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <span style={{ width: 2, height: 20, background: '#000', borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '-0.2px' }}>
          Affiliate Program
        </h2>
      </div>

      {/* ── Add salesperson ── */}
      <form
        onSubmit={handleAdd}
        style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
          padding: '20px 22px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, alignItems: 'end',
        }}
      >
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
            User Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jane Wanjiru"
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>
            Commission % <span style={{ fontWeight: 400, color: '#999' }}>(default 10)</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commissionPct}
            onChange={e => setCommissionPct(e.target.value)}
            placeholder="10"
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          style={{
            background: '#000', color: '#E8CD7A', border: 'none', borderRadius: 8,
            padding: '11px 20px', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.5px',
            textTransform: 'uppercase', cursor: adding ? 'default' : 'pointer', opacity: adding ? 0.6 : 1,
            height: 40,
          }}
        >
          {adding ? 'Adding…' : 'Add Salesperson'}
        </button>
      </form>

      {/* ── Salespersons table ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {['Name', 'Email', 'Code', 'Rate', 'Sales', 'Earned', 'Pending', 'Status', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px', fontSize: 10.5, fontWeight: 700,
                    color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#999' }}>Loading…</td></tr>
              )}
              {!loading && salespersons.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#999' }}>No salespersons yet.</td></tr>
              )}
              {salespersons.map(sp => (
                <tr key={sp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0A1628' }}>{sp.name}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{sp.email}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#B8860B', letterSpacing: '0.5px' }}>{sp.coupon_code}</td>
                  <td style={{ padding: '12px 16px' }}>{sp.commission_pct}%</td>
                  <td style={{ padding: '12px 16px' }}>{sp.total_sales}</td>
                  <td style={{ padding: '12px 16px' }}>{money(sp.total_earned)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{money(sp.pending_balance)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: sp.status === 'active' ? '#EAF7EE' : '#F5F5F5',
                      color: sp.status === 'active' ? '#1E8E3E' : '#888', textTransform: 'capitalize',
                    }}>
                      {sp.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setConfirmId(sp.id)}
                      disabled={Number(sp.pending_balance) <= 0}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(0,0,0,0.15)',
                        borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 600,
                        color: Number(sp.pending_balance) > 0 ? '#0A1628' : '#ccc',
                        cursor: Number(sp.pending_balance) > 0 ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm mark-paid dialog ── */}
      {confirmId !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '26px 28px', maxWidth: 360, width: '90%' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>
              Mark payout as paid?
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
              This clears this salesperson's pending balance. Only do this after you've sent the M-Pesa payout.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkPaid(confirmId)}
                disabled={markingPaid}
                style={{ background: '#000', color: '#E8CD7A', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: markingPaid ? 'default' : 'pointer', opacity: markingPaid ? 0.6 : 1 }}
              >
                {markingPaid ? 'Marking…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#000', color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontSize: 13, zIndex: 1100,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}