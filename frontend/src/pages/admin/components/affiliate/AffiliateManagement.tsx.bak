// src/pages/admin/components/affiliate/AffiliateManagement.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
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

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface SalespersonOrder {
  earning_id: number;
  commission_amount: string | number;
  payout_status: string;
  earning_created_at: string;
  order_id: number;
  order_number: string | null;
  total: string | number;
  order_date: string;
  items_snapshot: { items?: OrderItem[] } | null;
}

interface AffiliateManagementProps {
  showToast: (msg: string, type?: string) => void;
}

const PAGE_SIZE = 5;

const money = (v: string | number) =>
  `KSh ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;

const formatDate = (v: string) =>
  new Date(v).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const lastDayOfMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

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

  // per-salesperson expandable order history
  const [expandedId, setExpandedId]           = useState<number | null>(null);
  const [ordersMap, setOrdersMap]             = useState<Record<number, SalespersonOrder[]>>({});
  const [ordersTotalMap, setOrdersTotalMap]   = useState<Record<number, number>>({});
  const [monthFilterMap, setMonthFilterMap]   = useState<Record<number, string>>({});
  const [dayFilterMap, setDayFilterMap]       = useState<Record<number, string>>({});
  const [loadingOrdersMap, setLoadingOrdersMap] = useState<Record<number, boolean>>({});

  const loadSalespersons = async () => {
    try {
      const res = await axios.get('/api/affiliate/salespersons');
      setSalespersons(res.data.data);
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
      const res = await axios.post('/api/affiliate/salespersons', {
        email: email.trim(),
        fullName: fullName.trim(),
        commissionPct: commissionPct ? Number(commissionPct) : undefined,
      });

      const salesperson = res.data.data;
      showToast(`✓ Added ${fullName} — code ${salesperson.coupon_code}`);
      setEmail(''); setFullName(''); setCommissionPct('');
      loadSalespersons();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add salesperson', 'err');
    } finally {
      setAdding(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirmTarget) return;
    setMarkingPaid(true);
    try {
      await axios.patch(`/api/affiliate/salespersons/${confirmTarget.id}/payout`);

      showToast('✓ Payout marked as paid');
      loadSalespersons();
      // Refresh this salesperson's order list too, if it's open, so payout badges update
      if (expandedId === confirmTarget.id) {
        fetchOrders(confirmTarget.id, { reset: true });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to mark payout as paid', 'err');
    } finally {
      setMarkingPaid(false);
      setConfirmTarget(null);
    }
  };

  // ── Order history (expandable per row) ──────────────────────────────────
  const fetchOrders = async (
    spId: number,
    opts: { reset?: boolean; monthOverride?: string; dayOverride?: string } = {}
  ) => {
    const month  = opts.monthOverride !== undefined ? opts.monthOverride : (monthFilterMap[spId] || '');
    const day    = opts.dayOverride !== undefined ? opts.dayOverride : (dayFilterMap[spId] || '');
    const offset = opts.reset ? 0 : (ordersMap[spId]?.length || 0);

    setLoadingOrdersMap(prev => ({ ...prev, [spId]: true }));
    try {
      const res = await axios.get(`/api/affiliate/salespersons/${spId}/orders`, {
        params: { month: month || undefined, day: day || undefined, limit: PAGE_SIZE, offset },
      });
      const { data, total } = res.data;
      setOrdersMap(prev => ({
        ...prev,
        [spId]: opts.reset ? data : [...(prev[spId] || []), ...data],
      }));
      setOrdersTotalMap(prev => ({ ...prev, [spId]: total }));
    } catch (err) {
      console.error(err);
      showToast('Failed to load orders', 'err');
    } finally {
      setLoadingOrdersMap(prev => ({ ...prev, [spId]: false }));
    }
  };

  const toggleExpand = (spId: number) => {
    if (expandedId === spId) { setExpandedId(null); return; }
    setExpandedId(spId);
    if (!ordersMap[spId]) fetchOrders(spId, { reset: true });
  };

  const handleMonthChange = (spId: number, value: string) => {
    setMonthFilterMap(prev => ({ ...prev, [spId]: value }));
    setDayFilterMap(prev => ({ ...prev, [spId]: '' }));
    fetchOrders(spId, { reset: true, monthOverride: value, dayOverride: '' });
  };
  const handleDayChange = (spId: number, value: string) => {
    setDayFilterMap(prev => ({ ...prev, [spId]: value }));
    fetchOrders(spId, { reset: true, dayOverride: value });
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
              {salespersons.map(sp => {
                const isExpanded  = expandedId === sp.id;
                const orders      = ordersMap[sp.id] || [];
                const total       = ordersTotalMap[sp.id] ?? 0;
                const isLoading   = !!loadingOrdersMap[sp.id];
                const hasMore     = orders.length < total;

                return (
                  <>
                    <tr
                      key={sp.id}
                      onClick={() => toggleExpand(sp.id)}
                      style={{ borderBottom: `1px solid ${T.grey3}`, cursor: 'pointer', background: isExpanded ? T.grey6 : 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: T.black }}>
                        <span style={{ display: 'inline-block', width: 12, color: T.grey1, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▸</span>
                        {' '}{sp.name}
                      </td>
                      <td style={{ padding: '12px 16px', color: T.grey1 }}>
                          <a
                          href={`mailto:${sp.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{ color: T.grey1, textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {sp.email}
                        </a>
                      </td>
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
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget({ id: sp.id, name: sp.name }); }}
                          disabled={Number(sp.pending_balance) <= 0}
                          className="btn btn-secondary"
                          style={{ fontSize: 11.5 }}
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${sp.id}-orders`} style={{ borderBottom: `1px solid ${T.grey3}` }}>
                        <td colSpan={9} style={{ padding: '16px 20px 20px', background: T.grey6 }}>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                              Order History
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="month"
                                value={monthFilterMap[sp.id] || ''}
                                onChange={e => handleMonthChange(sp.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontFamily: "'Jost',sans-serif", fontSize: 12, padding: '6px 10px',
                                  border: `1px solid ${T.grey3}`, borderRadius: 6, background: T.white, color: T.black,
                                }}
                              />
                              {monthFilterMap[sp.id] && (
                                <input
                                  type="date"
                                  value={dayFilterMap[sp.id] || ''}
                                  onChange={e => handleDayChange(sp.id, e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  min={`${monthFilterMap[sp.id]}-01`}
                                  max={`${monthFilterMap[sp.id]}-${String(lastDayOfMonth(monthFilterMap[sp.id])).padStart(2, '0')}`}
                                  style={{
                                    fontFamily: "'Jost',sans-serif", fontSize: 12, padding: '6px 10px',
                                    border: `1px solid ${T.grey3}`, borderRadius: 6, background: T.white, color: T.black,
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {isLoading && orders.length === 0 && (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: T.grey1, fontSize: 12 }}>Loading orders…</div>
                          )}

                          {!isLoading && orders.length === 0 && (
                            <div style={{ padding: '20px 0', textAlign: 'center', color: T.grey1, fontSize: 12 }}>
                              {monthFilterMap[sp.id] ? 'No orders in this month.' : 'No orders yet for this salesperson.'}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {orders.map(order => {
                              const items      = order.items_snapshot?.items || [];
                              const firstItem  = items[0];
                              const extraCount = items.length - 1;

                              return (
                                <div
                                  key={order.earning_id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', background: T.white,
                                    border: `1px solid ${T.grey3}`, borderRadius: 8,
                                  }}
                                >
                                  <img
                                    src={firstItem?.image_url}
                                    alt={firstItem?.name || 'Product'}
                                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: T.grey5 }}
                                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/44x44/F5F5F5/000?text=LP'; }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {firstItem?.name || 'Item'}{extraCount > 0 ? ` +${extraCount} more` : ''}
                                    </div>
                                    <div style={{ fontSize: 11, color: T.grey1, marginTop: 2 }}>
                                      Order {order.order_number || `#${order.order_id}`} · {formatDate(order.order_date)}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: T.black }}>{money(order.commission_amount)}</div>
                                    <span style={{
                                      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                      background: order.payout_status === 'paid' ? T.okBg : T.grey4,
                                      color: order.payout_status === 'paid' ? T.ok : T.grey1,
                                      textTransform: 'capitalize',
                                    }}>
                                      {order.payout_status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {hasMore && (
                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); fetchOrders(sp.id); }}
                                disabled={isLoading}
                                className="btn btn-secondary"
                                style={{ fontSize: 11.5 }}
                              >
                                {isLoading ? 'Loading…' : 'View More Orders'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
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