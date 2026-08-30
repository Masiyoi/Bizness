// src/pages/profile/SalespersonDashboard.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import type { User } from '../../constants/theme';

interface OutletCtx { user: User; setUser: (u: User) => void; }

interface AffiliateStats {
  isAffiliate: boolean;
  coupon_code: string;
  commission_pct: string | number;
  status: string;
  created_at: string;
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
const PAGE_SIZE = 10;
const money = (v: string | number) =>
  `KSh ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
const formatDate = (v: string) =>
  new Date(v).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const lastDayOfMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export default function SalespersonDashboard() {
  const { user } = useOutletContext<OutletCtx>();

  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [orders, setOrders]               = useState<SalespersonOrder[]>([]);
  const [ordersTotal, setOrdersTotal]     = useState(0);
  const [monthFilter, setMonthFilter]     = useState('');
  const [dayFilter, setDayFilter]         = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get('/api/affiliate/me');
        const body = res.data;

        if (!body?.isAffiliate) {
          if (!cancelled) { setStats(null); setLoading(false); }
          return;
        }

        if (!cancelled) { setStats({ isAffiliate: true, ...body.data }); setLoading(false); }
      } catch (err) {
        console.error(err);
        if (!cancelled) { setError('Could not load your affiliate stats. Please try again.'); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, []);  const fetchOrders = async (opts: { reset?: boolean; monthOverride?: string; dayOverride?: string } = {}) => {
    const month  = opts.monthOverride !== undefined ? opts.monthOverride : monthFilter;
    const day    = opts.dayOverride   !== undefined ? opts.dayOverride   : dayFilter;
    const offset = opts.reset ? 0 : orders.length;
    setLoadingOrders(true);
    try {
      const res = await axios.get('/api/affiliate/me/earnings', {
        params: { month: month || undefined, day: day || undefined, limit: PAGE_SIZE, offset },
      });
      const { data, total } = res.data;
      setOrders(prev => (opts.reset ? data : [...prev, ...data]));
      setOrdersTotal(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };
  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
    setDayFilter('');
    fetchOrders({ reset: true, monthOverride: value, dayOverride: '' });
  };
  const handleDayChange = (value: string) => {
    setDayFilter(value);
    fetchOrders({ reset: true, dayOverride: value });
  };
  useEffect(() => {
    if (stats?.isAffiliate) fetchOrders({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.isAffiliate]);

  const copyCode = async () => {
    if (!stats?.coupon_code) return;
    try {
      await navigator.clipboard.writeText(stats.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '60px 0', textAlign: 'center', color: '#888' }}>
        Loading your affiliate dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", padding: '40px 0', textAlign: 'center', color: '#B3261E' }}>
        {error}
      </div>
    );
  }

  // Not (yet) an approved affiliate — point them back to the application flow.
  if (!stats || !stats.isAffiliate) {
    return (
      <div style={{
        fontFamily: "'DM Sans',sans-serif",
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.09)',
        borderRadius: 16,
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>
          You're not an approved salesperson yet
        </div>
        <p style={{ fontSize: 13, color: '#666', maxWidth: 420, margin: '0 auto' }}>
          Apply to become a salesperson to get your own coupon code and start earning 10% commission on every sale.
        </p>
      </div>
    );
  }

  const cards = [
    { label: 'Coupon Code', value: stats.coupon_code, isCode: true },
    { label: 'Commission Rate', value: `${stats.commission_pct}%` },
    { label: 'Total Sales', value: stats.total_sales },
    { label: 'Total Earned', value: money(stats.total_earned) },
    { label: 'Pending Payout', value: money(stats.pending_balance) },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.75)), url('/ganji.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 16,
        padding: 'clamp(28px,4vw,44px)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        <div style={{
          position: 'absolute', zIndex: 0, width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(200,169,81,0.14) 0%,transparent 70%)',
          top: -80, right: -60, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            color: '#E8CD7A', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Salesperson Dashboard
          </div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
                        Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>

          <div
            onClick={copyCode}
            role="button"
            title="Click to copy"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(232,205,122,0.5)',
              borderRadius: 8,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '2px', color: '#E8CD7A' }}>
              {stats.coupon_code}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              {copied ? 'Copied!' : 'Tap to copy'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {cards.filter(c => !c.isCode).map(c => (
          <div key={c.label} style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
            padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 700,
              color: c.label === 'Total Earned' ? '#E67E22' : c.label === 'Pending Payout' ? '#2E7D32' : '#0A1628',
            }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Payout info ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        padding: '18px 22px', fontSize: 13, color: '#444', lineHeight: 1.85,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <strong>Payouts</strong> are processed instantly via M-Pesa once your pending balance reaches KSh 500. Share your code — <strong style={{ color: '#B8860B' }}>{stats.coupon_code}</strong> — with your audience to keep earning. Questions? Reach us at{' '}
        <a href="mailto:lukuprime254@gmail.com" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>lukuprime254@gmail.com</a>.
      </div>
      {/* ── Order History ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        padding: '22px 22px 26px', marginTop: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Orders You've Sold
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="month"
              value={monthFilter}
              onChange={e => handleMonthChange(e.target.value)}
              style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: '6px 10px',
                border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, background: '#fff', color: '#0A1628',
              }}
            />
            {monthFilter && (
              <input
                type="date"
                value={dayFilter}
                onChange={e => handleDayChange(e.target.value)}
                min={`${monthFilter}-01`}
                max={`${monthFilter}-${String(lastDayOfMonth(monthFilter)).padStart(2, '0')}`}
                style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: '6px 10px',
                  border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, background: '#fff', color: '#0A1628',
                }}
              />
            )}
          </div>
        </div>
        {loadingOrders && orders.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: 12 }}>Loading orders…</div>
        )}
        {!loadingOrders && orders.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: 12 }}>
            {monthFilter ? 'No orders in this period.' : "You haven't sold any orders yet."}
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
                  padding: '10px 14px', background: '#FAFAFA',
                  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
                }}
              >
                <img
                  src={firstItem?.image_url}
                  alt={firstItem?.name || 'Product'}
                  style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#eee' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/44x44/F5F5F5/000?text=LP'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0A1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firstItem?.name || 'Item'}{extraCount > 0 ? ` +${extraCount} more` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    Order {order.order_number || `#${order.order_id}`} · {formatDate(order.order_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0A1628' }}>{money(order.commission_amount)}</div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: order.payout_status === 'paid' ? '#E8F5E9' : '#F0F0F0',
                    color: order.payout_status === 'paid' ? '#2E7D32' : '#999',
                    textTransform: 'capitalize',
                  }}>
                    {order.payout_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {orders.length < ordersTotal && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              onClick={() => fetchOrders()}
              disabled={loadingOrders}
              style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)',
                background: '#fff', color: '#0A1628', cursor: 'pointer',
              }}
            >
              {loadingOrders ? 'Loading…' : 'View More Orders'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}