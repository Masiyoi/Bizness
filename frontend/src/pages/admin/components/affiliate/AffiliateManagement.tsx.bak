// src/pages/admin/components/affiliate/AffiliateManagement.tsx
import { useEffect, useState } from 'react';
import { T, lbl, inp } from '../../constants';
import { ConfirmDialog } from '../ConfirmDialog';

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

interface AffiliateManagementProps {
  showToast: (msg: string, type?: string) => void;
}

const money = (v: string | number) =>
  `KSh ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

export function AffiliateManagement({ showToast }: AffiliateManagementProps) {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);

  // add-salesperson form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [adding, setAdding] = useState(false);

  // mark-paid confirmation
  const [confirmTarget, setConfirmTarget] = useState<{ id: number; name: string } | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadSalespersons = async () => {
    try {
      const res = await fetch('/api/affiliate/salespersons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load salespersons');
      const data = await res.json();
      setSalespersons(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load salespersons', 'err');
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

      showToast(`✓ Added ${fullName} — code ${data.coupon_code}`);
      setEmail(''); setFullName(''); setCommissionPct('');
      loadSalespersons();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to add salesperson', 'err');
    } finally {
      setAdding(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirmTarget) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/affiliate/salespersons/${confirmTarget.id}/payout`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark payout as paid');

      showToast('✓ Payout marked as paid');
      loadSalespersons();
    } catch (err) {
      console.error(err);
      showToast('Failed to mark payout as paid', 'err');
    } finally {
      setMarkingPaid(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Jost',sans-serif" }} className="fade-up">

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 700, fontSize: 24, color: T.black, letterSpacing: '0.3px',
        }}>
          Affiliate Program
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: T.grey1,
          letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4,
        }}>
          Salespersons & Payouts
        </div>
      </div>

      {/* ── Add salesperson ── */}
      <form
        onSubmit={handleAdd}
        className="panel"
        style={{
          marginBottom: 28,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, alignItems: 'end',
        }}
      >
        <div>
          <label style={lbl}>User Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jane Wanjiru"
            required
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Commission % <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(default 10)</span></label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={commissionPct}
            onChange={e => setCommissionPct(e.target.value)}
            placeholder="10"
            style={inp}
          />
        </div>
        <button type="submit" disabled={adding} className="btn btn-primary" style={{ height: 44, justifyContent: 'center' }}>
          {adding ? 'Adding…' : 'Add Salesperson'}
        </button>
      </form>

      {/* ── Salespersons table ── */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.grey6, borderBottom: `1px solid ${T.grey3}` }}>
                {['Name', 'Email', 'Code', 'Rate', 'Sales', 'Earned', 'Pending', 'Status', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 700,
                    color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap',
                    fontFamily: 'Jost, sans-serif',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: T.grey1 }}>Loading…</td></tr>
              )}
              {!loading && salespersons.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: T.grey1 }}>No salespersons yet.</td></tr>
              )}
              {salespersons.map(sp => (
                <tr key={sp.id} style={{ borderBottom: `1px solid ${T.grey3}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: T.black }}>{sp.name}</td>
                  <td style={{ padding: '12px 16px', color: T.grey1 }}>{sp.email}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, letterSpacing: '0.5px', color: T.black }}>{sp.coupon_code}</td>
                  <td style={{ padding: '12px 16px', color: T.black }}>{sp.commission_pct}%</td>
                  <td style={{ padding: '12px 16px', color: T.black }}>{sp.total_sales}</td>
                  <td style={{ padding: '12px 16px', color: T.black }}>{money(sp.total_earned)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: T.black }}>{money(sp.pending_balance)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: sp.status === 'active' ? T.okBg : T.grey4,
                      color: sp.status === 'active' ? T.ok : T.grey1,
                      border: `1px solid ${sp.status === 'active' ? T.okBdr : T.grey3}`,
                      textTransform: 'capitalize',
                    }}>
                      {sp.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setConfirmTarget({ id: sp.id, name: sp.name })}
                      disabled={Number(sp.pending_balance) <= 0}
                      className="btn btn-secondary"
                      style={{ fontSize: 11.5 }}
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

      {confirmTarget && (
        <ConfirmDialog
          title="Mark Payout as Paid"
          message={`Clear ${confirmTarget.name}'s pending balance? Only do this after you've sent the M-Pesa payout.`}
          confirmLabel={markingPaid ? 'Marking…' : 'Confirm'}
          onConfirm={handleMarkPaid}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

export default AffiliateManagement;